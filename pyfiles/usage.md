# Key Components of `script.py`:

1.  **`DBHelper` Class**:
    *   A singleton class responsible for all SQLite database operations.
    *   `__new__`: Establishes connection to the database file (default: `databases/pyrenoteDeskDatabase.db`).
    *   `fetch_recordings`: Retrieves recording metadata (ID, URL) from the `Recording` table based on a list of recording IDs.
    *   `insert_annotation`: Inserts or updates an annotation in the `Annotation` table. This includes `regionId`, `labelerId`, `speciesId`, `speciesProbability`, etc.
    *   `save_recording_file`: Copies a source audio file to a destination path. Supports various audio formats (FLAC, MP3, WAV, AAC, M4A, OGG). If `dest_path` is not provided, it defaults to a hidden `.recordings` directory in the current working directory. It handles directory creation and avoids re-copying if the file already exists and is identical.
    *   `insert_deployment`: Inserts a new record into the `Deployment` table. If `siteId` or `recorderId` are not provided, it uses default values. Returns the ID of the newly inserted deployment.
    *   `insert_recording`: Inserts a new record into the `Recording` table. It extracts metadata (duration, recording datetime) from the audio file using `mutagen`. The `url` can be a local path or a drive-prefixed path (e.g., `DRIVE_LABEL::relative/path/to/file.flac`). If `recording_id` is not provided, SQLite auto-generates it.
    *   `find_mount_point` (static method): Detects the mount point of an external drive given its label, with support for macOS, Linux, and Windows.

2.  **Helper Functions**:
    *   `download_url`: Reads the binary content of an audio file. It can handle standard file paths and the custom drive-prefixed URLs (e.g., `DRIVE_LABEL::path/to/file`) by resolving them to an absolute path using `DBHelper.find_mount_point`.
    *   `AudioDataset` (PyTorch `Dataset`): A simple dataset class to wrap audio samples (ID and binary audio data) for use with a PyTorch `DataLoader`.
    *   `get_dataloader_for_recordings`: Fetches recording URLs, uses `download_url` to get audio data, and prepares a PyTorch `DataLoader`.
    *   `process_result`: Takes a Pandas DataFrame (simulating model output), identifies the species with the highest probability for each recording, and uses `DBHelper.insert_annotation` to save these predictions to the database.
    *   `pseudo_inference`: A placeholder function simulating a model's inference process.

3.  **Command-Line Interface (`if __name__ == "__main__":`)**:
    *   Uses `argparse` to handle command-line arguments.
    *   **Save Mode (`--save`)**:
        *   Takes an audio file path as input.
        *   Optional `--dest`: Specifies a custom destination directory or full file path for the audio file.
        *   Optional `--drive`: Specifies an external drive label. The script will attempt to save the file onto this drive. The path stored in the database will be prefixed with the drive label (e.g., `MYDRIVE::recordings/file.flac`).
        *   Optional `--deployment`: Specifies an existing `deploymentId`. If not provided, a new deployment record is created automatically.
        *   The script saves the audio file, then inserts records into `Deployment` (if new) and `Recording` tables.
    *   **Inference Mode (default, no `--save`)**:
        *   Takes one or more recording IDs as input (comma-separated, or a string representation of a list like `"[1,2,3]"`).
        *   Loads the audio data for these recordings.
        *   Runs a pseudo-inference.
        *   Processes the results and saves annotations to the database.

Example Commands:

*   **Running Pseudo-Inference**:
    ```
    # On a single recording ID
    python pyfiles/script.py 111

    # On multiple recording IDs (comma-separated)
    python pyfiles/script.py 111,222,333

    # On multiple recording IDs (list format)
    python pyfiles/script.py "[10,20,30]"
    ```

*   **Saving a New Recording**:
    ```
    # Save 'my_audio.flac' to the default local '.recordings' directory
    python pyfiles/script.py --save ./my_audio.flac

    # Save 'my_audio.mp3' to a specific local directory './audio_archive'
    python pyfiles/script.py --save ./my_audio.mp3 --dest ./audio_archive

    # Save 'another_audio.wav' to an external drive labeled 'EXT_HDD_1' in its root
    # (The script will create a '.recordings' folder on 'EXT_HDD_1' if --dest is not specified,
    # or save directly to the root if --dest is also the root, depending on implementation details of save_recording_file)
    # More typically, you'd specify a destination folder on the drive:
    python pyfiles/script.py --save ./another_audio.wav --drive EXT_HDD_1 --dest my_recordings_on_drive

    # Save 'song.m4a' to external drive 'MUSICDRIVE' in 'project_alpha/session1' folder,
    # and associate it with deployment ID 42
    python pyfiles/script.py --save ./song.m4a --drive MUSICDRIVE --dest project_alpha/session1 --deployment 42
    ```