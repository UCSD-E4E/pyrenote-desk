# This file is a placeholder for the inference script. A sample dataframe is created to model the result of the inference script. Then, the script analyzes the data and inserts relevant information into the database
import pandas as pd
import sqlite3
import sys
import datetime as dt
from datetime import datetime
import os
import filecmp
from mutagen import File as MutagenFile
import argparse
import platform
from pathlib import Path

# For dataloader and dataset simulation (assuming torch is used)
from torch.utils.data import DataLoader, Dataset
import torch


# DbHelper class to handle database operations as a singleton
class DBHelper:
    _instance = None

    def __new__(cls, db_url="pyrenoteDeskDatabase.db"):
        if cls._instance is None:
            cls._instance = super(DBHelper, cls).__new__(cls)
            #fall back to normal DB
            if db_url is None:
                db_url = "pyrenoteDeskDatabase.db"
            # For the pseudo db url, using in-memory database as a placeholder
            # script_dir = os.path.dirname(os.path.abspath(__file__))
            # db_path = os.path.join(script_dir, f"../{db_url}")
            if not os.path.isabs(db_url):
                script_dir = os.path.dirname(os.path.abspath(__file__))
                db_path = os.path.join(script_dir, f"../{db_url}")
                print("dp_path is ", db_path)
            else:
                db_path = db_url
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

    def save_recording_file(self, audio_file_path, dest_path=None):
        """
        Save an audio file to a specified location.
        If dest_path is not provided, defaults to hidden .recordings directory.
        
        Args:
            audio_file_path: Path to the source audio file
            dest_path: Optional destination directory or full file path
        Returns:
            str: Path to the saved file
        """
        # Check if source exists
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Recording file not found: {audio_file_path}")
        
        # Ensure supported audio format
        supported_ext = ['.flac', '.mp3', '.wav', '.aac', '.m4a', '.ogg']
        ext = os.path.splitext(audio_file_path)[1].lower()
        if ext not in supported_ext:
            raise ValueError(f"Unsupported audio format '{ext}': {audio_file_path}")
        
        # Determine destination path
        if dest_path:
            # treat dest_path as directory if it already exists or has no file-extension
            ext = os.path.splitext(dest_path)[1]
            if os.path.isdir(dest_path) or ext == "":
                os.makedirs(dest_path, exist_ok=True)
                destination_path = os.path.join(dest_path, os.path.basename(audio_file_path))
            else:
                # specified as full file path
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                destination_path = dest_path
        else:
            # default to hidden .recordings directory
            recordings_dir = os.path.join(os.getcwd(), '.recordings')
            os.makedirs(recordings_dir, exist_ok=True)
            destination_path = os.path.join(recordings_dir, os.path.basename(audio_file_path))
        
        # Copy if new or differs
        if not os.path.exists(destination_path) or not filecmp.cmp(audio_file_path, destination_path):
            import shutil
            shutil.copy2(audio_file_path, destination_path)
            print(f"Saved recording to: {destination_path}")
        else:
            print(f"Recording already exists at: {destination_path}")
        
        return destination_path

    def insert_deployment(self, site_id=1, recorder_id=1, start_date=None, end_date=None, deployed_by='script', note=''):
        """Insert a new deployment record with defaults and return its ID."""
        if start_date is None:
            start_date = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if end_date is None:
            end_date = start_date
        self.cursor.execute(
            "INSERT INTO Deployment (siteId, recorderId, start_date, end_date, deployed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
            (site_id, recorder_id, start_date, end_date, deployed_by, note),
        )
        self.connection.commit()
        return self.cursor.lastrowid

    def insert_recording(self, recording_id=None, deployment_id=None, filename=None, url=None, sample_rate=None, bit_rate=None):
        """
        Parse url for drive prefix, verify and extract full path, then insert into DB.
        """
        # split drive prefix
        if url and '::' in url:
            drive, rel = url.split('::', 1)
            base = DBHelper.find_mount_point(drive)
            full_path = os.path.join(base, rel)
        else:
            full_path = url

        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Recording file not found: {full_path}")

        # metadata extraction uses full_path
        try:
            audio = MutagenFile(full_path)
            duration = audio.info.length if hasattr(audio.info, 'length') else 0.0
            tags = getattr(audio, 'tags', {}) or {}
            date_str = None
            for key in ('date','TDRC','©day'):
                if key in tags:
                    date_str = tags[key][0]; break
            if date_str:
                recorded_datetime = dt.datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
            else:
                recorded_datetime = dt.datetime.fromtimestamp(os.path.getmtime(full_path))
        except Exception:
            recorded_datetime = dt.datetime.now(); duration = 30.0

        datetime_str = recorded_datetime.strftime("%Y-%m-%d %H:%M:%S")

        p = Path(url)
        directory = (str(p.parent) + os.sep) if not str(p.parent).endswith(os.sep) else str(p.parent)

        # actual DB insert
        # Change I Made: saving directory in url rather than the absolute path of the audio file. You can get absolute path by concatenating url + filename instead.
        if recording_id is None:
            # self.cursor.execute(
            #     "INSERT INTO Recording (deploymentId, filename, url, datetime, duration, samplerate, bitrate) VALUES (?, ?, ?, ?, ?, ?, ?)",
            #     (deployment_id, filename, url, datetime_str, duration, sample_rate, bit_rate)
            # )
            self.cursor.execute(
                "INSERT INTO Recording (deploymentId, filename, url, directory, datetime, duration, samplerate, bitrate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (deployment_id, filename, url, directory, datetime_str, duration, sample_rate, bit_rate)
            )
            rec_id = self.cursor.lastrowid
        else:
            # self.cursor.execute(
            #     "INSERT OR REPLACE INTO Recording (recordingId, deploymentId, filename, url, datetime, duration, samplerate, bitrate)"
            #     " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            #     (recording_id, deployment_id, filename, url, datetime_str, duration, sample_rate, bit_rate)
            # )
            self.cursor.execute(
                "INSERT OR REPLACE INTO Recording (recordingId, deploymentId, filename, url, datetime, duration, samplerate, bitrate)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (recording_id, deployment_id, filename, url, directory, datetime_str, duration, sample_rate, bit_rate)
            )
            rec_id = recording_id
        self.connection.commit()
        return rec_id

    @staticmethod
    def find_mount_point(drive_name):
        """Locate mount point for given drive label on current OS."""
        system = platform.system()
        if system == 'Darwin':
            base = '/Volumes'
        elif system == 'Linux':
            base = os.path.join('/media', os.getlogin())
        elif system == 'Windows':
            # Windows drive letter, e.g. 'E'
            base = f"{drive_name.upper()}:\\"
            if os.path.exists(base):
                return base
            raise FileNotFoundError(f"Drive {drive_name} not found at {base}")
        else:
            raise EnvironmentError(f"Unsupported OS: {system}")

        path = os.path.join(base, drive_name)
        if os.path.exists(path):
            return path
        raise FileNotFoundError(f"Drive {drive_name} not mounted under {base}")


