/**
 * User Model
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

// Validate user credentials
userSchema.statics.login = async function (email, password) {
    // Check if the email exists in database
    const user = await this.findOne({ email });
    if (!user) {
        return false;
    }

    const hash = user.password;

    // Hash the incoming cleartext password using bcrypt
    // Check if password matches stored hashed password
    const result = await bcrypt.compare(password, hash);
    if (!result) {
        return false;
    }

    // Return user
    return user;
};

// Number of salt rounds for password hashing
userSchema.statics.saltRounds = 10;

userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'user'
});

// Declare Model
const User = mongoose.model('User', userSchema);

// Export Model
module.exports = User;