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
        debug('Error adding post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Make sure all fields are filled out correctly.',
        });
    }
};

/**
 * Delete a specific user post
 *
 * DELETE /user/posts/:postId
 */
const deleteUserPost = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Find the post by ID and user ID
        const post = await Post.findOne({ _id: postId, user: req.user.id });

        // If no post is found, return a 404 response
        if (!post) {
            return res.status(404).json({
                status: 'error',
                message: 'Post not found',
            });
        }

        // Delete the post
        await post.deleteOne();

        // Send a success response
        res.status(200).json({
            status: 'success',
            message: 'Post deleted successfully',
        });
    } catch (error) {
        debug('Error deleting user post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete user post',
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
 * Get user's posts by day and month across different years
 *
 * GET /user/posts/:month/:day
 */
const getUserPostsByDayMonth = async (req, res) => {
    try {
        const day = parseInt(req.params.day);
        const month = parseInt(req.params.month);

        // Fetch user's posts that match the day and month from the database
        const posts = await fetchUserPostsByDayMonth(req.user.id, day, month);

        // If no posts are found, return a 404 response
        if (posts.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No matching user posts found',
            });
        }

        // Send the matching posts as response
        res.status(200).json({
            status: 'success',
            data: posts,
        });
    } catch (error) {
        debug('Error fetching user posts by day and month:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user posts',
        });
    }
};

async function fetchUserPostsByDayMonth(userId, day, month) {
    const matchingPosts = await Post.find({
        user: userId,
        $expr: {
            $and: [
                { $eq: [{ $dayOfMonth: '$createdAt' }, day] },
                { $eq: [{ $month: '$createdAt' }, month] },
            ],
        },
    }).sort({ createdAt: 'desc' });

    return matchingPosts;
}

/**
 * Get user's posts within a specified range of years with pagination
 *
 * GET /user/posts/range/:startYear/:endYear?page=1
 */
const getUserPostsInRange = async (req, res) => {
    try {
        const startYear = parseInt(req.params.startYear);
        const endYear = parseInt(req.params.endYear);
        const page = parseInt(req.query.page) || 1; // Current page, defaulting to 1
        const itemsPerPage = 3; // Number of posts per page

        // Fetch paginated user's posts that match the year range from the database
        const posts = await fetchUserPostsInRange(req.user.id, startYear, endYear, page, itemsPerPage);

        // If no posts are found, return a 404 response
        if (posts.data.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No matching user posts found within the specified range of years',
            });
        }

        // Send paginated posts as response
        res.status(200).json({
            status: 'success',
            data: {
                posts: posts.data,
                currentPage: page,
                totalPages: posts.totalPages,
                itemsPerPage: itemsPerPage,
                totalNumberOfItems: posts.totalItems,
            },
        });
    } catch (error) {
        debug('Error fetching paginated user posts within range of years:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch paginated user posts within range of years',
        });
    }
};

async function fetchUserPostsInRange(userId, startYear, endYear, page, itemsPerPage) {
    const totalPosts = await Post.countDocuments({
        user: userId,
        $expr: {
            $and: [
                { $gte: [{ $year: '$createdAt' }, startYear] },
                { $lte: [{ $year: '$createdAt' }, endYear] },
            ],
        },
    });
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    const posts = await Post.find({
        user: userId,
        $expr: {
            $and: [
                { $gte: [{ $year: '$createdAt' }, startYear] },
                { $lte: [{ $year: '$createdAt' }, endYear] },
            ],
        },
    })
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    return { data: posts, totalItems: totalPosts, totalPages };
}

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
 * Update a specific user post
 *
 * PUT /user/posts/:postId
 * {
 *   "photo": <file upload>,
 *   "description": "",
 *   "location": "",
 *   "mood": 1-10,
 *   "temperature": 23,
 *   "isPublic": true/false
 * }
 */
const updateUserPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const { description, location, mood, temperature, isPublic } = req.body;

        // Find the post by ID and user ID
        const post = await Post.findOne({ _id: postId, user: req.user.id });

        // If no post is found, return a 404 response
        if (!post) {
            return res.status(404).json({
                status: 'error',
                message: 'Post not found',
            });
        }

        // Update post fields
        post.description = description;
        post.location = location;
        post.mood = mood;
        post.temperature = temperature;
        post.isPublic = isPublic;

        // Check if the user uploaded a new file
        if (req.file) {
            const url = `${req.protocol}://${req.get('host')}`;
            post.photo = `${url}/photos/${req.file.filename}`;
        }

        // Save the updated post
        await post.save();

        // Send the updated post as response
        debug('User post updated successfully: %O', post);
        res.status(200).json({
            status: 'success',
            data: {
                message: "User post updated successfully",
                post
            },
        });
    } catch (error) {
        debug('Error updating user post:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Make sure all fields are filled out correctly.',
        });
    }
};

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
    deleteUserPost,
    getUserPost,
    getUserPostsByDayMonth,
    getUserPostsInRange,
    getUserProfile,
    searchPosts,
    updateUserPost,
    updateUserProfile,
}