def download_url(url):
    """
    Handle drive-prefixed URLs or local paths.
    """
    if url and '::' in url:
        drive, rel = url.split('::',1)
        try:
            base = DBHelper.find_mount_point(drive)
        except Exception as e:
            raise FileNotFoundError(f"Cannot access drive '{drive}': {e}")
        full = os.path.join(base, rel)
    else:
        full = url

    if os.path.exists(full):
        with open(full, "rb") as f:
            return f.read()
    raise FileNotFoundError(f"File not found at {full}")


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
    db_helper = ()
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
    #db_helper = DBHelper()
    db_helper= DBHelper(args.db)
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


# # Sample DataFrame
# data = {
#     "FILE NAME": ["file1.wav", "file2.wav", "file3.wav"],
#     "id": [1, 2, 3],
#     "Amabaw1_x": [0.453, 0.234, 0.895],
#     "Amapyo1_y": [0.873, 0.657, 0.345],
#     # "Amabxxxx": .....
# }
# eval_df = pd.DataFrame(data)
# # ^eval_df can now be replaced with process_audio_files(file_paths)

# # Identify the bird species with the highest probability and simply include that in the final data frame
# species_columns = [
#     col
#     for col in eval_df.columns
#     if col not in ["FILE NAME", "id"] and pd.api.types.is_numeric_dtype(eval_df[col])
# ]
# eval_df[species_columns] = eval_df[species_columns].apply(
#     pd.to_numeric, errors="coerce"
# )
# eval_df["Probability"] = eval_df[species_columns].max(axis=1)
# eval_df["Species Name"] = eval_df[species_columns].idxmax(axis=1)
# eval_df = eval_df[["FILE NAME", "Probability", "Species Name"]]

# # Connect to SQLite database
# script_dir = os.path.dirname(os.path.abspath(__file__))
# db_path = os.path.join(script_dir, "../pyrenoteDeskDatabase.db")
# conn = sqlite3.connect(db_path)
# cursor = conn.cursor()

