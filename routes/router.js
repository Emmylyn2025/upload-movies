import express from "express";
import { registerUsers, loginUsers, allUsers, refresh, logOutUser } from "../controllers/userControllers.js";
import { addMovie, getAllMovies } from "../controllers/dataControllers.js";
const router = express.Router();
import { decode } from "../middleware/decode.js";

router.post('/postusers', registerUsers);
router.post('/loginusers', loginUsers);
router.get('/allusers', decode, allUsers);
router.get('/refresh', refresh);
router.get('/refresh/logout', logOutUser);

router.post('/addmovie', decode, addMovie);
router.get('/allmovies', getAllMovies)

export default router;