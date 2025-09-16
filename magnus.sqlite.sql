CREATE TABLE Survey (
    surveyId INTEGER PRIMARY KEY,
    surveyname TEXT,
    studysite TEXT,
    start_date DATETIME,
    end_date DATETIME,
    latitude REAL,
    longitude REAL,
    notes TEXT
);

CREATE TABLE Site (
    siteId INTEGER PRIMARY KEY,
    surveyId INTEGER,
    site_code TEXT,
    latitude REAL,
    longitude REAL,
    elevation REAL,
    FOREIGN KEY (surveyId) REFERENCES Survey (surveyId) ON DELETE CASCADE
);

CREATE TABLE Recorder (
    recorderId INTEGER PRIMARY KEY,
    brand TEXT,
    model TEXT,
    serialnbr TEXT,
    code TEXT,
    purchase_date DATE
);

CREATE TABLE Deployment (
    deploymentId INTEGER PRIMARY KEY,
    siteId INTEGER,
    recorderId INTEGER,
    start_date DATE,
    end_date DATE,
    deployed_by TEXT,
    note TEXT,
    FOREIGN KEY (siteId) REFERENCES Site (siteId) ON DELETE CASCADE,
    FOREIGN KEY (recorderId) REFERENCES Recorder (recorderId) ON DELETE CASCADE
);

CREATE TABLE Recording (
    recordingId INTEGER PRIMARY KEY,
    deploymentId INTEGER,
    filename TEXT,
    url TEXT,
    datetime DATETIME,
    duration REAL,
    samplerate INTEGER,
    bitrate INTEGER,
    FOREIGN KEY (deploymentId) REFERENCES Deployment (deploymentId) ON DELETE CASCADE
);


CREATE TABLE Annotation (
    annotationId INTEGER PRIMARY KEY,
    verified TEXT CHECK(verified IN ('YES', 'NO', 'UNVERIFIED')), --ensure value is only YES NO OR UNVERIFIED
    regionId INTEGER,
    labelerId INTEGER,
    annotationDate DATETIME,
    speciesId INTEGER,
    speciesProbability INTEGER,
    mostRecent BOOLEAN,
    FOREIGN KEY (regionId) REFERENCES RegionOfInterest (regionId) ON DELETE CASCADE,
    FOREIGN KEY (labelerId) REFERENCES Labeler (labelerId) ON DELETE CASCADE,
    FOREIGN KEY (speciesId) REFERENCES Species (speciesId) ON DELETE CASCADE
);

CREATE TABLE Species (
    speciesId INTEGER PRIMARY KEY,
    species TEXT,
    common TEXT
);

CREATE TABLE RegionOfInterest (
    regionId INTEGER PRIMARY KEY,
    recordingId INTEGER,
    starttime REAL,
    endtime REAL,
    FOREIGN KEY (recordingId) REFERENCES Recording (recordingId) ON DELETE CASCADE,
    UNIQUE (recordingId, starttime, endtime)
);


CREATE TABLE Model(
  modelId INTEGER PRIMARY KEY,
  name TEXT,
  type TEXT,
  url TEXT --maybe filepath?
);

CREATE TABLE Labeler(
    labelerId INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    isHuman BOOLEAN, -- stores as 1 or 0
    modelId INTEGER,
    FOREIGN KEY (modelId) REFERENCES Model (modelId) ON DELETE CASCADE
);
