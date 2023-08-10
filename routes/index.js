const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.send('Hello World!');
});

/* Guest route */
router.use('/guest', require('./guest'));

module.exports = router;
