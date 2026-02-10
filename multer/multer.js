import multer from "multer";
import fs from 'fs';
import path from"path";
import appError from "../utils/customError.js";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = 'uploads'
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = function(req, file, cb) {
  if(!file.mimetype.startsWith('image')) {
    cb(new appError('Only images can be uploaded', 422), false)
  } else {
    cb(null, true);
  }
}

export const upload = multer({
   storage,
   fileFilter,
   limits: {
    fileSize: 20 * 1024 * 1024 // 20 mb limit of image size
   }
  });