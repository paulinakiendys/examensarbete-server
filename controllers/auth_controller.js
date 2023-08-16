/**
 * Auth Controller
 */

const bcrypt = require('bcrypt');
const debug = require('debug')('server:auth_controller');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

require('dotenv').config();

/**
 * Login a user, generate a JSON Web Token (JWT) for the user
 *
 * POST /login
 * {
 *   "email": "",
 *   "password": ""
 * }
 */
const login = async (req, res) => {

	// Destructure email and password from request body
	const { email, password } = req.body;

	// Login the user
	const user = await User.login(email, password);
	if (!user) {
		return res.status(401).send({
			status: 'fail',
			data: 'Authentication failed.',
		});
	}

	// Construct JWT payload
	const payload = {
		id: user.get('_id').toString(),
		email: user.get('email'),
	}

	// Sign payload and get access token
	const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
	});

	// Respond with access token
	return res.send({
		status: 'success',
		data: {
			user,
			token,
		}
	});
}

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
	signup,
	login
}