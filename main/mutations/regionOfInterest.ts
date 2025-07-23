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

//WORKS BUT UPDATEREGIONOFINTEREST AND DELETE MAY NOT. TEST THEM
type CreateParams = {
  recordingId: number;
  starttime: number;
  endtime: number;
};

export const createRegionOfInterest = async (
  recordingId: number,
  starttime: number,
  endtime: number,
): Promise<RegionOfInterest | undefined> => {
  const db = getDatabase();
  console.log("Creating region of interest with params:", {
    recordingId,
    starttime,
    endtime,
  });
  const statement = db.prepare<CreateParams, RegionOfInterest>(`
    INSERT INTO RegionOfInterest (recordingId, starttime, endtime) 
    VALUES (@recordingId, @starttime, @endtime)
    RETURNING *
  `);
  
  try {
    const row = statement.get({
      recordingId: recordingId,
      starttime: starttime,
      endtime: endtime
    });
    console.log("Created region of interest:", row);
    return row;
  } catch (e) {
    console.error("Error: failed to create region of interest", e);
    throw e;
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
