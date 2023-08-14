const debug = require('debug')('server:guest_controller');
const { Post } = require('../models');


/**
 * Get a specific approved public post
 *
 * GET /guest/public-posts/:postId
 */
async function getApprovedPublicPost(req, res) {
    try {
        const postId = req.params.postId; // Get the post ID from the URL parameter

        // Fetch the specific approved public post from the database
        const post = await fetchApprovedPublicPostById(postId);

        // If no post is found, return a 404 response
        if (!post) {
            return res.status(404).json({
                status: 'error',
                message: 'Approved public post not found',
            });
        }

        res.json({
            status: 'success',
            data: post,
        });
    } catch (error) {
        // Handle errors and send an appropriate error response
        handleError(res, error, 'Failed to fetch approved public post');
    }
}

/**
 * Fetch a specific approved public post by ID from the database
 */
async function fetchApprovedPublicPostById(postId) {
    const post = await Post.findOne({ _id: postId, isApproved: true, isPublic: true })
        .populate({
            path: 'user',
            select: 'email photo',
        })
        .exec();

    return post;
}

/**
 * Get all approved public posts, sorted by newest with pagination
 *
 * GET /guest/public-posts/sorted/newest?page=1
 */
async function getNewestPublicPosts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const perPage = 3; // Number of posts per page

        // Fetch approved public posts sorted by newest from the database with pagination
        const posts = await fetchApprovedPublicPostsSorted('createdAt', 'desc', page, perPage);

        // If no posts are found, return a 404 response
        if (posts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No approved public posts found',
            });
        }

        res.json({
            status: 'success',
            data: {
                newestPosts: posts.data,
                currentPage: page,
                totalPages: posts.totalPages,
                itemsPerPage: perPage,
                totalNumberOfItems: posts.totalItems,
            },
        });
    } catch (error) {
        // Handle errors and send an appropriate error response
        handleError(res, error, 'Failed to fetch newest public posts');
    }
}

/**
 * Get all approved public posts, sorted by oldest with pagination
 *
 * GET /guest/public-posts/sorted/oldest?page=1
 */
async function getOldestPublicPosts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const perPage = 3; // Number of posts per page

        // Fetch approved public posts sorted by oldest from the database with pagination
        const posts = await fetchApprovedPublicPostsSorted('createdAt', 'asc', page, perPage);

        // If no posts are found, return a 404 response
        if (posts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No approved public posts found',
            });
        }

        res.json({
            status: 'success',
            data: {
                oldestPosts: posts.data,
                currentPage: page,
                totalPages: posts.totalPages,
                itemsPerPage: perPage,
                totalNumberOfItems: posts.totalItems,
            },
        });
    } catch (error) {
        // Handle errors and send an appropriate error response
        handleError(res, error, 'Failed to fetch oldest public posts');
    }
}

/**
 * Fetch approved public posts from the database with pagination and sorting
 */
async function fetchApprovedPublicPostsSorted(sortField, sortOrder, page, itemsPerPage) {
    const totalPosts = await Post.countDocuments({ isApproved: true, isPublic: true });
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    const posts = await Post.find({ isApproved: true, isPublic: true })
        .populate({
            path: 'user',
            select: 'email photo',
        })
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    return { data: posts, totalItems: totalPosts, totalPages };
}

/**
 * Get all public posts in random order with pagination
 *
 * GET /guest/public-posts/random?page=1
 */
async function getRandomApprovedPublicPosts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const perPage = 3; // Number of posts per page

        // Fetch approved public posts from the database with pagination
        const posts = await fetchApprovedPublicPosts(page, perPage);

        // If no posts are found, return a 404 response
        if (posts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No approved public posts found',
            });
        }

        // Shuffle the array of posts to randomize the order
        const randomOrderPosts = shuffleArray(posts.data);

        // Send paginated and shuffled posts as a JSON response
        res.json({
            status: 'success',
            data: {
                randomOrderPosts,
                currentPage: page,
                totalPages: posts.totalPages,
                itemsPerPage: perPage,
                totalNumberOfItems: posts.totalItems,
            },
        });
    } catch (error) {
        // Handle errors and send an appropriate error response
        handleError(res, error, 'Failed to fetch random public posts');
    }
}

/**
 * Search for public posts with pagination
 * 
 * GET /guest/public-posts/search?page=1&query=keyword
 * 
 */
async function searchPublicPosts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const perPage = 3; // Number of posts per page
        const query = req.query.query || ''; // Search query keyword

        // Fetch searched public posts from the database with pagination
        const posts = await fetchSearchedPublicPosts(query, page, perPage);

        // If no posts are found, return a 404 response
        if (posts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No matching public posts found',
            });
        }

        // Send paginated searched posts as a JSON response
        res.json({
            status: 'success',
            data: {
                searchedPosts: posts.data,
                currentPage: page,
                totalPages: posts.totalPages,
                itemsPerPage: perPage,
                totalNumberOfItems: posts.totalItems,
            },
        });
    } catch (error) {
        // Handle errors and send an appropriate error response
        handleError(res, error, 'Failed to search public posts');
    }
}

/**
 * Fetch searched public posts from the database with pagination
 */
async function fetchSearchedPublicPosts(query, page, itemsPerPage) {
    const totalPosts = await Post.countDocuments({
        isApproved: true,
        isPublic: true,
        $or: [
            { description: { $regex: query, $options: 'i' } }, // Case-insensitive search in description
            { location: { $regex: query, $options: 'i' } },    // Case-insensitive search in location
        ],
    });
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    const posts = await Post.find({
        isApproved: true,
        isPublic: true,
        $or: [
            { description: { $regex: query, $options: 'i' } }, // Case-insensitive search in description
            { location: { $regex: query, $options: 'i' } },    // Case-insensitive search in location
        ],
    })
        .populate({
            path: 'user',
            select: 'email photo',
        })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    return { data: posts, totalItems: totalPosts, totalPages };
}

/**
 * Fetch approved public posts from the database with pagination
 */
async function fetchApprovedPublicPosts(page, itemsPerPage) {
    const totalPosts = await Post.countDocuments({ isApproved: true, isPublic: true });
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    const posts = await Post.find({ isApproved: true, isPublic: true })
        .populate({
            path: 'user',
            select: 'email photo',
        })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    return { data: posts, totalItems: totalPosts, totalPages };
}

/**
 * Handle errors by logging them and sending an error response
 */
function handleError(res, error, message) {
    debug(`Error: ${message}`, error);
    res.status(500).json({
        status: 'error',
        message,
    });
}

/**
 * Shuffle an array using the Fisher-Yates algorithm
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    getApprovedPublicPost,
    getNewestPublicPosts,
    getOldestPublicPosts,
    getRandomApprovedPublicPosts,
    searchPublicPosts,
};
