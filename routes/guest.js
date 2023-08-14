const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest_controller');

/* Get all public posts in random order */
router.get('/public-posts/random', guestController.getRandomApprovedPublicPosts);

/* Search for public posts */
router.get('/public-posts/search', guestController.searchPublicPosts);

/* Get a specific public post */
router.get('/public-posts/:postId', guestController.getApprovedPublicPost);

/* Get all public posts, sorted by oldest */
router.get('/public-posts/sorted/oldest', guestController.getOldestPublicPosts);

/* Get all public posts, sorted by newest */
router.get('/public-posts/sorted/newest', guestController.getNewestPublicPosts);

module.exports = router;