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
