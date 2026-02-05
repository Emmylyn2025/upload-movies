import dotenv from "dotenv";
dotenv.config()
import { Pool } from "pg";
import express from "express";
import router from "./routes/router.js";
import cookieParser from "cookie-parser";
import appError from "./utils/customError.js";
import globalError from "./utils/globalError.js";

//Database connection
export const pool = new Pool({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

pool.connect((err, client, release) => {
  if(err) {
   return console.log(err.stack);
  }

  console.log('Connected to database');
  release();
});

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/postgres/api', router);

app.use((req, res, next) => {
  next(new appError(`The request ${req.originalUrl} is not found on the server`, 404));
});

app.use(globalError);

app.listen(3000, () => {
  console.log('server is now running')
});

