//PART: MODULES
const fs = require('fs');
const dotenv = require('dotenv'); //allows load config.env
const mongoose = require('mongoose');
const Tour = require('../../model/toursModel');
const User = require('../../model/usersModel');
const Review = require('../../model/reviewsModel');

dotenv.config({ path: './config.env' }); //load config.env

//PART: DATABASE

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DB connection successful');
    //console.log(con.connections);
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
// IMPORT DATA INTO DB
const importData = async (model, data) => {
  try {
    await model.create(data, { validateBeforeSave: false });
    console.log('Data successfully loaded !');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// DELETE ALL DATA FROM DB
const deleteData = async model => {
  try {
    await model.deleteMany();
    console.log('Data successfully deleted !');
  } catch (err) {
    console.log(err);
  }
};

//SCRIPTS
if (process.argv[2] === '--import-tours') {
  importData(Tour, tours);
}
if (process.argv[2] === '--import-users') {
  importData(User, users);
}
if (process.argv[2] === '--import-reviews') {
  importData(Review, reviews);
}
if (process.argv[2] === '--delete-tours') {
  deleteData(Tour);
}
if (process.argv[2] === '--delete-users') {
  deleteData(User);
}
if (process.argv[2] === '--delete-reviews') {
  deleteData(Review);
}
console.log(process.argv);
