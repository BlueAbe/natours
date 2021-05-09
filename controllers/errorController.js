const AppError = require('../utils/appError');

//PART: DATATBASE OPERATIONAL ERRORS
const handleObjectIDErrorDB = err => {
  const message = `Invaild ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = err => {
  const message = `Duplicate field value: ${err.keyValue.name}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Validation Error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

//PART: TOKEN VERIFICATON ERROR
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token is expired', 401);
};

//PART: MAIN

const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational error and message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
      // B) Programing Error: dont leak error's details
    } else {
      console.error('ERROR', err);
      return res.status(500).json({
        status: 'error',
        message: 'Something went worong !'
      });
    }
  }
  //RENDER
  else {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      console.log(err);
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    });
  }
};

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //RENDER
  else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong !',
      msg: err.message
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    console.log(error);
    if (error.kind === 'ObjectId') error = handleObjectIDErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsErrorDB(error);
    if (error._message === 'Validation failed') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    sendErrorProd(error, req, res);
  }
};
