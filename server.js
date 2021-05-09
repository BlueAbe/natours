//This is entry point of my aplication

//PART: MODULES
const dotenv = require('dotenv'); //allows load config.env
const mongoose = require('mongoose');

//PART: SYNCHRONOUS BUGS HANDLER
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); //load config.env
const app = require('./app');

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

// add example dacument to database
// const testTour = new Tour({
//   name: 'The forest Hiker 4',
//   rating: 5.5,
//   price: 100,
// });

// testTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log('Error:', err));

//console.log(app.get('env')); // special express variable [development | production]
//console.log(process.env); // enviroment variables
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App runing on port ${port}...`);
});

//PART: ASYNCHRONOUS BUGS HANDLER
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  // server.clouse give time to finish all requests and pending
  server.close(() => {
    process.exit(1); // 0 for success exit and 1 for uncaugth exception
  });
});
