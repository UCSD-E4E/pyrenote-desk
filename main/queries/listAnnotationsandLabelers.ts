import { getDatabase } from "../background";

export type tableAnnotationsandLabelers = {
  annotationId: number;
  recordingId: number;
  starttime: string;
  endtime: string;
  filename: string;
  verified: string;
  labelerId: number;
  labelername: string;
  annotationDate: string;
  speciesId: number;

};

type ListAnnotationsandLabelersParams = { limit: number; offset: number };
type ListAnnotationsandLabelersResponse = { rows: tableAnnotationsandLabelers[]; total: number };

const listAnnotationsandLabelers = async (
  params: ListAnnotationsandLabelersParams,
): Promise<ListAnnotationsandLabelersResponse> => {
  const db = getDatabase();

  const baseQuery = `
  SELECT
    a.annotationId,
    r.recordingId,
    roi.starttime,
    roi.endtime,
    r.filename,
    a.verified,
    l.labelerId,
    l.name as labelername,
    a.annotationDate,
    a.speciesId
  FROM
    Annotation a 
    LEFT JOIN RegionofInterest roi ON a.regionId = roi.regionId
    LEFT JOIN Recording r ON roi.recordingId = r.recordingId
    LEFT JOIN Labeler l ON a.labelerId = l.labelerId
  ORDER BY a.annotationId ASC
  `;

  try {
    // total number of grouped rows
    const totalStmt = db.prepare<never[], { count: number }>(`SELECT COUNT(*) as count FROM ( ${baseQuery} ) as base`);
    const total = totalStmt.get()?.count ?? 0;

    // paged rows
    const pagedStmt = db.prepare<[number, number], tableAnnotationsandLabelers>(
      `${baseQuery} LIMIT ? OFFSET ?`
    );
    const rows = pagedStmt.all(params.limit, params.offset);

    return { rows, total };
  } catch (e) {
    console.error("Error: failed listing model accuracy by species", e);
    return { rows: [], total: 0 };
  }
};

export default listAnnotationsandLabelers;
