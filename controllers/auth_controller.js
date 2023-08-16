/**
 * Auth Controller
 */

const bcrypt = require('bcrypt');
const debug = require('debug')('server:auth_controller');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { User } = require('../models');

require('dotenv').config();

/**
 * Forgot password
 *
 * POST /forgot-password
 * {
 *   "email": "",
 * }
 */
const forgotPassword = async (req, res) => {

	// Destructure email from request body
	const { email } = req.body;

	try {
		// Find the user by their email in the database
		const user = await User.findOne({ email });

		// If the user with the provided email doesn't exist, return an error
		if (!user) {
			return res.status(404).send({
				status: 'fail',
				message: 'There is no account with the email you provided.',
			});
		}

		// Generate a reset token
		const resetToken = jwt.sign({ id: user.get('_id').toString() }, process.env.RESET_TOKEN_SECRET, {
			expiresIn: process.env.RESET_TOKEN_LIFETIME,
		});

		// Create a link with the reset token
		const resetLink = `http://localhost:4200/reset-password/${resetToken}`;

		// Set up SendGrid
		sgMail.setApiKey(process.env.SENDGRID_API_KEY);

		// Compose the email
		const msg = {
			to: user.email,
			from: process.env.EMAIL_ADDRESS,
			subject: 'Password Reset',
			text: `Click the following link to reset your password: ${resetLink}`,
		};

		// Send the email
		await sgMail.send(msg);
		debug(`Successfully sent password reset link to: ${user.email}`);
		
		return res.send({
			status: 'success',
			message: `You'll receive a link to reset your password. If you don't see the email, check your spam or junk folder before submitting a new request.`,
		});
	} catch (error) {
		debug('Error during password reset:', error.response.body.errors[0].message);
		return res.status(500).send({
			status: 'error',
			message: error.response.body.errors[0].message,
		});
	}
};

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
 * Reset password
 *
 * POST /reset-password/:resetToken
 * {
 *   "newPassword": "",
 * }
 */
const resetPassword = async (req, res) => {

	// Extract the reset token from the request's URL
	const resetToken = req.params.resetToken;

	try {
		// Verify the reset token using the reset token secret
		const payload = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);

		// Find the user by their ID in the database
		const user = await User.findById(payload.id);

		// If the user with the provided ID doesn't exist, return an error
		if (!user) {
			return res.status(404).send({
				status: 'fail',
				message: 'User not found for the given reset token.',
			});
		}

		// Generate a hash of `req.body.newPassword`
		// Overwrite `user.password` with the generated hash
		try {
			user.password = await bcrypt.hash(req.body.newPassword, User.saltRounds);
			await user.save();
		} catch (error) {
			console.log(error)
			res.status(500).send({
				status: 'error',
				message: 'Exception thrown when hashing the new password.',
			});
		}

		return res.send({
			status: 'success',
			message: 'Password reset successful. You can now log in with your new password.',
		});
	} catch (error) {
		return res.status(401).send({
			status: 'fail',
			message: 'Please request a new password reset link.',
		});
	}
};

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
	forgotPassword,
	login,
	resetPassword,
	signup
}