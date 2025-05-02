# This file is a placeholder for the inference script. A sample dataframe is created to model the result of the inference script. Then, the script analyzes the data and inserts relevant information into the database
import pandas as pd
import sqlite3
import sys
from datetime import datetime
import os
import filecmp

# For dataloader and dataset simulation (assuming torch is used)
from torch.utils.data import DataLoader, Dataset
import torch


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
        return cls._instance

    def fetch_recordings(self, recording_ids):
        """
        Fetch recordings from the Recording table based on recording_ids.
        Returns a list of tuples (recordingId, url).
        """
        # Convert single id to list if needed
        if not isinstance(recording_ids, list):
            recording_ids = [recording_ids]
        
        placeholders = ','.join(['?'] * len(recording_ids))
        query = f"SELECT recordingId, url FROM Recording WHERE recordingId IN ({placeholders})"
        
        # Convert to tuple for query execution
        self.cursor.execute(query, tuple(recording_ids))
        data = self.cursor.fetchall()
        
        return data

    def insert_annotation(self, region_id, labeler_id, annotation_date, speciesId, speciesProbability, most_recent):
        """
        Insert or update an annotation record. If a record with the same unique key exists,
        it will be replaced.
        """
        self.cursor.execute(
            """
            INSERT OR REPLACE INTO Annotation 
            (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (region_id, labeler_id, annotation_date, speciesId, speciesProbability, most_recent),
        )
        self.connection.commit()

    def save_recording_file(self, flac_file_path):
        """
        Save a recording file (.flac) to the hidden .recordings directory in the current working directory.
        If the directory doesn't exist, it will be created.
        
        Args:
            flac_file_path: Path to the flac file to save
        
        Returns:
            str: Path to the saved file in the .recordings directory
        """
        # Check if the file exists
        if not os.path.exists(flac_file_path):
            raise FileNotFoundError(f"Recording file not found: {flac_file_path}")
        
        # Ensure the file is a .flac file
        if not flac_file_path.lower().endswith('.flac'):
            raise ValueError(f"File must be a .flac file: {flac_file_path}")
        
        # Check if .recordings directory exists, create if not
        recordings_dir = os.path.join(os.getcwd(), '.recordings')
        if not os.path.exists(recordings_dir):
            os.makedirs(recordings_dir)
            print(f"Created hidden directory: {recordings_dir}")
        
        # Copy the file to .recordings directory
        filename = os.path.basename(flac_file_path)
        destination_path = os.path.join(recordings_dir, filename)
        
        # Copy the file if it doesn't exist or is different
        if not os.path.exists(destination_path) or not filecmp.cmp(flac_file_path, destination_path):
            import shutil
            shutil.copy2(flac_file_path, destination_path)
            print(f"Saved recording to: {destination_path}")
        else:
            print(f"Recording already exists at: {destination_path}")
        
        return destination_path

    def insert_recording(self, recording_id, deployment_id, filename, url):
        """
        Insert a new recording into the Recording table.
        Get datetime and duration from the flac file at the given URL.
        
        Args:
            recording_id: The ID for the new recording
            deployment_id: The deployment ID this recording belongs to
            filename: Name of the recording file
            url: URL to the recording file (should be in .recordings directory)
            
        Returns:
            bool: True if insertion was successful
        """
        # Check if the file exists at the given URL
        if not os.path.exists(url):
            raise FileNotFoundError(f"Recording file not found at URL: {url}")
        
        try:
            # Get datetime and duration from the flac file
            # In a real implementation, you would use a library like mutagen to get these values
            # Here we're using dummy values for demonstration
            import datetime as dt
            from mutagen.flac import FLAC
            
            try:
                # Try to get actual metadata from the FLAC file
                audio = FLAC(url)
                # Get duration in seconds
                duration = audio.info.length
                
                # Try to get date from metadata (if available)
                # This is just an example - actual metadata may vary
                if 'date' in audio:
                    # Parse date with datetime if it's in a standard format
                    date_str = audio['date'][0]
                    recorded_datetime = dt.datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                else:
                    # Use file modification time if no date metadata
                    recorded_datetime = dt.datetime.fromtimestamp(os.path.getmtime(url))
                    
            except Exception as e:
                # If parsing fails, use current time and default duration
                print(f"Could not read metadata from file, using defaults: {e}")
                recorded_datetime = dt.datetime.now()
                duration = 30.0  # Default 30 seconds duration
                
            # Format datetime as string for SQLite
            datetime_str = recorded_datetime.strftime("%Y-%m-%d %H:%M:%S")
            
            # Execute the insert query
            self.cursor.execute(
                """
                INSERT OR REPLACE INTO Recording 
                (recordingId, deploymentId, filename, url, datetime, duration)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (recording_id, deployment_id, filename, url, datetime_str, duration)
            )
            
            self.connection.commit()
            print(f"Recording inserted successfully with ID: {recording_id}")
            return True
            
        except Exception as e:
            print(f"Error inserting recording: {e}")
            self.connection.rollback()
            return False


def download_url(url):
    """
    Download content from the given URL.
    Supports both audio (.wav, .flac, etc) and video files.
    """
    # If the file exists locally, read its binary content
    if os.path.exists(url):
        with open(url, "rb") as f:
            return f.read()
    
    # For network URLs (not implemented here)
    # In a real scenario, you'd use requests or another library
    return f"Dummy content from {os.path.basename(url)}"


class AudioDataset(Dataset):
    def __init__(self, samples):
        """
        Initialize the dataset with a list of samples.
        Each sample is a dictionary containing 'id' and 'audio' keys.
        
        Args:
            samples: List of dictionaries with 'id' and 'audio' keys
        """
        self.samples = samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        return self.samples[index]


