/**
 * Models
 */

const debug = require('debug')('server:models');
const mongoose = require('mongoose');

const connect = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        debug("Successfully connected to MongoDB Atlas");
    } catch (error) {
        debug("Error when trying to connect to MongoDB Atlas:", error);
    }
}

// Set up the models we want to use in our app
const models = {}
models.User = require('./User');
models.Post = require('./Post');

module.exports = {
    connect,
    ...models
};