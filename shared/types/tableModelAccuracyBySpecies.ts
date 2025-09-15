export type tableModelAccuracyBySpecies = {
    speciesId: number;
    speciesName: string;
    numYes: number;
    numNo: number;
    numUnverified: number;
    total: number;
    accuracy: number;
    avgConfidence: number;
  };