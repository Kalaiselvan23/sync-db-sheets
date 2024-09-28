import { Pool } from "pg";
import dotenv from "dotenv";
import config from "../configs";
import { getGoogleSheetData } from "./googleSheetServices";

dotenv.config();

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  database: config.db.database,
  password: config.db.password,
  port: parseInt(process.env.PGPORT || "5432", 10),
});

const tableExists = async (tableName: string): Promise<boolean> => {
  const query = `SELECT to_regclass('${tableName}') AS table_exists`;
  const result = await pool.query(query);
  return result.rows[0].table_exists !== null;
};

const createTable = async (tableName: string, columns: string[]) => {
  const columnsDefinition = columns
    .map((column) => `${column} TEXT`)
    .join(", ");
  const query = `CREATE TABLE ${tableName} (${columnsDefinition})`;
  await pool.query(query);
  console.log(`Table ${tableName} created successfully.`);
};
export const getDatabaseData = async () => {
  const query = "SELECT * FROM spreadsheets";
  const result = await pool.query(query);
  return result.rows;
};

export const updateDatabase = async (range: string, tableName: string) => {
  const sheetData:any = await getGoogleSheetData(range);
  const headers = sheetData[0];
  const rows = sheetData.slice(1);

  const exists = await tableExists(tableName);
  if (!exists) {
    await createTable(tableName, headers);
  }

  const dbColumns = await getDbColumns(tableName);
  console.log(`Database columns: ${dbColumns.join(", ")}`);

  const newColumns = headers.filter((header:any) => !dbColumns.includes(header));
  for (const column of newColumns) {
    await addColumnIfNotExists(tableName, column);
    console.log(`Added new column: ${column}`);
  }

  const existingRows = await pool.query(`SELECT * FROM ${tableName}`);
  const existingDataMap = new Map(existingRows.rows.map(row => [row[dbColumns[0]], row]));

  const incomingKeys = new Set(rows.map((row:any) => row[0])); 
  for (const [key, existingRow] of existingDataMap) {
    if (!incomingKeys.has(key)) {
      await pool.query(`DELETE FROM ${tableName} WHERE ${dbColumns[0]} = $1`, [key]);
      console.log(`Deleted row with ${dbColumns[0]} = ${key}`);
    }
  }

  for (const row of rows) {
    console.log(`Processing row: ${JSON.stringify(row)}`);

    if (row.length === 0) {
      console.warn("Skipping empty row.");
      continue;
    }

    const newRow = dbColumns.map((_:any, index:any) => row[index] !== undefined ? row[index] : ""); // Fill missing fields with empty strings

    const primaryKeyValue = newRow[0]; 
    const query = `SELECT * FROM ${tableName} WHERE ${dbColumns[0]} = $1`;
    const result:any = await pool.query(query, [primaryKeyValue]);

    if (result && result.rowCount > 0) {
      const updateQuery = `
        UPDATE ${tableName} 
        SET ${dbColumns.slice(1).map((col:any, i:any) => `${col} = $${i + 2}`).join(", ")} 
        WHERE ${dbColumns[0]} = $1
      `;
      await pool.query(updateQuery, [primaryKeyValue, ...newRow.slice(1)]);
      console.log(`Updated row with ${dbColumns[0]} = ${primaryKeyValue}`);
    } else {
      if (newRow.length !== dbColumns.length) {
        console.warn(`Row length (${newRow.length}) does not match column count (${dbColumns.length}). Skipping insert for this row.`);
        continue;
      }

      console.log(`Inserting row: ${JSON.stringify(newRow)}`);
      const insertQuery = `
        INSERT INTO ${tableName} (${dbColumns.join(", ")}) 
        VALUES (${newRow.map((_:any, i:any) => `$${i + 1}`).join(", ")})
      `;
      await pool.query(insertQuery, newRow);
      console.log(`Inserted new row with ${dbColumns[0]} = ${primaryKeyValue}`);
    }
  }

  console.log("Database successfully updated from Google Sheets.");
};

const addColumnIfNotExists = async (tableName: string, columnName: string) => {
  const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT`;
  try {
    await pool.query(query);
  } catch (error) {
    console.warn(`Failed to add column ${columnName}: ${error}`);
  }
};

const getDbColumns = async (tableName: string): Promise<string[]> => {
  const query = `SELECT column_name FROM information_schema.columns WHERE table_name = $1`;
  const result = await pool.query(query, [tableName]);
  return result.rows.map(row => row.column_name);
};