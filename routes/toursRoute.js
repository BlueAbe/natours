//PART: MODULES
const express = require('express');
const toursController = require('../controllers/toursController');
const authController = require('../controllers/authController');
const reviewsRoute = require('./reviewsRoute');
//const reviewController = require('../controllers/reviewController');
//PART: VARIABLES
const router = express.Router();

//PART: ROUTING
router.use('/:tourId/reviews', reviewsRoute);
router.route('/top-5-cheap').get(toursController.aliasTopTours, toursController.getAllTours);
router
  .route('/')
  .get(toursController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour
  );
router.route('/tours-stats').get(toursController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    toursController.getMonthlyPlan
  );
router.route('/my-own-aggregation').get(toursController.myOwnAgregtion);
router.route('/tours-within/:distance/center/:latlng/:unit').get(toursController.getToursWithin);
// We can also use something like that
// /tours-distance?distance=222&center=-11,33&unit=mile
router.route('/distances/:latlng/unit/:unit').get(toursController.getDistances);
router
  .route('/:id')
  .get(toursController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.uploadTourImages,
    toursController.resizeTourImages,
    toursController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour
  );

// Nested routes
// POST /tour/234sdfs3322/reviews
// GET /tour/234sdfs3322/reviews
// GET /tour/234sdfs3322/reviews/8746fgh567

// Solution I
// router
//   .route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

//Solution II - on top - line 11

module.exports = router;
