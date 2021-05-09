//PART: MODULES

const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//PART: MODEL

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your eamil'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'guide', 'lead-guide', 'admin']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    //This only works on CREATE and SAVE !
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same !'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//PART: PRE HOOKS

// all pre document hooks work directly before save, so they ommit any validation

//document hooks

//sign in, restart, update password hook
userSchema.pre('save', async function(next) {
  //import users part
  if (process.argv[2] === '--import-users') return next();
  //main part
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // passwordConfirm will disappear in document
  //update, restrt part
  if (this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //move this date 1s into past. New token must be created after this date
  next();
});

userSchema.pre('save', function(next) {
  console.log(this);
  next();
});

//query hooks

userSchema.pre(/^find/, function(next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//PART: METHODS FOR ANY INSTANCE OF THIS MODEL

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword); //We can compare here hash and unhash paswords
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(JWTTimestamp, changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  //false means not change
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const restToken = crypto.randomBytes(32).toString('hex'); //generate random hex string
  this.passwordResetToken = crypto
    .createHash('sha256') //prepare object of cipher algorithm
    .update(restToken) // put in string to cipher
    .digest('hex'); // put out encrypted string
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // set passwordRestToken's duration
  return restToken;
};

const User = mongoose.model('User', userSchema); // we use singular noun name "User" to users collection
module.exports = User;
