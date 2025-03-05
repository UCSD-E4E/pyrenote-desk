# This file is a placeholder for the inference script. A sample dataframe is created to model the result of the inference script. Then, the script analyzes the data and inserts relevant information into the database
import pandas as pd
import sqlite3
import sys
from datetime import datetime
import os

# For dataloader and dataset simulation (assuming torch is used)
from torch.utils.data import DataLoader, Dataset


# DbHelper class to handle database operations as a singleton
class DBHelper:
    _instance = None

    def __new__(cls, db_url="pyrenoteDeskDatabase.db"):
        if cls._instance is None:
            cls._instance = super(DBHelper, cls).__new__(cls)
            # For the pseudo db url, using in-memory database as a placeholder
            script_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(script_dir, f"../{db_url}")
            cls._instance.connection = sqlite3.connect(db_path)
            cls._instance.cursor = cls._instance.connection.cursor()
            # Create a pseudo result table if not exists
            cls._instance.cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS Result (
                    id INTEGER PRIMARY KEY,
                    url TEXT,
                    species TEXT
                )
                """
            )
            cls._instance.connection.commit()
        return cls._instance

    def insert_result(self, id, url, species):
        """
        Insert the inference result into the Result table.
        """
        self.cursor.execute(
            "INSERT INTO Result (id, url, species) VALUES (?, ?, ?)",
            (id, url, species),
        )
        self.connection.commit()

    def fetch_recordings(self, recording_ids):
        """
        Fetch recordings from the Recording table based on recording_ids.
        Returns a list of tuples (recordingId, url).
        For this pseudo code, a dummy list is returned.
        """
        # In a real scenario, this would execute a query like:
        # SELECT recordingId, url FROM Recording WHERE recordingId IN (?,?,...)
        # For now, we simulate with dummy data.
        dummy_data = [
            (rec_id, self.cursor.execute) for rec_id in recording_ids
        ]

        self.cursor.execute(
            "SELECT recordingId, url FROM Recording WHERE recordingId = ?",
            recording_ids,
        )

        data = self.cursor.fetchall()

        return data


class VideoDataset(Dataset):
    def __init__(self, samples):
        """
        Initialize the dataset with a list of samples.
        Each sample is a dictionary containing 'id' and 'video' keys.
        """
        self.samples = samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        return self.samples[index]


def download_video(url):
    """
    Simulate downloading video content from the given URL.
    In a real scenario, this function would perform an actual download.
    Here, we simply return dummy video content.
    """
    # If the file exists locally, you could read its binary content.
    # Otherwise, return a dummy string representing the video content.
    if os.path.exists(url):
        with open(url, "rb") as f:
            return f.read()
    return f"Dummy video content from {os.path.basename(url)}"


def get_dataloader_for_recordings(recording_ids, classes, cfg):
    """
    Given a list of recordingIds, fetch the corresponding recording URLs from the Recording table,
    download the videos (.wav files) and construct a DataLoader.
    The dataset contains only the video content (along with recording id).
    If video content is None for a recording, that recording is skipped.
    Returns the DataLoader (or None if no video available) and the original list of recording IDs.
    """
    db_helper = DBHelper()
    # Fetch recording details (simulated based on Recording table schema)
    recordings = db_helper.fetch_recordings(recording_ids)

    # Download each video from its URL and create a list of samples
    samples = []
    for rec in recordings:
        rec_id, url = rec
        video = download_video(url)
        # Do not process if video is None
        if video is None:
            continue
        sample = {"id": rec_id, "video": video}
        samples.append(sample)

    # Only create a VideoDataset if there are valid samples
    if samples:
        video_dataset = VideoDataset(samples)
        dataloader = DataLoader(
            video_dataset,
            batch_size=cfg.validation_batch_size,
            shuffle=False,
            num_workers=cfg.jobs,
        )
    else:
        dataloader = None

    return dataloader, recording_ids


def process_result(result_df):
    """
    Process the inference result DataFrame.
    The DataFrame contains probability columns for different labels (e.g., Amxxx columns).
    For each row, determine the label with the highest probability (argmax) and return a DataFrame
    with id and the final predicted species.
    Then, save the result into the pseudo Result table in the database using DBHelper.
    """
    result_df = result_df.copy()
    # Assuming the result_df has an 'id' column and the rest probability columns
    prob_columns = [col for col in result_df.columns if col != "id"]
    # Get the prediction as the column name with the maximal probability
    result_df["prediction"] = result_df[prob_columns].idxmax(axis=1)
    final_df = result_df[["id", "prediction"]].rename(columns={"prediction": "species"})

    # Insert each result into the Result table using DBHelper
    db_helper = DBHelper()
    for _, row in final_df.iterrows():
        db_helper.insert_result(
            row["id"],  # assuming id corresponds to a result id
            "",  # URL can be inserted if available
            row["species"],
        )
    return final_df


# def process_audio_files(file_paths):
#    """
#    Process audio files and simulate feature extraction.
#    Each file path is processed to extract file attributes and a placeholder feature vector.
#    """
#    results = []
#    # Use enumerate to generate unique IDs
#    for idx, file_path in enumerate(file_paths, start=1):
#        file_name = os.path.basename(file_path)  # gets just the file name from the path
#        # Simulate extracting a feature vector from the audio file (placeholder values)
#        feature_vector = [0.453, 0.873]
#        result = {
#            "FILE NAME": file_name,
#            "id": idx,
#            "Amabaw1_x": feature_vector[0],
#            "Amapyo1_y": feature_vector[1],
#        }
#        results.append(result)
#    return pd.DataFrame(results)


