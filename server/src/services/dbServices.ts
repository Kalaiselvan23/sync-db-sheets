// import { Pool } from "pg";
// import dotenv from "dotenv";
// import config from "../configs";
// import { getGoogleSheetData } from "./googleSheetServices";

// dotenv.config();

// const pool = new Pool({
//   host: config.db.host,
//   user: config.db.user,
//   database: config.db.database,
//   password: config.db.password,
//   port: parseInt(process.env.PGPORT || "5432", 10),
// });

// const tableExists = async (tableName: string): Promise<boolean> => {
//   const query = `SELECT to_regclass('${tableName}') AS table_exists`;
//   const result = await pool.query(query);
//   return result.rows[0].table_exists !== null;
// };

// const createTable = async (tableName: string, columns: string[]) => {
//   const columnsDefinition = columns
//     .map((column) => `"${column}" TEXT`)
//     .join(", ");
//   const query = `CREATE TABLE ${tableName} (${columnsDefinition})`;
//   await pool.query(query);
//   console.log(`Table ${tableName} created successfully.`);
// };
// export const getDatabaseData = async () => {
//   const query = "SELECT * FROM spreadsheets";
//   const result = await pool.query(query);
//   return result.rows;
// };

// export const updateDatabase = async (range: string, tableName: string) => {
//   const sheetData: any = await getGoogleSheetData(range);
//   const headers = sheetData[0]; // First row contains headers
//   const rows = sheetData.slice(1); // Remaining rows contain data

//   // Ensure the table exists, create it if not
//   const exists = await tableExists(tableName);
//   if (!exists) {
//     await createTable(tableName, headers);
//   }

//   // Fetch current column names in the database
//   const dbColumns = await getDbColumns(tableName);

//   // Add missing columns from Google Sheets to the database
//   const newColumns = headers.filter(
//     (header: any) => !dbColumns.includes(header)
//   );
//   for (const column of newColumns) {
//     await addColumnIfNotExists(tableName, column);
//     console.log(`Added new column: ${column}`);
//   }

//   // Update dbColumns after adding any new ones
//   dbColumns.push(...newColumns);

//   // Retrieve existing data from the database as a map of primary key to row
//   const existingRows = await pool.query(`SELECT * FROM "${tableName}"`);
//   const existingDataMap = new Map(
//     existingRows.rows.map((row) => [row[dbColumns[0]], row])
//   );

//   // Iterate through Google Sheet rows and process each one
//   for (const row of rows) {
//     if (row.length === 0) {
//       console.warn("Skipping empty row.");
//       continue;
//     }

//     const primaryKeyValue = row[0]; // Assuming the first column is the unique identifier

//     // Check if the row with the primary key value exists in the database
//     const existingRow = existingDataMap.get(primaryKeyValue);

//     if (existingRow) {
//       // Update the row if it exists
//       const updateQuery = `
//         UPDATE "${tableName}" 
//         SET ${dbColumns
//           .slice(1)
//           .map((col, i) => `"${col}" = $${i + 2}`)
//           .join(", ")} 
//         WHERE "${dbColumns[0]}" = $1
//       `;
//       await pool.query(updateQuery, [primaryKeyValue, ...row.slice(1)]);
//       console.log(`Updated row with ${dbColumns[0]} = ${primaryKeyValue}`);
//     } else {
//       // Insert the row if it does not exist
//       console.log(
//         `Inserting new row with ${dbColumns[0]} = ${primaryKeyValue}`
//       );
//       const insertQuery = `
//         INSERT INTO "${tableName}" (${dbColumns
//         .map((col) => `"${col}"`)
//         .join(", ")}) 
//         VALUES (${row.map((_:any, i:any) => `$${i + 1}`).join(", ")})
//       `;
//       await pool.query(insertQuery, row);
//       console.log(`Inserted new row with ${dbColumns[0]} = ${primaryKeyValue}`);
//     }
//   }

//   console.log("Database successfully updated from Google Sheets.");
// };
// // Helper function to get the actual column names from the database

// const addColumnIfNotExists = async (tableName: string, columnName: string) => {
//   const query = `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" TEXT`;
//   try {
//     await pool.query(query);
//   } catch (error) {
//     console.warn(`Failed to add column ${columnName}: ${error}`);
//   }
// };

// const getDbColumns = async (tableName: string): Promise<string[]> => {
//   const query = `SELECT column_name FROM information_schema.columns WHERE table_name = $1`;
//   const result = await pool.query(query, [tableName]);
//   return result.rows.map((row: any) => row.column_name);
// };

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

// Ensure the replica identity is set before updating the table
const setReplicaIdentity = async (tableName: string) => {
  try {
    const query = `ALTER TABLE ${tableName} REPLICA IDENTITY FULL`;
    await pool.query(query);
    console.log(`Replica identity set to FULL for table ${tableName}.`);
  } catch (error) {
    console.error(`Failed to set replica identity for ${tableName}:`, error);
  }
};

const tableExists = async (tableName: string): Promise<boolean> => {
  const query = `SELECT to_regclass('${tableName}') AS table_exists`;
  const result = await pool.query(query);
  return result.rows[0].table_exists !== null;
};

