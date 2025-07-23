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

const createSurvey  = async (params: CreateParams) => {
  const {
    surveyname,
    studysite,
    start_date,
    end_date,
    latitude,
    longitude,
    notes
  } = params;

  const db = getDatabase();
  const statement = db.prepare(`
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
    const row = statement.get({
      surveyname: String(surveyname),
      studysite: String(studysite),
      start_date: String(start_date),
      end_date: String(end_date),
      latitude: latitude,
      longitude: longitude,
      notes: String(notes)
    });
    console.log("Inserted row:", row);
    return row;
  } catch (e) {
    console.error("Error inserting survey:", e);
    throw e;
  }
};

export default createSurvey;
