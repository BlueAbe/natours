//PART: MODULES
const express = require('express');
const reviewController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');
//PART: VARIABLES
const router = express.Router({ mergeParams: true }); // mergeParams allow to take params from previous Router

//PART: ROUTING

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourandUserIDs,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);
module.exports = router;
