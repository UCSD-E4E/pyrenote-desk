# This file is a placeholder for the inference script. A sample dataframe is created to model the result of the inference script. Then, the script analyzes the data and inserts relevant information into the database
import pandas as pd
import sqlite3
import sys
from datetime import datetime
import os

def process_audio_files(file_paths):
    """
    Process audio files and simulate feature extraction.
    Each file path is processed to extract file attributes and a placeholder feature vector.
    """
    results = []
    # Use enumerate to generate unique IDs
    for idx, file_path in enumerate(file_paths, start=1):
        file_name = os.path.basename(file_path)  # gets just the file name from the path
        # Simulate extracting a feature vector from the audio file (placeholder values)
        feature_vector = [0.453, 0.873]
        result = {
            "FILE NAME": file_name,
            "id": idx,
            "Amabaw1_x": feature_vector[0],
            "Amapyo1_y": feature_vector[1],
        }
        results.append(result)
    return pd.DataFrame(results)


# Sample DataFrame 
data = {
    "FILE NAME": ["file1.wav", "file2.wav", "file3.wav"],
    "id": [1, 2, 3],
    "Amabaw1_x": [0.453, 0.234, 0.895],
    "Amapyo1_y": [0.873, 0.657, 0.345],
}
eval_df = pd.DataFrame(data) 
# ^eval_df can now be replaced with process_audio_files(file_paths)

# Identify the bird species with the highest probability and simply include that in the final data frame
species_columns = [col for col in eval_df.columns if col not in ["FILE NAME", "id"] and pd.api.types.is_numeric_dtype(eval_df[col])]
eval_df[species_columns] = eval_df[species_columns].apply(pd.to_numeric, errors='coerce')
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
    raise ValueError("Species mapping has an error - the data has a species that does not exist in DB: You need to add more species in the database OR you need to check the data for species that are unmapped")

# Inserts data into the annotations table in bulk
annotation_data = [
    (region_id, labeler_id, annotation_date, row["speciesId"], row["Probability"], most_recent)
    for _, row in eval_df.iterrows()
]
try:
    cursor.executemany("""
        INSERT INTO Annotation (regionId, labelerId, annotationDate, speciesId, speciesProbability, mostRecent)
        VALUES (?, ?, ?, ?, ?, ?)
    """, annotation_data)
    conn.commit()
    print("Annotations inserted successfully.")
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    conn.rollback() 
finally:
    conn.close()

sys.stdout.flush()


# New functions for ML model processing

def convert_df_to_ml_input(df):
    """
    Convert a DataFrame to a format suitable for ML model input.
    For this example, extract the numerical features into a list of vectors.
    """
    # Here we assume that the features are in the columns 'Amabaw1_x' and 'Amapyo1_y'
    # If necessary, adjust the feature selection based on the actual audio processing.
    ml_input = df[['Amabaw1_x', 'Amapyo1_y']].values.tolist()
    return ml_input


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
    # Simulate reading file paths
    sample_file_paths = [
        # "/file1.wav",
        # "/file2.wav",
        # "/file3.wav"
    ]
    """
    # Debug process_audio_files function
    processed_df = process_audio_files(sample_file_paths)
    print("Processed DataFrame from audio files:")
    print(processed_df)
    
    # Convert DataFrame to ML model input
    ml_input = convert_df_to_ml_input(processed_df)
    print("ML model input:")
    print(ml_input)
    
    # Perform pseudo inference
    predictions = pseudo_inference(ml_input)
    print("Pseudo inference predictions:")
    print(predictions)
    """