import express from "express";
import dotenv from "dotenv";
import { syncFromSheetsToDB, syncFromDBToSheets } from "./controllers/syncController";
import { consumeDatabaseChanges } from "./kafka/consumer";
dotenv.config(); 

const app = express();
app.use(express.json());

app.get("/sync-sheets-db", syncFromSheetsToDB);

app.get("/sync-db-sheets", syncFromDBToSheets);

app.listen(8000, async() => {
  console.log("Listening on port 8000");
  // await consumeDatabaseChanges()
});
