/**
 * Auth Controller
 */

const bcrypt = require('bcrypt');
const debug = require('debug')('server:auth_controller');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

require('dotenv').config();

/**
 * Register a new user
 *
 * POST /signup
 * {
 *   "email": "",
 *   "password": ""
 * }
 */
const signup = async (req, res) => {

	// Generate a hash of `req.body.password`
	// Overwrite `req.body.password` with the generated hash
	try {
		req.body.password = await bcrypt.hash(req.body.password, User.saltRounds);

	} catch (error) {
		res.status(500).send({
			status: 'error',
			message: 'Exception thrown when hashing the password.',
		});
		throw error;
	}

	try {
		const user = await new User(req.body).save();
		debug("Created new user successfully: %O", user);

		// Construct JWT payload
		const payload = {
			id: user.get('_id').toString(),
			email: user.get('email'),
		}

		// Sign payload and get access token
		const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
			expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
		});

		res.send({
			status: 'success',
			data: {
				user,
				token
			},
		});

	} catch (error) {
		res.status(500).send({
			status: 'error',
			message: 'Exception thrown in database when creating a new user.',
		});
	}
}

module.exports = {
	signup
}