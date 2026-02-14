import { pool } from "../server.js";

export const migrate = async () => {
  try{

console.log("Running migrations");

  await pool.query(`CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    userpassword VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    refreshtoken TEXT
);`);

  await pool.query(`CREATE TABLE movies(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID REFERENCES users(id),
  moviename VARCHAR(100) NOT NULL,
  movieduration INTEGER NOT NULL,
  movieprice NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`);

console.log("Migration completed");

  } catch(err) {
    console.log("Miggration failed", err);
    process.exit(1);
  }
}