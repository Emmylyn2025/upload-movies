
const globalError = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  console.log(err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
}

export default globalError;