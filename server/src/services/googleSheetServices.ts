import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import config from "../configs";

const keyFilePath = path.join(__dirname, '..', 'credentials.json');

const auth = new GoogleAuth({
  keyFile:keyFilePath,
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const getGoogleSheetsInstance = async () => {
  return google.sheets({ version: "v4", auth });
};



export const updateGoogleSheet = async (data: any[], range: string) => {
  const googleSheets = await getGoogleSheetsInstance();
  const spreadsheetId = "1KVVEj3YEnqYTUn5gg22ba_xhWE7RWxi_PVn_zFTQ850";

  await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: data,
    },
  });
};

export const getGoogleSheetData = async (range: string) => {
  const googleSheets = await getGoogleSheetsInstance();
  const spreadsheetId = "1KVVEj3YEnqYTUn5gg22ba_xhWE7RWxi_PVn_zFTQ850";

  const response = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range,
  });

  return response.data.values;
};

// export const appendSpreadsheetValues = async (
//   spreadsheetId: string,
//   values: any[]
// ) => {
//   const googleSheets = await getGoogleSheetsInstance();
//   await googleSheets.spreadsheets.values.append({
//     spreadsheetId,
//     range: "Sheet1!A1:D4",
//     valueInputOption: "USER_ENTERED",
//     resource: {
//       values,
//     },
//   });
// };



