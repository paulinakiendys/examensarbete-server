const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.send('Hello World!');
});

/* Guest route */
router.use('/guest', require('./guest'));

/* Register a new user */
router.post('/signup', authController.signup);

module.exports = router;
