import bcrypt from "bcrypt";
import { pool } from "../server.js";
import { generateTokens, saveRefreshInCookie } from "../utils/token.js";
import asyncHandler from "../utils/async.js";
import appError from "../utils/customError.js";
import crypto from "crypto";
import jwt from "jsonwebtoken"

export const registerUsers = asyncHandler(async (req, res, next) => {
  const {username, email, userpassword} = req.body;

  //Check if the user exist before in database
  const before = await pool.query('SELECT * FROM users WHERE email = $1 AND username = $2', [email, username]);
 
  //If the user exists before
  if(before.rows.length > 0) {
    return next(new appError("The email or username has been used for registration", 400));
  }

  //Hash password before saving to database
  const hashedPassword = await bcrypt.hash(userpassword, 12);

  const user = await pool.query('INSERT INTO users(username, email, userpassword) VALUES ($1, $2, $3)', [username, email, hashedPassword]);

  //console.log(user.rows[0]);
  res.status(201).json({
    message: "User registered",
    user: user.rows[0]
  });
});

export const loginUsers = asyncHandler(async (req, res) => {

  const {email, password} = req.body;

  //Check if user exists
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if(user.rows.length === 0) {
    return next(new appError("User not found", 404));
  }

  //Compare passwords
  const compare = await bcrypt.compare(password, user.rows[0].userpassword);
  if(!compare) {
    return next(new appError("The password is incorrect", 400));
  }

  //Create json web token
  const {accessToken, refreshToken} = generateTokens({
    id: user.rows[0].id,
    username: user.rows[0].username,
    email: user.rows[0].email
  });

  //Store refresh token in database
  //Hash refresh token before saving in database
  const hashedRefreshToken = await crypto.createHash('sha256').update(refreshToken).digest('hex');
  await pool.query('UPDATE users SET refreshtoken = $1 WHERE id = $2', [hashedRefreshToken, user.rows[0].id]);

  //Save refresh token in cookie
  saveRefreshInCookie(res, refreshToken);

  res.status(200).json({
    message: "Login successful",
    token: accessToken
  });
});

export const refresh = asyncHandler(async(req, res, next) => {
  const refreshTokens = req.cookies.refreshtoken;
  if(!refreshTokens) return next(new appError("You need to login first", 400));

  //Hash refresh token and check if it exists in database
  const hashedRefreshToken = await crypto.createHash('sha256').update(refreshTokens).digest('hex');
  const user = await pool.query('SELECT * FROM users WHERE refreshtoken = $1', [hashedRefreshToken]);
  
  if(user.rows.length === 0) return next(new appError("User not found", 404));
  
  const decoded = jwt.verify(refreshTokens, process.env.refreshtoken);
  if(!decoded) return next(new appError("Invalid jwt", 403));

  //create new tokens
  const {accessToken, refreshToken} = generateTokens({
    id: user.rows[0].id,
    username: user.rows[0].username,
    email: user.rows[0].email
  });

  //Hash refresh token and save in database
  const anoHashedRefresh = await crypto.createHash('sha256').update(refreshToken).digest('hex');
  await pool.query('UPDATE users SET refreshtoken = $1 WHERE id = $2', [anoHashedRefresh, user.rows[0].id]);

  //Save refreshtoken in cookie
  saveRefreshInCookie(res, refreshToken);

  //Send accesstoken token for the response
  res.status(200).json({
    status: "successful",
    token: accessToken
  });
});

export const logOutUser = asyncHandler(async(req, res, next) => {
  const refreshTokens = req.cookies.refreshtoken;
  if(!refreshTokens) return next(new appError("You need to login first", 400));
  
  //Hash refresh token and check if it exists in database
  const hashedRefreshToken = await crypto.createHash('sha256').update(refreshTokens).digest('hex');
  const user = await pool.query('SELECT * FROM users WHERE refreshtoken = $1', [hashedRefreshToken]);
  
  if(user.rows.length === 0) return next(new appError("User not found", 404));
  
  const decoded = jwt.verify(refreshTokens, process.env.refreshtoken);
  if(!decoded) return next(new appError("Invalid jwt", 403));

  //Clear cookie and update database
  res.clearCookie("refreshtoken",  {
    httpOnly: true,
    sameSite: "none",
    secure: false,
    path: "/postgres/api/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  await pool.query('UPDATE users SET refreshtoken = null WHERE id = $1', [user.rows[0].id]);
  
  res.status(200).json({
    status: "successful",
    message: "User logged out successfully"
  });
});

export const allUsers = asyncHandler(async(req, res, next) => {
  const objQuery = {...req.query};
  const excludedFields = ['page', 'sort', 'limit', 'order', 'fields'];

  //Exclude them from the request query
  excludedFields.forEach((el) => {
    delete objQuery[el];
  });

  //For field limiting
  const fields = req.query.fields;

  const allowedFields = ["id", "username", "email", "created_at"];
  let selectedFields = "id,username,email,created_at";

  if(fields) {
    const fieldsArray = fields.split(",");
    
    const safeFields = fieldsArray.filter((fields) => allowedFields.includes(fields));
    if(safeFields.length > 0) {
      selectedFields = safeFields.join(",");
    }
  }
  
  let query = `SELECT ${selectedFields} FROM users WHERE 1=1`;
  let values = [];

  const allowedFilters = ["id", "username", "created_at", "email"];

  Object.entries(objQuery).forEach(([key, value]) => {
    if(!allowedFilters.includes(key)) return next(new appError("The given field does not exists", 400));

    values.push(value);
    query += ` AND ${key} = $${values.length}`;
  });

  //Sorting the data
  const sort = req.query.sort || 'created_at';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

  //Whitelist the fields you can sort by
  const allowedFeildSort = ["username", "email", "created_at"];

  const safeSort = allowedFeildSort.includes(sort) ? sort : "created_at";

  query += ` ORDER BY ${safeSort} ${order}`;

  //Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  //Run the query
  const result = await pool.query(query, values);

  if(result.rows.length === 0) {
    return next(new appError("User not found", 404));
  }

  res.status(200).json({
    message: "Success",
    users: result.rows
  })
});
