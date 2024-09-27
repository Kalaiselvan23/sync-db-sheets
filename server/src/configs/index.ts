import dotenv from "dotenv";
dotenv.config();
const config = {
  db: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DBNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  },
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    redirectUri: process.env.OAUTH_REDIRECT_URI,
  },
  sheets: {
    sheeId: process.env.GOOGLE_SHEET_ID,
  },
  dev: {
    env: process.env.NODE_ENV || "dev",
  },
};

export default config;
