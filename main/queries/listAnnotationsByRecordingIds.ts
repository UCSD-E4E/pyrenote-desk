import { getDatabase } from "../background";
import { Annotation } from "../schema";

export type ProcessedAnnotationRow = {
  // From Annotation
  annotationId: number;
  verified: "YES" | "NO" | "UNVERIFIED";
  speciesId: number;
  speciesProbability: number;

  // From Recording (via JOIN)
  recordingId: number;
  filePath: string;

  // From RegionOfInterest (via JOIN)
  startOffset: number;
  endOffset: number;
};

const listAnnotationsByRecordingIds = (
  recordingIds: number[],
): ProcessedAnnotationRow[] => {
  const db = getDatabase();
  const placeholders = recordingIds.map(() => "?").join(", ");
  const stmt = db.prepare<number[], ProcessedAnnotationRow>(`
    SELECT
      a.annotationId,
      a.verified,
      a.speciesId,
      a.speciesProbability,
      r.recordingId,
      r.url        AS filePath,
      roi.starttime AS startOffset,
      roi.endtime   AS endOffset
    FROM Annotation a
    JOIN RegionOfInterest roi ON a.regionId = roi.regionId
    JOIN Recording r          ON roi.recordingId = r.recordingId
    WHERE r.recordingId IN (${placeholders})
    ORDER BY r.recordingId, roi.regionId, a.annotationId
  `);
  return stmt.all(...recordingIds);
};

export default listAnnotationsByRecordingIds;