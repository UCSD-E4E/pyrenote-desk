CREATE TABLE "Survey" (
	"survey_id"	INTEGER,
	"survey_name"	TEXT,
	"study_site"	TEXT,
	"start_date"	INTEGER,
	"end_date"	INTEGER,
	"latitude"	REAL,
	"longitude"	REAL,
	"notes"	TEXT,
	PRIMARY KEY("survey_id")
);

CREATE TABLE "Site" (
	"site_id"	INTEGER,
	"survey_id"	INTEGER,
	"site_code"	TEXT,
	"latitude"	REAL,
	"longitude"	REAL,
	"elevation"	REAL,
	PRIMARY KEY("site_id"),
	FOREIGN KEY("survey_id") REFERENCES "Survey"("survey_id")
);

CREATE TABLE "Recorder" (
	"recorder_id"	INTEGER,
	"brand"	TEXT,
	"model"	TEXT,
	"serial_nbr"	TEXT,
	"code"	TEXT,
	"purchase_date"	INTEGER,
	PRIMARY KEY("recorder_id")
);

CREATE TABLE "Deployment" (
	"deploymnet_id"	INTEGER,
	"site_id"	INTEGER,
	"recorder_id"	INTEGER,
	"start_date"	INTEGER,
	"end_date"	INTEGER,
	"deployed_by"	TEXT,
	"note"	TEXT,
	PRIMARY KEY("deploymnet_id"),
	FOREIGN KEY("recorder_id") REFERENCES "Recorder"("recorder_id"),
	FOREIGN KEY("site_id") REFERENCES "Site"("site_id")
);

CREATE TABLE "Recording" (
	"recording_id"	INTEGER,
	"deployment_id"	INTEGER,
	"file_name"	TEXT,
	"url"	REAL,
	"date"	INTEGER,
	"time"	INTEGER,
	"duration"	REAL,
	"sample_rate"	INTEGER,
	"bit_rate"	TEXT,
	PRIMARY KEY("recording_id"),
	FOREIGN KEY("deployment_id") REFERENCES ""
);

CREATE TABLE "Labeler" (
	"labeler_id"	INTEGER,
	"name"	TEXT,
	"email"	TEXT,
	"url"	TEXT,
	"model_version"	TEXT,
	"is_human"	INTEGER,
	PRIMARY KEY("labeler_id")
);

CREATE TABLE "Species" (
	"species_id"	INTEGER,
	"species"	TEXT,
	"common"	TEXT,
	PRIMARY KEY("species_id")
);

CREATE TABLE "Annotation" (
	"detection_id"	INTEGER,
	"recording_id"	INTEGER,
	"species_id"	INTEGER,
	"labeler_id"	INTEGER,
	"start_time"	INTEGER,
	"end_time"	INTEGER,
	"min_frequency"	REAL,
	"max_frequency"	REAL,
	"validated"	TEXT,
	"create_date"	INTEGER,
	PRIMARY KEY("detection_id"),
	FOREIGN KEY("labeler_id") REFERENCES "Labeler"("labeler_id"),
	FOREIGN KEY("recording_id") REFERENCES "",
	FOREIGN KEY("species_id") REFERENCES "Species"("species_id")
);
