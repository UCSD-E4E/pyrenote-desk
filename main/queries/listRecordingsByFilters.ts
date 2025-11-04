import { getDatabase } from '../background';
import { Recording, RecordingWithData } from '../schema';
import fs from 'fs';

const listRecordingsByFilters = async (filters): Promise<RecordingWithData[]> => {
    const db = getDatabase();

    let query = `
        SELECT r.recordingId, r.deploymentId, r.url, r.datetime,
               r.duration, r.samplerate, r.bitrate
        FROM Recording r
        INNER JOIN Deployment d ON r.deploymentId = d.deploymentId
        INNER JOIN Site s ON d.siteId = s.siteId
        INNER JOIN Survey sv ON s.surveyId = sv.surveyId
        INNER JOIN Recorder rc ON d.recorderId = rc.recorderId
    `;

    const clauses: string[] = [];
    const parameters: any[] = [];

    if (filters.deployments?.length) {
        clauses.push(`d.deploymentId IN (${filters.deployments.map(() => '?').join(',')})`);
        parameters.push(...filters.deployments);
    }

    if (filters.sites?.length) {
        clauses.push(`s.siteId IN (${filters.sites.map(() => '?').join(',')})`);
        parameters.push(...filters.sites);
    }

    if (filters.recorders?.length) {
        clauses.push(`rc.recorderId IN (${filters.recorders.map(() => '?').join(',')})`);
        parameters.push(...filters.recorders);
    }

    if (filters.surveys?.length) {
        clauses.push(`sv.surveyId IN (${filters.surveys.map(() => '?').join(',')})`);
        parameters.push(...filters.surveys);
    }

    if ((filters.species?.length) || (filters.verifications?.length)) {
        query += `
            INNER JOIN RegionOfInterest roi ON roi.recordingId = r.recordingId
            INNER JOIN Annotation a ON a.regionId = roi.regionId
            LEFT JOIN Species sp ON a.speciesId = sp.speciesId
        `;

        if (filters.species?.length) {
            clauses.push(`sp.speciesId IN (${filters.species.map(() => '?').join(',')})`);
            parameters.push(...filters.species);
        }

        if (filters.verifications?.length) {
            clauses.push(`a.verified IN (${filters.verifications.map(() => '?').join(',')})`);
            parameters.push(...filters.verifications);
        }
    }

    if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' OR ');
    }

    const statement = db.prepare(query);

    try {
        const rows = statement.all(...parameters) as Recording[];
        const rowsWithData: RecordingWithData[] = rows.map((r) => ({
            ...r,
            fileData: new Uint8Array(fs.readFileSync(r.url)),
        }));
        return rowsWithData;
    } catch (e) {
        console.error("Error listing recordings by filters:", e);
        return [];
    }
};

export default listRecordingsByFilters;
