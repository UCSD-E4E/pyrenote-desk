# This file is a placeholder for the inference script. A sample dataframe is created to model the result of the inference script. Then, the script analyzes the data and inserts relevant information into the database
import sqlite3
import sys
import datetime as dt
from datetime import datetime
import os
import filecmp
import argparse
import platform
from pathlib import Path


# DbHelper class to handle database operations as a singleton
class DBHelper:
	_instance = None

	def __new__(cls, db_url):
		if cls._instance is None:
			cls._instance = super(DBHelper, cls).__new__(cls)
			if db_url is None:
				raise OperationalError("DB URL is required")
			if not os.path.isabs(db_url):
				script_dir = os.path.dirname(os.path.abspath(__file__))
				db_path = os.path.join(db_url)
			else:
				db_path = db_url
			cls._instance.connection = sqlite3.connect(db_path)
			cls._instance.cursor = cls._instance.connection.cursor()
		return cls._instance

	def insert_recording(self, recording_id=None, deployment_id=None, url=None, sample_rate=None, bit_rate=None):
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

		recorded_datetime = dt.datetime.now(); 
		duration = 0;

		datetime_str = recorded_datetime.strftime("%Y-%m-%d %H:%M:%S")

		p = Path(url)
		directory = (str(p.parent) + os.sep) if not str(p.parent).endswith(os.sep) else str(p.parent)

		print(deployment_id, url, directory, datetime_str, duration, sample_rate, bit_rate)
		# actual DB insert
		# Change I Made: saving directory in url rather than the absolute path of the audio file. You can get absolute path by concatenating url + filename instead.
		if recording_id is None:
			self.cursor.execute(
				"INSERT INTO Recording (deploymentId, url, directory, datetime, duration, samplerate, bitrate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				(deployment_id, url, directory, datetime_str, duration, sample_rate, bit_rate)
			)
			rec_id = self.cursor.lastrowid
		else:
			self.cursor.execute(
				"INSERT OR REPLACE INTO Recording (recordingId, deploymentId, url, directory, datetime, duration, samplerate, bitrate)"
				" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
				(recording_id, deployment_id, url, directory, datetime_str, duration, sample_rate, bit_rate)
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

	db=DBHelper(args.db)
	if args.save:
		audio_file = args.inputs[0]
		# Sample Rate (Hz)
		sample_rate = 0
		# Bitrate (bps)
		bitrate = 0
		# INSERTS 0 to Sample Rate and Bitrate for now

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

		dep_id = args.deployment or db.insert_deployment()

		saved_abs = audio_file
		filename = os.path.basename(audio_file)

		# prepare URL with optional drive prefix
		if drive_label:
			rel = os.path.relpath(saved_abs, storage_root)
			url = f"{drive_label}::{rel}" 
		else:
			url = saved_abs 

		new_id = db.insert_recording(None, dep_id, url, sample_rate, bitrate)
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
	