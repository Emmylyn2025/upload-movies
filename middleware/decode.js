import appError from "../utils/customError.js";
import jwt from "jsonwebtoken";

export const decode = (req, res, next) => {
  const headers = req.headers.authorization;

  if(!headers) {
    return next(new appError("No token in headers", 401));
  }
  const token = headers.split(" ")[1];

  if(!token) {
    return next(new appError("No token is provided", 401));
  }

  const decoded = jwt.verify(token, process.env.accesstoken);
  
  req.userInfo = decoded;
  next();
}