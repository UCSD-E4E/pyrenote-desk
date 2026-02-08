import { getDatabase } from "../background";

type CreateModelParams = {
    name: string;
    type: string;
    url: string;
};

const createModel = async (params: CreateModelParams) => {
    const db = getDatabase();
    const statement = db.prepare(`
        INSERT INTO Model (name, type, url)
        VALUES (@name, @type, @url)
        RETURNING *
    `);
    try {
    statement.run({
        name: params.name,
        type: params.type,
        url: params.url
    });
    } catch (e) {
        console.error("Error: failed to create model", e);
        throw e;
    }
}

export default createModel;