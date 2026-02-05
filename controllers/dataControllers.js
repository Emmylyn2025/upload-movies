import asyncHandler from "../utils/async.js"
import appError from "../utils/customError.js"
import { pool } from "../server.js";
import { buildQuery } from "../utils/apiFeatures.js";

export const addMovie = asyncHandler(async(req, res, next) => {
  const {moviename, movieduration, movieprice} = req.body;
  const userId = req.userInfo.id

  const movie = await pool.query("INSERT INTO movies(uploader_id, moviename, movieduration, movieprice) VALUES ($1, $2, $3, $4)", [userId, moviename, movieduration, movieprice]);
  
  if(!movie) {
    return next(new appError("A movie needs to be uploaded", 400));
  }

  res.status(201).json({
    message: "Uploaded",
    data: movie.rows[0]
  });
});

export const getAllMovies = asyncHandler(async(req, res, next) => {

  let {query, value} = buildQuery({table: 'movies', queryParams: req.query, allowedFilters: ["id", "uploader_id", "moviename", "movieduration", "movieprice", "created_at"], allowedSortFields: [ "uploader_id", "moviename", "movieduration", "movieprice", "created_at"],
  allowedFields: ["id", "uploader_id", "moviename", "movieduration", "movieprice", "created_at"]
  })
  /*
  const controlFields = ["limit", "fields", "page", "sort", "order"];

  const objQuery = {...req.query};

  //Removing the fields from the req.query
  
  controlFields.forEach((el) => {
    delete objQuery[el]
  });
  
  //Field limiting
  
  const fields = req.query.fields;
  let allFields = '*';
  
  const allFieldsToFilter = ["id", "uploader_id", "moviename", "movieduration", "movieprice", "created_at"];

  if(fields) {
    const fieldsArray = fields.split(",");

    let empty = [];
    fieldsArray.forEach((field) => {
      if(allFieldsToFilter.includes(field)) empty.push(field);
    });
  
    if(empty.length > 0) {
      allFields = empty.join(",");
    }
  }

  let query = `SELECT ${allFields} FROM movies WHERE 1 = 1`;

  let value = [];
  const allowedFields = ["id", "uploader_id", "moviename", "movieduration", "movieprice", "created_at"];
  Object.entries(objQuery).forEach(([field, key]) => {
    if(!allowedFields.includes(field)) return next(new appError("The Field does not exists in the api", 400));
    value.push(key);

    query += ` AND ${field} = $${value.length}`;
  });


  //sorting
  const order = req.query.order ? "ASC" : "DESC";
  const sort = req.query.sort || "created_at";

  const sortFields = [ "uploader_id", "moviename", "movieduration", "movieprice", "created_at"];

  const safeSort = sortFields.includes(sort) ? sort : "created_at";

  query += ` ORDER BY ${safeSort} ${order}`;

  const limit = parseInt(req.query.limit) || 2;
  const page = parseInt(req.query.page) || 1;
  const offset = (page -1) * limit;

  query += ` LIMIT $${value.length + 1} OFFSET $${value.length + 2}`;
  value.push(limit, offset);
  */
  const allMovies = await pool.query(query, value);
  //If movie dors not exist in the database
  if(allMovies.rows.length === 0) return next(new appError("No movies in database", 404));

  res.status(200).json({
    message: "Successful",
    data: allMovies.rows
  });
})