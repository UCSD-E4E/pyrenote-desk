// Holds all database/frontend types

export type Recording = {
  recordingId: number;
  deploymentId: number;
  filename: string;
  url: string;
  datetime: string;
  duration: number;
  samplerate: number;
  bitrate: number;
};

export type Annotation = {
  annotationId: number;
  verified: 'YES' | 'NO' | 'UNVERIFIED';
  regionId: number;
  labelerId: number;
  annotationDate: string;
  speciesId: number;
  speciesProbability: number;
  // TODO: Redundant from date?
  mostRecent: boolean;
  // Recording info
  recordingId: number; // recording
  url: string;  // recording
  startOffset: number;
  endOffset: number;
};

// 

export type Deployment = {
  deploymentId: number;
  siteId: number;
  recorderId: number;
  start_date: string;
  end_date: string;
  deployed_by: string;
  note: string;
};

export type Survey = {
  surveyId: number;
  surveyname: string;
  studysite: string;
  start_date: string;
  end_date: string;
  latitude: number;
  longitude: number;
  notes: string;
};

export type Site = {
  siteId: number;
  surveyId: number;
  site_code: string;
  latitude: number;
  longitude: number;
  elevation: number;
};

export type Recorder = {
  recorderId: number;
  brand: string;
  model: string;
  serialnbr: string;
  code: string;
  purchase_date: string;
};

export type Model = {
  modelId: number;
  name: string;
  type: string;
  url: string;
};

export type Labeler = {
  labelerId: number;
  modelId: number;
  name: string;
  email: string;
  isHuman: bool;
};

export type Species = {
  speciesId: number;
  species: string;
  common: string;
};

export type RegionOfInterest = {
  regionId: number;
  recordingId: number;
  starttime: number;
  endtime: number;
};

export type RecordingWithData = Recording & { fileData: Uint8Array };