def get_dataloader_for_recordings(recording_ids, classes, cfg):
    """
    Given a list of recordingIds, fetch the corresponding recording URLs from the Recording table,
    download the audio/video files and construct a DataLoader.
    The dataset contains only the audio content (along with recording id).
    
    Args:
        recording_ids: List of recording IDs or a single recording ID
        classes: List of species classes (not used here but kept for compatibility)
        cfg: Configuration object with batch_size and other parameters
        
    Returns:
        dataloader: DataLoader object for the audio dataset
        recording_ids: The original list of recording IDs
    """
    db_helper = DBHelper()
    # Fetch recording details from Recording table
    recordings = db_helper.fetch_recordings(recording_ids)

    # Download each audio file from its URL and create a list of samples
    samples = []
    for rec in recordings:
        rec_id, url = rec
        audio = download_url(url)
        sample = {"id": rec_id, "audio": audio}
        samples.append(sample)

    # Create an AudioDataset with the samples
    audio_dataset = AudioDataset(samples)
    
    # Create DataLoader with specified batch size and workers
    dataloader = DataLoader(
        audio_dataset,
        batch_size=cfg.validation_batch_size,
        shuffle=False,
        num_workers=cfg.jobs,
    )
    
    # Convert single id to list if needed for return
    if not isinstance(recording_ids, list):
        recording_ids = [recording_ids]
        
    return dataloader, recording_ids


def process_result(result_df):
    """
    Process the inference result DataFrame.
    For each row (containing an 'id' and probability columns), determine the column with the highest probability
    (i.e. the predicted species) and its value, then store the result into the Annotation table under speciesId
    and speciesProbability. If a record exists, it will be updated.
    """
    result_df = result_df.copy()
    # Exclude the id column to get probability columns
    prob_columns = [col for col in result_df.columns if col != "id"]
    # Determine predicted species and corresponding max probability
    result_df["prediction"] = result_df[prob_columns].idxmax(axis=1)
    result_df["maxProbability"] = result_df[prob_columns].max(axis=1)
    
    # Retrieve species mapping from Species table: {species_name: speciesId}
    db_helper = DBHelper()
    db_helper.cursor.execute("SELECT speciesId, species FROM Species")
    species_records = db_helper.cursor.fetchall()
    species_mapping = {record[1]: record[0] for record in species_records}
    
    # Use global values for region, labeler, and annotation metadata (assumed to be defined)
    global region_id, labeler_id, annotation_date, most_recent
    
    # For each result, insert/update annotation record
    for _, row in result_df.iterrows():
        pred_species = row["prediction"]
        speciesProb = row["maxProbability"]
        if pred_species not in species_mapping:
            print(f"Species '{pred_species}' not found in Species table. Skipping record id {row['id']}.")
            continue
        speciesId = species_mapping[pred_species]
        db_helper.insert_annotation(region_id, labeler_id, annotation_date, speciesId, speciesProb, most_recent)
    
    final_df = result_df[["id", "prediction", "maxProbability"]].rename(columns={"prediction": "species"})
    return final_df


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
    # Get the recording ID(s) from the command line argument
    if len(sys.argv) > 1:
        # Check if the input contains commas (comma-separated list)
        if ',' in sys.argv[1]:
            recording_ids = [int(id_str.strip()) for id_str in sys.argv[1].split(',')]
            print(f"Processing recording IDs: {recording_ids}")
        # Check if input looks like a Python list (e.g. ["111", "222"])
        elif '[' in sys.argv[1] and ']' in sys.argv[1]:
            # Extract numbers from the string representation of a list
            import re
            ids_text = sys.argv[1].strip('[]')
            recording_ids = [int(id_str) for id_str in re.findall(r'\d+', ids_text)]
            print(f"Processing recording IDs: {recording_ids}")
        else:
            # Single ID
            recording_ids = int(sys.argv[1])  # Convert to integer
            print(f"Processing recording ID: {recording_ids}")
    else:
        print("Error: Please provide recording ID(s)")
        print("Usage: python script.py <recording_id> OR python script.py <id1,id2,id3> OR python script.py [\"id1\",\"id2\"]")
        sys.exit(1)
    
    # Create a dummy config object with necessary attributes
    class Config:
        validation_batch_size = 2  # Increased to show batch processing
        jobs = 0
    cfg = Config()

    # Dummy species classes list
    dummy_classes = []

    # Test get_dataloader_for_recordings with the provided recording ID(s)
    dataloader, rec_ids = get_dataloader_for_recordings(recording_ids, dummy_classes, cfg)
    print(f"Generated DataLoader for recording IDs: {rec_ids}")
    
    # Print batch information
    for i, batch in enumerate(dataloader):
        print(f"Batch {i+1}:")
        print(f"  Recording ID(s): {batch['id']}")
        print(f"  Audio data size(s): {[len(audio) for audio in batch['audio']]} bytes")
    
    # Create a dummy inference result DataFrame with the recording ID(s)
    # For a list of IDs, create multiple rows in the result
    if isinstance(recording_ids, list):
        dummy_result_data = {
            "id": recording_ids,
            "Amabaw1_x": [0.453] * len(recording_ids),
            "Amapyo1_y": [0.873] * len(recording_ids),  # This will be the prediction since it's higher
        }
    else:
        dummy_result_data = {
            "id": [recording_ids],
            "Amabaw1_x": [0.453],
            "Amapyo1_y": [0.873],
        }
    
    result_df = pd.DataFrame(dummy_result_data)
    
    # Process inference results and save them into the Result table
    final_predictions = process_result(result_df)
    print("Final predictions saved to database:")
    print(final_predictions)
