//PART: MODULES
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const User = require('../model/usersModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
//const sendEmail = require('../utils/email');
const Email = require('../utils/email');

//PART: HELPER FUNCTIONS

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const addCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //only https in prod
  res.cookie('jwt', token, cookieOptions);

  return res;
};

//PART: CONTROLLERS

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  newUser.password = undefined;
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();
  //token for immediate log in
  const token = signToken(newUser._id);
  res = addCookie(res, token);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password !', 400));
  }
  // 2) Check is user exist and password is correct
  const user = await User.findOne({ email }).select('+password'); //normally password is hide (by select: false) in model but  select('+password') take it back

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect login', 401));
  }
  //3) If everything ok, send token in cookie to client
  const token = signToken(user._id);
  res = addCookie(res, token);
  res.status(200).json({
    status: 'success',
    token
  });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not log in', 401));
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // promisify change function to return promise
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user does no longer exist.', 401));
  }
  // 4) Check if user change password after the token was issued (In that case user will not use old tokens (before pass change) to get access)
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // decoded.iat - time when token was created
    return next(new AppError('Usser recently changed password !. Please log in again.', 401));
  }
  //Grant access to protected route
  req.user = currentUser; // we can use user in next middleware function on that way
  res.locals.user = currentUser;
  next();
});

//Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verifay token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET); // promisify change function to return promise
      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) Check if user change password after the token was issued (In that case user will not use old tokens (before pass change) to get access)
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        // decoded.iat - time when token was created
        return next();
      }
      //There is a logged user
      // pug template has a access to res.locals
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  // 2) Generate the random rest token
  const resetToken = user.createPasswordResetToken();
  //save is best way to update doc (use all middleware and validation) but this time we give up validation
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset/${resetToken}`;
  //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}. If you didn't forget your password, please ignore this email.`;

  // We use try catch block because we need to make some change in DB
  try {
    // SOLUTION I - SIMPLE
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your passwors reset token (vaild for 10 min)',
    //   message
    // });
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email !'
    });
  } catch (err) {
    //some change in DB
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was a error sending the email. Try again later!', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) If token has no expired, and there is user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt propery for the user
  // 4) Log the user in , send JWT
  const token = signToken(user._id);
  res = addCookie(res, token);
  res.status(200).json({
    status: 'success',
    token
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  const currentUser = await User.findById(req.user._id).select('+password');
  const comparePasswords = await currentUser.correctPassword(
    req.body.currentPassword,
    currentUser.password
  );
  // 2) Check if POSTed current password is correct
  if (!comparePasswords) {
    return next(new AppError('You wrote incorrect password', 401));
  }
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  // 3) If so, update password
  await currentUser.save();
  // 4) Log user in, send JWT
  const token = signToken(currentUser._id);
  res = addCookie(res, token);
  res.status(200).json({
    status: 'success',
    token
  });
});