# # Placeholder data to insert into annotations folder
# region_id = 1
# labeler_id = 2
# annotation_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
# most_recent = True

# # Ensure that the species ID that is getting inserted exists in the species table
# cursor.execute("SELECT speciesId, species FROM Species")
# species_records = cursor.fetchall()
# species_mapping = {record[1]: record[0] for record in species_records}
# eval_df["speciesId"] = eval_df["Species Name"].map(species_mapping)
# unmapped_species = eval_df[eval_df["speciesId"].isnull()]
# if not unmapped_species.empty:
#     print("The following species are unmapped:")
#     print(unmapped_species["Species Name"].unique())
#     raise ValueError(
#         "Species mapping has an error - the data has a species that does not exist in DB: You need to add more species in the database OR you need to check the data for species that are unmapped"
#     )

# # Inserts data into the annotations table in bulk
# annotation_data = [
#     (
#         region_id,
#         labeler_id,
#         annotation_date,
#         row["speciesId"],
#         row["Probability"],
#         most_recent,
#     )
#     for _, row in eval_df.iterrows()
# ]
# try:
#     cursor.executemany(
#         """
#         INSERT INTO Annotation (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent)
#         VALUES (?, ?, ?, ?, ?, ?)
#     """,
#         annotation_data,
#     )
#     conn.commit()
#     print("Annotations inserted successfully.")
# except sqlite3.Error as e:
#     print(f"SQLite error: {e}")
#     conn.rollback()
# finally:
#     conn.close()

# sys.stdout.flush()


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
    parser = argparse.ArgumentParser(description="Process or save audio recordings.")
    parser.add_argument("--save", action="store_true", help="Save a new recording")
    parser.add_argument("inputs", nargs="*", help="For save: <audio_file>; otherwise recording IDs")
    parser.add_argument("--dest", help="Destination path for saving file")
    parser.add_argument("--deployment", type=int, help="Deployment ID for new recording")
    parser.add_argument("--drive", help="External drive label to save recordings on")
    parser.add_argument("--db", type=str, help="Path to SQLite database")
    args = parser.parse_args()

    #db = DBHelper()
    db=DBHelper(args.db)
    if args.save:
        audio_file = args.inputs[0]
        audio = MutagenFile(audio_file)
        # Sample Rate (Hz)
        sample_rate = audio.info.sample_rate if hasattr(audio.info, "sample_rate") else None
        # Bitrate (bps)
        bitrate = audio.info.bitrate if hasattr(audio.info, "bitrate") else None

        # determine storage root
        if args.drive:
            try:
                storage_root = DBHelper.find_mount_point(args.drive)
            except Exception as e:
                print(f"Drive error: {e}"); sys.exit(1)
            drive_label = args.drive
        else:
            storage_root = os.getcwd()
            drive_label = None

        # build dest_path under storage_root
        if args.dest:
            dest_path = args.dest if os.path.isabs(args.dest) else os.path.join(storage_root, args.dest)
        else:
            dest_path = os.path.join(storage_root, '.recordings')

        dep_id = args.deployment or db.insert_deployment()

        saved_abs = db.save_recording_file(audio_file, dest_path)
        filename = os.path.basename(saved_abs)

        # prepare URL with optional drive prefix
        if drive_label:
            rel = os.path.relpath(saved_abs, storage_root)
            url = f"{drive_label}::{rel}" 
        else:
            url = saved_abs 

        new_id = db.insert_recording(None, dep_id, filename, url, sample_rate, bitrate)
        print(f"Saved to {url}, recordingId={new_id}")
        sys.exit(0)

    # Get the recording ID(s) from the command line argument
    if len(args.inputs) > 0:
        # Check if the input contains commas (comma-separated list)
        if ',' in args.inputs[0]:
            recording_ids = [int(id_str.strip()) for id_str in args.inputs[0].split(',')]
            print(f"Processing recording IDs: {recording_ids}")
        # Check if input looks like a Python list (e.g. ["111", "222"])
        elif '[' in args.inputs[0] and ']' in args.inputs[0]:
            # Extract numbers from the string representation of a list
            import re
            ids_text = args.inputs[0].strip('[]')
            recording_ids = [int(id_str) for id_str in re.findall(r'\d+', ids_text)]
            print(f"Processing recording IDs: {recording_ids}")
        else:
            # Single ID
            recording_ids = int(args.inputs[0])  # Convert to integer
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