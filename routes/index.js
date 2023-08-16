const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.send('Hello World!');
});

/* Guest route */
router.use('/guest', require('./guest'));

/* Login a user and get a JWT token */
router.post('/login', authController.login);

/* Register a new user */
router.post('/signup', authController.signup);

module.exports = router;
