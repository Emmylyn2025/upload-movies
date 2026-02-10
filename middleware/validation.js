
import appError from "../utils/customError.js";

const validate = (schema) => {
  return (req, res, next) => {
    const {error, value} = schema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(new appError(error.details.map(err => err.message), 400));
    }

    req.body = value;
    next();
  }
}

export default validate;