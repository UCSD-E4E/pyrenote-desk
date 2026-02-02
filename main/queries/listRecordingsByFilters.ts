import { getDatabase } from '../background';
import { Recording, RecordingWithData } from '../schema';
import fs from 'fs';

const listRecordingsByFilters = async (filters): Promise<{ recordings: Recording[], skippedCount: number }> => {
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

    const rows = statement.all(...parameters) as Recording[];
    let skippedCount = 0;
        
    const rowsWithData: Recording[] = rows.reduce<Recording[]>((acc, r) => {
        try {
            acc.push({
                ...r,
                //fileData: new Uint8Array(fs.readFileSync(r.url)),
            });
        } catch (e: any) {
            //keep track of ENOENT (file not found) errors and skip
            if (e.code === 'ENOENT') {
                skippedCount++;
                console.warn(`File not found, skipping: ${r.url}`);
            } else {
                console.error(`Error reading file ${r.url}:`, e);
                return [];
            }
        }
        return acc;
    }, []);
    
    if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} missing or unreadable file(s) out of ${rows.length} total recording(s)`);
    }
    
    return { recordings: rowsWithData, skippedCount };

};

export default listRecordingsByFilters;
