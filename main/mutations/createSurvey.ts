import { Survey } from "../schema";
import { getDatabase } from "../background";

type CreateParams = {
  surveyname: string;
  studysite: string;
  start_date: string;
  end_date: string;
  latitude: number;
  longitude: number;
  notes: string;
};

const createSurvey = async (
  surveyname: string,
  studysite: string,
  start_date: string,
  end_date: string,
  latitude: number,
  longitude: number,
  notes: string,
): Promise<Survey | undefined> => {
  const db = getDatabase();
  const statement = db.prepare<CreateParams, Survey>(`
    INSERT INTO Survey (
      surveyname,
      studysite,
      start_date,
      end_date,
      latitude,
      longitude,
      notes
    )
    VALUES (
      @surveyname,
      @studysite,
      @start_date,
      @end_date,
      @latitude,
      @longitude,
      @notes
    )
    RETURNING * 
  `);
  try {
    const rows = statement.get({
      surveyname,
      studysite,
      start_date,
      end_date,
      latitude,
      longitude,
      notes,
    })!;
    return Promise.resolve(rows);
  } catch (e) {
    console.log("Error: failed to create survey", e);
  }
};

export default createSurvey;
