const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest_controller');

/* Get random public posts */
router.get('/public-posts/random', guestController.getRandomApprovedPublicPosts);

/* Get a specific public posts */
router.get('/public-posts/:postId', guestController.getApprovedPublicPost);

module.exports = router;