const createTable = async (tableName: string, columns: string[]) => {
  const columnsDefinition = columns
    .map((column) => `"${column}" TEXT`)
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

// export const updateDatabase = async (range: string, tableName: string) => {
//   const sheetData: any = await getGoogleSheetData(range);
//   const headers = sheetData[0];
//   const rows = sheetData.slice(1);

//   const exists = await tableExists(tableName);
//   if (!exists) {
//     await createTable(tableName, headers);
//   }

//   await setReplicaIdentity(tableName);

//   const dbColumns = await getDbColumns(tableName);
//   console.log(`Database columns: ${dbColumns.join(", ")}`);

//   // Retrieve existing rows from the database
//   const existingRows = await pool.query(`SELECT * FROM ${tableName}`);
//   const existingDataMap = new Map(existingRows.rows.map(row => [row[dbColumns[0]], row]));

//   // Prepare a set of primary keys from the incoming rows
//   const incomingKeys = new Set(rows.map((row: any) => row[0]));

//   // Handle deletions
//   for (const [key, existingRow] of existingDataMap) {
//     if (!incomingKeys.has(key)) {
//       await pool.query(`DELETE FROM ${tableName} WHERE "${dbColumns[0]}" = $1`, [key]);
//       console.log(`Deleted row with ${dbColumns[0]} = ${key}`);
//     }
//   }

//   // Handle updates and inserts
//   for (const row of rows) {
//     if (row.length === 0) {
//       console.warn("Skipping empty row.");
//       continue;
//     }

//     const primaryKeyValue = row[0];

//     if (existingDataMap.has(primaryKeyValue)) {
//       // Update existing row
//       const updateQuery = `
//         UPDATE ${tableName} 
//         SET ${dbColumns.slice(1).map((col, i) => `"${col}" = $${i + 2}`).join(", ")} 
//         WHERE "${dbColumns[0]}" = $1
//       `;
//       await pool.query(updateQuery, [primaryKeyValue, ...row.slice(1)]);
//       console.log(`Updated row with ${dbColumns[0]} = ${primaryKeyValue}`);
//     } else {
//       // Insert new row
//       if (row.length !== dbColumns.length) {
//         console.warn(`Row length (${row.length}) does not match column count (${dbColumns.length}). Skipping insert for this row.`);
//         continue;
//       }

//       const insertQuery = `
//         INSERT INTO ${tableName} (${dbColumns.map(col => `"${col}"`).join(", ")}) 
//         VALUES (${row.map((_: any, i: any) => `$${i + 1}`).join(", ")})
//       `;
//       await pool.query(insertQuery, row);
//       console.log(`Inserted new row with ${dbColumns[0]} = ${primaryKeyValue}`);
//     }
//   }

//   console.log("Database successfully updated from Google Sheets.");
// };

export const updateDatabase = async (range: string, tableName: string) => {
  const sheetData: any = await getGoogleSheetData(range);
  const headers = sheetData[0];
  const rows = sheetData.slice(1);

  const exists = await tableExists(tableName);
  if (!exists) {
    await createTable(tableName, headers);
  } else {
    // Add any new columns from the sheet that don't exist in the database
    const dbColumns = await getDbColumns(tableName);
    for (const header of headers) {
      if (!dbColumns.includes(header)) {
        await addColumnIfNotExists(tableName, header);
        console.log(`Added new column: ${header}`);
      }
    }
  }

  await setReplicaIdentity(tableName);

  // Fetch updated column list after potential additions
  const dbColumns = await getDbColumns(tableName);
  console.log(`Database columns: ${dbColumns.join(", ")}`);

  // Retrieve existing rows from the database
  const existingRows = await pool.query(`SELECT * FROM "${tableName}"`);
  const existingDataMap = new Map(existingRows.rows.map(row => [row[dbColumns[0]], row]));

  // Prepare a set of primary keys from the incoming rows
  const incomingKeys = new Set(rows.map((row: any) => row[0]));

  // Handle deletions
  for (const [key, existingRow] of existingDataMap) {
    if (!incomingKeys.has(key)) {
      await pool.query(`DELETE FROM "${tableName}" WHERE "${dbColumns[0]}" = $1`, [key]);
      console.log(`Deleted row with ${dbColumns[0]} = ${key}`);
    }
  }

  // Handle updates and inserts
  for (const row of rows) {
    if (row.length === 0) {
      console.warn("Skipping empty row.");
      continue;
    }

    const primaryKeyValue = row[0];

    // Create an object to hold the row data
    const rowData: { [key: string]: any } = {};
    headers.forEach((header: string, index: number) => {
      rowData[header] = row[index];
    });

    if (existingDataMap.has(primaryKeyValue)) {
      // Update existing row
      const updateQuery = `
        UPDATE "${tableName}" 
        SET ${dbColumns.slice(1).map((col, i) => `"${col}" = $${i + 2}`).join(", ")} 
        WHERE "${dbColumns[0]}" = $1
      `;
      const updateValues = [primaryKeyValue, ...dbColumns.slice(1).map(col => rowData[col])];
      await pool.query(updateQuery, updateValues);
      console.log(`Updated row with ${dbColumns[0]} = ${primaryKeyValue}`);
    } else {
      // Insert new row
      const insertQuery = `
        INSERT INTO "${tableName}" (${dbColumns.map(col => `"${col}"`).join(", ")}) 
        VALUES (${dbColumns.map((_, i) => `$${i + 1}`).join(", ")})
      `;
      const insertValues = dbColumns.map(col => rowData[col]);
      await pool.query(insertQuery, insertValues);
      console.log(`Inserted new row with ${dbColumns[0]} = ${primaryKeyValue}`);
    }
  }

  console.log("Database successfully updated from Google Sheets.");
};

const addColumnIfNotExists = async (tableName: string, columnName: string) => {
  const query = `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" TEXT`;
  try {
    await pool.query(query);
  } catch (error) {
    console.warn(`Failed to add column ${columnName}: ${error}`);
  }
};

const getDbColumns = async (tableName: string): Promise<string[]> => {
  const query = `SELECT column_name FROM information_schema.columns WHERE table_name = $1`;
  const result = await pool.query(query, [tableName]);
  return result.rows.map((row:any) => row.column_name);
};
