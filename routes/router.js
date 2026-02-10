import express from "express";
import { registerUsers, loginUsers, allUsers, refresh, logOutUser, updateUsers, deleteUsers } from "../controllers/userControllers.js";
import { addMovie, getAllMovies, getMoviesById, updateMovies, deleteMovie, getMpvieByUploaderId } from "../controllers/dataControllers.js";
const router = express.Router();
import { decode, admin } from "../middleware/decode.js";
import { upload } from "../multer/multer.js";
import validate from "../middleware/validation.js";
import { registerUserSchema, loginSchema } from "../joi/joiSchema.js";

router.post('/postusers', validate(registerUserSchema), registerUsers);
router.post('/loginusers', validate(loginSchema), loginUsers);
router.get('/allusers', decode, admin, allUsers);
router.get('/refresh', refresh);
router.get('/refresh/logout', logOutUser);
router.put('/updateusers/:id', decode, updateUsers);
router.delete('/deleteusers/:id', decode, admin, deleteUsers);

router.post('/addmovie', decode, upload.single('image'), addMovie);
router.get('/allmovies', decode, getAllMovies);
router.get('/getmoviebyid/:id', decode, getMoviesById);
router.put('/updatemovies/:id', decode, updateMovies);
router.delete('/deletemovie/:id', decode, deleteMovie);
router.get('/getmovieuser/:id', decode, getMpvieByUploaderId);

export default router;