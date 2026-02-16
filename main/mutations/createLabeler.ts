import { getDatabase } from "../background";

export const getOrCreateLabeler = async (
  name: string,
  email: string,
): Promise<number> => {
  const db = getDatabase();
  const safeName = name ?? "";
  const safeEmail = email ?? "";

  type Params = { name: string; email: string };
  type Row = { labelerId: number };

  const selectStmt = db.prepare<Params, Row>(
    `SELECT labelerId FROM Labeler WHERE name = @name AND email = @email`
  );
  const existing = selectStmt.get({ name: safeName, email: safeEmail });
  if (existing) {
    return existing.labelerId;
  }

  const insertStmt = db.prepare<Params, Row>(
    `INSERT INTO Labeler(name, email, isHuman, modelId) VALUES (@name, @email, 1, NULL) RETURNING labelerId`
  );
  const row = insertStmt.get({ name: safeName, email: safeEmail })!;
  return row.labelerId;
};
