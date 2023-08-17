const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const multer = require('../middlewares/multer');

/* Add a post to the authenticated user */
router.post('/posts', multer.uploadSingleImage, userController.addPost);

module.exports = router;
