/**
 * User Controller
 */

const debug = require('debug')('server:user_controller');
const { User, Post } = require('../models');

/**
 * Add a post for the authenticated user
 *
 * POST /posts
 * {
 *   "photo": "",
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

module.exports = {
    addPost
}