//PART: MODULES
const express = require('express');

const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');

//PART: VARIABLES
const router = express.Router();

//PART: ROUTING
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot', authController.forgotPassword);
router.patch('/reset/:token', authController.resetPassword);

// this middleware protect all next routes
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);
router.patch(
  '/update-me',
  usersController.uploadUserPhoto,
  usersController.resizeUserPhoto,
  usersController.updateMe
);
router.delete('/delete-me', usersController.deleteMe);
router.get('/me', usersController.getMe, usersController.getUser);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.createUser);
router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);
module.exports = router;
