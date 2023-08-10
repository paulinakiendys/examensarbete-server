/**
 * User Model
 */
const mongoose = require('mongoose');

// Declare Model Schema
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        photo: {
            type: String,
            default: ''
        },
        isAdmin: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true, toJSON: { virtuals: true } },
);

userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'user'
});

// Declare Model
const User = mongoose.model('User', userSchema);

// Export Model
module.exports = User;