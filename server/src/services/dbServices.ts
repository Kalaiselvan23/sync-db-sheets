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
};

const getCurrentColumns = async (tableName: string): Promise<string[]> => {
  const query = `SELECT column_name FROM information_schema.columns WHERE table_name = $1`;
  const result = await pool.query(query, [tableName]);
  return result.rows.map((row) => row.column_name);
};

const addColumn = async (tableName: string, columnName: string) => {
  const query = `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" TEXT`;
  await pool.query(query);
};

const sanitizeColumnName = (columnName: string): string => {
  return columnName.replace(/[^a-zA-Z0-9_]/g, '_') .replace(/^(\d)/, '_$1').toLowerCase(); 
};

export const updateDatabase = async (sheetRange: string, tableName: string) => {
  try {
    const data = await getGoogleSheetData(sheetRange) || [];
    
    if (data.length === 0) throw new Error("No data found in the sheet.");
    
    const columns = data[0].map(sanitizeColumnName); 
    const rows = data.slice(1); 

    const exists = await tableExists(tableName);
    if (!exists) {
      await createTable(tableName, columns);
      console.log(`Table ${tableName} created.`);
    }

    const currentColumns = await getCurrentColumns(tableName);

    // Check for new columns and add them
    for (const column of columns) {
      if (!currentColumns.includes(column)) {
        await addColumn(tableName, column);
        console.log(`Column ${column} added to table ${tableName}.`);
      }
    }

    const columnsString = columns.join(", "); // e.g., "column1, column2, column3"
    const valuesPlaceholder = columns.map((_, i) => `$${i + 1}`).join(", "); // e.g., "$1, $2, $3"
    
    const query = `INSERT INTO ${tableName} (${columnsString}) VALUES (${valuesPlaceholder})`;
    
    // Insert data row by row
    for (const row of rows) {
      if (row.length !== columns.length) {
        console.error(`Row length mismatch: expected ${columns.length}, but got ${row.length}`);
        continue; // Skip row if it doesn't match the number of columns
      }

      console.log("Executing query: ", query, " With values: ", row); 
      await pool.query(query, row); // Insert the row into the database
    }

    console.log("Database successfully updated!");
  } catch (error) {
    console.error("Error updating the database: ", error);
  }
};

export const getDatabaseData = async () => {
  const query = "SELECT * FROM spreadsheets";
  const result = await pool.query(query);
  return result.rows;
};
