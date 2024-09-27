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
  port: parseInt(process.env.PGPORT || "5433", 10),
});


// Check if table exists
const tableExists = async (tableName: string): Promise<boolean> => {
  const query = `SELECT to_regclass('${tableName}') AS table_exists`;
  const result = await pool.query(query);
  return result.rows[0].table_exists !== null;
};

// Create table dynamically
const createTable = async (tableName: string, columns: string[]) => {
  const columnsDefinition = columns.map(column =>`${column} TEXT`).join(", ");
  const query = `CREATE TABLE ${tableName} (${columnsDefinition})`;
  await pool.query(query);
};

export const updateDatabase = async (sheetRange: string, tableName: string) => {
  try {
    const data = await getGoogleSheetData(sheetRange) || [];

    if (data && data.length === 0) throw new Error("No data found in the sheet.");

    const columns = data[0];
    const rows = data.slice(1);

    const exists = await tableExists(tableName);
    if (!exists) {
      await createTable(tableName, columns);
      console.log(`Table ${tableName} created.`);
    }

    const columnsString = columns.join(", "); // Format columns like: column1, column2, column3
    const valuesPlaceholder = columns.map((_:any, i:any) => `$${i + 1}`).join(", "); // $1, $2, $3 ...

    const query = `INSERT INTO ${tableName} (${columnsString}) VALUES (${valuesPlaceholder})`;

    for (let row of rows) {
      await pool.query(query, row);
    }
    console.log("Database successfully updated!");
  } catch (error) {
    console.error("Error updating the database: ", error);
  }
};

// Fetch data from the database
export const getDatabaseData = async () => {
  const query = "SELECT * FROM spreadsheets";
  const result = await pool.query(query);
  return result.rows;
};
