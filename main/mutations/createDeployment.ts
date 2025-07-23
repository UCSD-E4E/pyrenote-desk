import { Deployment } from "../schema";
import { getDatabase } from "../background";

type CreateDeploymentParams = {
  siteId: number;
  recorderId: number;
  start_date: string;
  end_date: string;
  deployed_by: string;
  note: string;
};

const createDeployment = async (params: CreateDeploymentParams): Promise<Deployment> => {
  const {
    siteId,
    recorderId,
    start_date,
    end_date,
    deployed_by,
    note
  } = params;

  const db = getDatabase();

  // Optional: Verify that siteId exists
  const siteCheck = db.prepare(`SELECT 1 FROM Site WHERE siteId = ?`).get(siteId);
  if (!siteCheck) {
    throw new Error(`Invalid siteId: ${siteId} does not exist.`);
  }

  // Optional: Verify that recorderId exists
  const recorderCheck = db.prepare(`SELECT 1 FROM Recorder WHERE recorderId = ?`).get(recorderId);
  if (!recorderCheck) {
    throw new Error(`Invalid recorderId: ${recorderId} does not exist.`);
  }

  const statement = db.prepare(`
    INSERT INTO Deployment (siteId, recorderId, start_date, end_date, deployed_by, note)
    VALUES (@siteId, @recorderId, @start_date, @end_date, @deployed_by, @note)
    RETURNING *
  `);

  try {
    const row = statement.get({
      siteId,
      recorderId,
      start_date: String(start_date),
      end_date: String(end_date),
      deployed_by: String(deployed_by),
      note: String(note),
    });
    console.log("Inserted deployment:", row);
    return row as Deployment;
  } catch (e) {
    console.error("Error inserting deployment:", e);
    throw e;
  }
};

export default createDeployment;
