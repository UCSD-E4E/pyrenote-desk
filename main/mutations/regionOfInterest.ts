import { RegionOfInterest } from "../schema";
import { getDatabase } from "../background";

type UpdateParams = {
  regionId: number;
  startTime: number;
  endTime: number;
};

export const updateRegionOfInterest = async (
  regionId: number,
  startTime: number,
  endTime: number,
): Promise<RegionOfInterest | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<UpdateParams, RegionOfInterest>(`
    UPDATE RegionOfInterest
    SET starttime = @startTime, endtime = @endTime
    WHERE regionId = @regionId
    RETURNING *
  `);
  try {
    const rows = statement.get({
      regionId,
      startTime,
      endTime,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to update region of interest", e);
  }
};

type CreateParams = {
  recordingId: number;
  startTime: number;
  endTime: number;
};

export const createRegionOfInterest = async (
  recordingId: number,
  startTime: number,
  endTime: number,
): Promise<RegionOfInterest | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<CreateParams, RegionOfInterest>(`
    INSERT INTO RegionOfInterest (recordingId, starttime, endtime) 
    VALUES (@recordingId, @startTime, @endTime)
    RETURNING *
  `);
  try {
    const rows = statement.get({
      recordingId,
      startTime,
      endTime,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create region of interest", e);
  }
};

type DeleteParams = {
  regionId: number;
};

export const deleteRegionOfInterest = async (
  regionId: number,
): Promise<RegionOfInterest | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<DeleteParams, RegionOfInterest>(`
    DELETE FROM RegionOfInterest 
    WHERE regionId = @regionId
    RETURNING *
  `);
  try {
    const rows = statement.get({
      regionId,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to delete region of interest", e);
  }
};
