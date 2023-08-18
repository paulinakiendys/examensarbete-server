const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const multer = require('../middlewares/multer');

/* Add a post to the authenticated user */
router.post('/posts', multer.uploadSingleImage, userController.addPost);

/* Search for user posts */
router.get('/posts/search', userController.searchPosts);

/* Get a specific user post */
router.get('/posts/:postId', userController.getUserPost);

/* Get authenticated user's profile */
router.get('/profile', userController.getUserProfile);

/* Update authenticated user's profile */
router.put('/profile', multer.uploadSingleImage, userController.updateUserProfile);

module.exports = router;