# Sample DataFrame
data = {
    "FILE NAME": ["file1.wav", "file2.wav", "file3.wav"],
    "id": [1, 2, 3],
    "Amabaw1_x": [0.453, 0.234, 0.895],
    "Amapyo1_y": [0.873, 0.657, 0.345],
    # "Amabxxxx": .....
}
eval_df = pd.DataFrame(data)
# ^eval_df can now be replaced with process_audio_files(file_paths)

# Identify the bird species with the highest probability and simply include that in the final data frame
species_columns = [
    col
    for col in eval_df.columns
    if col not in ["FILE NAME", "id"] and pd.api.types.is_numeric_dtype(eval_df[col])
]
eval_df[species_columns] = eval_df[species_columns].apply(
    pd.to_numeric, errors="coerce"
)
eval_df["Probability"] = eval_df[species_columns].max(axis=1)
eval_df["Species Name"] = eval_df[species_columns].idxmax(axis=1)
eval_df = eval_df[["FILE NAME", "Probability", "Species Name"]]

# Connect to SQLite database
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "../pyrenoteDeskDatabase.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Placeholder data to insert into annotations folder
region_id = 1
labeler_id = 2
annotation_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
most_recent = True

# Ensure that the species ID that is getting inserted exists in the species table
cursor.execute("SELECT speciesId, species FROM Species")
species_records = cursor.fetchall()
species_mapping = {record[1]: record[0] for record in species_records}
eval_df["speciesId"] = eval_df["Species Name"].map(species_mapping)
unmapped_species = eval_df[eval_df["speciesId"].isnull()]
if not unmapped_species.empty:
    print("The following species are unmapped:")
    print(unmapped_species["Species Name"].unique())
    raise ValueError(
        "Species mapping has an error - the data has a species that does not exist in DB: You need to add more species in the database OR you need to check the data for species that are unmapped"
    )

# Inserts data into the annotations table in bulk
annotation_data = [
    (
        region_id,
        labeler_id,
        annotation_date,
        row["speciesId"],
        row["Probability"],
        most_recent,
    )
    for _, row in eval_df.iterrows()
]
try:
    cursor.executemany(
        """
        INSERT INTO Annotation (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent)
        VALUES (?, ?, ?, ?, ?, ?)
    """,
        annotation_data,
    )
    conn.commit()
    print("Annotations inserted successfully.")
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    conn.rollback()
finally:
    conn.close()

sys.stdout.flush()


def pseudo_inference(model_input):
    """
    Pseudo inference function that takes model inputs and returns a simulated prediction.
    For each input vector, if the sum is greater than a threshold, return 'Species_A', else 'Species_B'.
    """
    predictions = []
    for input_vector in model_input:
        # Dummy inference logic
        prediction = "Species_A" if sum(input_vector) > 1.0 else "Species_B"
        predictions.append(prediction)
    return predictions


# Example usage of new functions (for debugging purposes)
if __name__ == "__main__":

    # Get the recording ID from the command line argument
    if len(sys.argv) > 1:
        recording_id = sys.argv[1]
        print(f"Received recording ID: {recording_id}")
    else:
        print("Input was empty\n")
    
    # Create a dummy config object with necessary attributes
    class Config:
        validation_batch_size = 1
        jobs = 0

    cfg = Config()

    # Dummy species classes list (not used here since dataset only carries video data)
    dummy_classes = []

    # Test get_dataloader_for_recordings with two recording ids [1, 2]
    dataloader, rec_ids = get_dataloader_for_recordings(recording_id, dummy_classes, cfg)
    print("Generated DataLoader for recording IDs:", rec_ids)
    for batch in dataloader:
        print("Batch:")
        print(batch)

    # # Create a dummy inference result DataFrame (simulate global inference result)
    # dummy_result_data = {
    #     "id": [1, 2, 3],
    #     "Amabaw1_x": [0.453, 0.234, 0.895],
    #     "Amapyo1_y": [0.873, 0.657, 0.345],
    # }
    # result_df = pd.DataFrame(dummy_result_data)

    # # Process inference results and save them into the pseudo Result table
    # final_predictions = process_result(result_df)
    # print("Final predictions saved:")
    # print(final_predictions)
