class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // message will be Error.message property
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // take error object and calls of error
  }
}

module.exports = AppError;
