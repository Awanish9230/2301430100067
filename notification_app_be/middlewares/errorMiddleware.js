import Log from "../../logging_middleware/logger.js";

const errorMiddleware = async (err, req, res, next) => {
  await Log(
    "backend",
    "error",
    "middleware",
    err.message
  );

  res.status(500).json({
    success: false,
    message: err.message,
  });
};

export default errorMiddleware;