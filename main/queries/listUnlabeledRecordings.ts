import { Statement } from "better-sqlite3";
import { getDatabase } from "../background";
import { Recording } from "../schema";

type ListUnlabeledParams = { limit: number; offset: number };
type ListUnlabeledResponse = { rows: Recording[]; total: number };

const listUnlabeledRecordings = async (
  params: ListUnlabeledParams,
): Promise<ListUnlabeledResponse> => {
  const db = getDatabase();

  const baseQuery = `
    SELECT r.*
    FROM recording r
    WHERE NOT EXISTS (
      SELECT 1
      FROM regionOfInterest roi
      JOIN annotation a ON roi.regionId = a.regionId
      WHERE roi.recordingId = r.recordingId
    )
  `;

  try {
    const totalStmt = db.prepare<never[], { count: number }>(
      `SELECT COUNT(*) as count FROM ( ${baseQuery} ) as base`
    );
    const total = totalStmt.get()?.count ?? 0;

    const statement: Statement<[number, number], Recording> = db.prepare(
      `${baseQuery} LIMIT ? OFFSET ?`
    );
    const rows = statement.all(params.limit, params.offset);
    return { rows, total };
  } catch (e) {
    console.log("Error: failed to list unlabeled recordings", e);
    return { rows: [], total: 0 };
  }
};

export default listUnlabeledRecordings;
