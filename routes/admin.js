const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin_controller');

// Get all pending public posts
router.get('/posts/pending', adminController.getPendingPosts);

// Get a specific pending public post
router.get('/posts/pending/:postId', adminController.getPendingPost);

// Deny a specific pending public post
router.delete('/posts/pending/:postId/deny', adminController.denyPendingPost);

// Approve a specific pending public post
router.put('/posts/pending/:postId/approve', adminController.approvePendingPost);

module.exports = router;