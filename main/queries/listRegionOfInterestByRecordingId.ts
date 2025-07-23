import { getDatabase } from "../background";
import { RegionOfInterest } from "../schema";

const listRegionOfInterestByRecordingId = async (
  recordingId: number,
): Promise<RegionOfInterest[] | undefined> => {
  const db = getDatabase();
  try {
    const stmt = db.prepare<number, RegionOfInterest>(
      "SELECT * FROM RegionOfInterest WHERE recordingId = ?",
    );
    const result = stmt.all(recordingId);
    console.log("Fetched region of interest:", result);
    return Promise.resolve(result);
  } catch (error) {
    console.error("Failed to fetch region of interest:", error);
  }
};

export default listRegionOfInterestByRecordingId;
