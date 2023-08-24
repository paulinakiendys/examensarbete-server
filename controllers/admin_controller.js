/**
 * Admin Controller
 */

const debug = require('debug')('server:admin_controller');
const { Post } = require('../models');

/**
 * Approve a pending public post by postId
 *
 * PUT /admin/posts/pending/:postId/approve
 */
const approvePendingPost = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Fetch the specific pending post by postId from the database
        const pendingPost = await fetchPendingPostById(postId);

        // If no pending post is found, return a 404 response
        if (!pendingPost) {
            return res.status(404).json({
                status: 'error',
                message: 'Pending public post not found',
            });
        }

        // Update the post's isApproved status to true
        pendingPost.isApproved = true;
        await pendingPost.save();

        // Send the updated post as response
        res.status(200).json({
            status: 'success',
            message: 'Successfully approved post',
        });
    } catch (error) {
        debug('Error approving pending post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to approve post',
        });
    }
};

/**
 * Deny a pending public post by postId
 *
 * DELETE /admin/posts/pending/:postId/deny
 */
const denyPendingPost = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Delete the specific pending post by postId from the database
        const deletedPost = await Post.findOneAndDelete({
            _id: postId,
            isPublic: true,
            isApproved: false,
        });

        // If no pending post is found, return a 404 response
        if (!deletedPost) {
            return res.status(404).json({
                status: 'error',
                message: 'Pending public post not found',
            });
        }

        // Send a success message
        res.status(200).json({
            status: 'success',
            message: 'Successfully denied and deleted post from database',
        });
    } catch (error) {
        debug('Error denying pending post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to deny post',
        });
    }
};

/**
 * Get pending public posts with pagination
 *
 * GET /admin/posts/pending?page=1
 */
const getPendingPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const perPage = 3; // Number of posts per page

        // Fetch paginated pending public posts from the database
        const pendingPosts = await fetchPendingPosts(page, perPage);

        // If no pending posts are found, return a 404 response
        if (pendingPosts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No pending public posts found',
            });
        }

        // Send paginated pending posts as response
        res.status(200).json({
            status: 'success',
            data: {
                pendingPosts: pendingPosts.data,
                currentPage: page,
                totalPages: pendingPosts.totalPages,
                itemsPerPage: perPage,
                totalNumberOfItems: pendingPosts.totalItems,
            },
        });
    } catch (error) {
        debug('Error fetching paginated pending posts:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch paginated pending posts',
        });
    }
};

/**
 * Fetch paginated pending public posts from the database
 */
async function fetchPendingPosts(page, itemsPerPage) {
    const totalPendingPosts = await Post.countDocuments({ isPublic: true, isApproved: false });
    const totalPages = Math.ceil(totalPendingPosts / itemsPerPage);

    const pendingPosts = await Post.find({ isPublic: true, isApproved: false })
        .populate('user', 'email photo')
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    return { data: pendingPosts, totalItems: totalPendingPosts, totalPages };
}

/**
 * Get a specific pending public post by postId
 *
 * GET /admin/posts/pending/:postId
 */
const getPendingPost = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Fetch the specific pending post by postId from the database
        const pendingPost = await fetchPendingPostById(postId);

        // If no pending post is found, return a 404 response
        if (!pendingPost) {
            return res.status(404).json({
                status: 'error',
                message: 'Pending public post not found',
            });
        }

        // Send the pending post as response
        res.status(200).json({
            status: 'success',
            data: pendingPost,
        });
    } catch (error) {
        debug('Error fetching pending post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch pending post',
        });
    }
};

/**
 * Fetch a specific pending public post by postId from the database
 */
async function fetchPendingPostById(postId) {
    const pendingPost = await Post.findOne({ _id: postId, isPublic: true, isApproved: false })
        .populate('user', 'email photo')
        .exec();

    return pendingPost;
}

module.exports = {
    approvePendingPost,
    denyPendingPost,
    getPendingPosts,
    getPendingPost,
};
