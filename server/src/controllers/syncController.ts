import { Request, Response } from "express";
import {
  getGoogleSheetData,
  updateGoogleSheet,
} from "../services/googleSheetServices";
import { updateDatabase, getDatabaseData } from "../services/dbServices";


export const syncFromSheetsToDB = async (req: Request, res: Response) => {
    try {
      await updateDatabase("Sheet1!A1:C10","spreadsheets"); 
      res.status(200).send("Database successfully updated from Google Sheets");
    } catch (error) {
      res.status(500).send({ error });
    }
  };

export const syncFromDBToSheets = async (req: Request, res: Response) => {
  try {
    const dbData = await getDatabaseData();
    const formattedData = dbData.map((row: any) => [row.column1, row.column2]);
    await updateGoogleSheet(formattedData, "Sheet1!A1:B10"); // Specify your range
    res.status(200).send("Google Sheets successfully updated from Database");
  } catch (error) {
    res.status(500).send({ error });
  }
};