const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authController = require('../controllers/auth_controller');

/* Send a password rest link */
router.post('/forgot-password', authController.forgotPassword);

/* Guest route */
router.use('/guest', require('./guest'));

/* Login a user and get a JWT token */
router.post('/login', authController.login);

/* Reset password */
router.post('/reset-password/:resetToken', authController.resetPassword);

/* Register a new user */
router.post('/signup', authController.signup);

/* Protected user route */
router.use('/user', auth.validateJwtToken, require('./user'));

module.exports = router;
