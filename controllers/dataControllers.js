import asyncHandler from "../utils/async.js"
import appError from "../utils/customError.js"
import { pool } from "../server.js";
import { buildQuery } from "../utils/apiFeatures.js";
import {validate as isUuid} from "uuid";
import uploadToCloudinary from "../cloudinary/cloudinaryHelpers.js";
import cloudinary from "../cloudinary/cloudinary.js";
import fs from "fs";

export const addMovie = asyncHandler(async(req, res, next) => {
  const {moviename, movieduration, movieprice} = req.body;
  const userId = req.userInfo.id;

  if(!req.file) return next(new appError("An image needs to be uploaded for the movie", 400));

  const {imagesecureurl, imagepublicid} = await uploadToCloudinary(req.file.path);

  const movie = await pool.query("INSERT INTO movies(uploader_id, moviename, movieduration, movieprice, imagesecureurl, imagepublicid) VALUES ($1, $2, $3, $4, $5, $6)", [userId, moviename, movieduration, movieprice, imagesecureurl, imagepublicid]);
  
  if(!movie) {
    return next(new appError("A movie needs to be uploaded", 400));
  }

  //Delete image from local storage after uploading
  fs.unlinkSync(req.file.path);

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
});

export const getMoviesById = asyncHandler(async(req, res, next) => {
  const id = req.params.id;
  if(!isUuid(id)) {
    return next(new appError("Invalid UUID", 400))
  }
  const query = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);

  if(query.rows.length === 0) {
    return next(new appError("Movie not found", 404));
  }

  res.status(200).json({
    status: "Successful",
    data: query.rows[0]
  });
});

export const getMpvieByUploaderId = asyncHandler(async(req, res, next) => {
  const uploaderId = req.params.id;

  if(!isUuid(uploaderId)) {
    return next(new appError("Invalid UUID", 400));
  }
  const query = "SELECT movies.id AS movie_id, movies.moviename AS moviename, movies.movieduration AS movieduration, movies.movieprice AS movieprice, movies.created_at AS created_at, movies.uploader_id AS uploader_id, users.username AS uploader_username, users.email AS uploader_email FROM movies JOIN users ON uploader_id = users.id WHERE uploader_id = $1 ORDER BY moviename ASC";
  const movie = await pool.query(query, [uploaderId]);
  if(movie.rows === 0) {
    return next(new appError("Movie not found", 404))
  }

  res.status(200).json({
    message: "Request SuccessFul",
    data: movie.rows[0]
  });
});

export const updateMovies = asyncHandler(async(req, res, next) => {
  const movieId = req.params.id;
  const fields = req.body;
  const userId = req.userInfo.id;

   if(!isUuid(movieId)) {
    return next(new appError("Invalid UUID", 400));
  }

  //Get movie before updating
  const movie = await pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);

  if(movie.rows[0].uploader_id !== userId) return next(new appError("You cannot update this movie", 401));

  const allowed = ['moviname', 'movieduration', 'movieprice'];
  
  //Get the key from the reqbody
  const keys = Object.keys(fields);
  //get the value from the reqbody
  const values = Object.values(fields);
  
  if(keys.length === 0) {
    return next(new appError("No fields to update", 400));
  }

  keys.forEach((key) => {
    if(!allowed.includes(key)) return next(new appError("Invalid key to update", 400)); 
  })
  
  //Get the string out of the array
  const clause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  const query = `UPDATE movies SET ${clause} WHERE id = $${keys.length + 1} RETURNING *`;
  const result = await pool.query(query, [...values, movieId]);

  if(result.rows.length === 0) {
    return next(new appError("No movie found", 404));
  }
  
  res.status(200).json({
    message: "Updated Successfully",
    username: result.rows[0]
  });
});

export const deleteMovie = asyncHandler(async(req, res, next) => {
  const movieId = req.params.id;
  const userId = req.userInfo.id;

  if(!isUuid(movieId)) {
    return next(new appError("Invalid UUID", 400));
  }

  const movie = await pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);

  if(movie.rows[0].uploader_id !== userId) return next(new appError("You cannot delete this movie", 401));

  const query = "DELETE FROM movies WHERE id = $1";
  const result = await pool.query(query, [movieId]);

  //Delete image from cloudinary
  await cloudinary.uploader.destroy(movie.rows[0].imagepublicid);

  if(result.rows.length === 0) {
    return next(new appError("No movie found", 404));
  }

  res.status(200).json({
    message: "Movie deleted",
    data: result.rows[0]
  });
});