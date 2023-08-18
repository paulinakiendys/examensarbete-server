/**
 * User Controller
 */

const bcrypt = require('bcrypt');
const debug = require('debug')('server:user_controller');
const { User, Post } = require('../models');

/**
 * Add a post for the authenticated user
 *
 * POST /posts
 * {
 *   "photo": <file upload>,
 *   "description": "",
 *   "location": "",
 *   "mood": 1-10,
 *   "temperature": 23,
 *   "isPublic": true/false
 * }
 */

const addPost = async (req, res) => {

    try {
        const { description, location, mood, temperature, isPublic } = req.body;

        // Check if a post already exists for the user on the current date
        const currentDate = new Date().toISOString().split('T')[0];
        const existingPost = await Post.findOne({
            user: req.user.id,
            createdAt: { $gte: currentDate, $lt: new Date(currentDate).getTime() + 86400000 },
        });

        if (existingPost) {
            return res.status(400).json({
                status: 'fail',
                message: 'You have already created a post today.',
            });
        }

        // Create a new Post instance
        const newPost = new Post({
            description,
            location,
            mood,
            temperature,
            isPublic,
            user: req.user.id,
        });

        // Check if the user uploaded a file
        if (req.file) {
            // If a file is uploaded, update post photo
            const url = `${req.protocol}://${req.get('host')}`;
            newPost.photo = `${url}/photos/${req.file.filename}`;
        }

        // Save the new post to the database
        await newPost.save();

        res.status(201).json({
            status: 'success',
            message: 'Post added successfully. Public posts will be visible after admin approval.',
        });
    } catch (error) {
        console.log(error)
        debug('Error adding post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Make sure all fields are filled out correctly.',
        });
    }
};

/**
 * Get a specific user post
 *
 * GET /user/posts/:postId
 */
const getUserPost = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Find the post by ID and user ID, and populate the 'user' field
        const post = await Post.findOne({ _id: postId, user: req.user.id })
            .populate('user', 'email photo');

        // If no post is found, return a 404 response
        if (!post) {
            return res.status(404).json({
                status: 'error',
                message: 'Post not found',
            });
        }

        // Send the post as response
        res.status(200).json({
            status: 'success',
            data: post,
        });
    } catch (error) {
        debug('Error getting user post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user post',
        });
    }
};

/**
 * Get authenticated user's profile
 *
 * GET /profile
 */
const getUserProfile = async (req, res) => {
    try {
        // Retrieve the authenticated user from the database
        const user = await User.findOne({ _id: req.user.id });

        // If no user is found, you can return an appropriate response
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        // Send the user as a response
        res.status(200).json({
            status: 'success',
            data: user,
        });
    } catch (error) {
        debug('Error getting user:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user',
        });
    }
};

/**
 * Search for user posts with pagination
 *
 * GET /user/posts/search?page=1&query=keyword
 */
const searchPosts = async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const perPage = 3; // Number of posts per page
        const query = req.query.query || ''; // Search query keyword

        // Fetch user's posts that match the search query from the database with pagination
        const posts = await fetchSearchedUserPosts(req.user.id, query, page, perPage);

        // If no posts are found, return a 404 response
        if (posts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No matching user posts found',
            });
        }

        // Send paginated searched posts as response
        res.status(200).json({
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
        debug('Error searching user posts:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to search user posts',
        });
    }
};

/**
 * Fetch user posts that match the search query from the database with pagination
 */
async function fetchSearchedUserPosts(userId, query, page, itemsPerPage) {
    const totalPosts = await Post.countDocuments({
        user: userId,
        $or: [
            { description: { $regex: query, $options: 'i' } }, // Case-insensitive search in description
            { location: { $regex: query, $options: 'i' } },    // Case-insensitive search in location
        ],
    });
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    const posts = await Post.find({
        user: userId,
        $or: [
            { description: { $regex: query, $options: 'i' } }, // Case-insensitive search in description
            { location: { $regex: query, $options: 'i' } },    // Case-insensitive search in location
        ],
    })
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    return { data: posts, totalItems: totalPosts, totalPages };
}

/**
 * Update authenticated user's profile
 *
 * PUT /profile
 * {
 *   "email": "",
 *   "newPassword": "",
 *   "photo": <file upload>
 * }
 */
const updateUserProfile = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve the authenticated user from the database
        const user = await User.findOne({ _id: req.user.id });

        // If no user is found, return an appropriate response
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        // Update user email if an email is provided
        if (email) {
            user.email = email;
        }

        // Update user password if a new password is provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, User.saltRounds);
            user.password = hashedPassword;
        }

        // Handle profile photo upload if a file is provided
        if (req.file) {
            const url = `${req.protocol}://${req.get('host')}`;
            user.photo = `${url}/photos/${req.file.filename}`;
        }

        // Save the updated user profile
        await user.save();

        // Send the updated user profile as a response
        debug('User profile updated successfully: %O', user);
        res.status(200).json({
            status: 'success',
            data: {
                message: 'User profile updated successfully',
                user,
            },
        });
    } catch (error) {
        debug('Error updating user profile:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user profile',
        });
    }
};

module.exports = {
    addPost,
    getUserPost,
    getUserProfile,
    searchPosts,
    updateUserProfile,
}