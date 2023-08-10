/**
 * Post Model
 */
const mongoose = require('mongoose');

// Declare Model Schema
const postSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    default: ''
  },
  location: {
    type: String,
  },
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  temperature: {
    type: Number,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  }
},
  { timestamps: true });

// Declare Model
const Post = mongoose.model('Post', postSchema);

// Export Model
module.exports = Post;