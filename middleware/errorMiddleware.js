
const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    errors: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

module.exports = { errorHandler };
