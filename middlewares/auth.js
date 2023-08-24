/**
 * Authentication Middleware
 */

const debug = require('debug')('server:auth');
const jwt = require('jsonwebtoken');

/**
 * Validate JWT token
 */
const validateJwtToken = (req, res, next) => {
	// Make sure Authorization header exists, otherwise bail
	if (!req.headers.authorization) {
		debug("Authorization header missing");

		return res.status(401).send({
			status: 'fail',
			data: 'Authorization failed',
		});
	} 

	// Authorization: "Bearer eyJkpXVCJ9.eyJV9.xndmU"
	// Split authorization header into "authSchema token"
	const [authSchema, token] = req.headers.authorization.split(' ');
	if (authSchema.toLowerCase() !== "bearer") {
		return res.status(401).send({
			status: 'fail',
			data: 'Authorization failed',
		});
	}

	// Verify token (and extract payload)
	try {
		req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

	} catch (error) {
		return res.status(401).send({
			status: 'fail',
			data: 'Authorization failed',
		});
	}

	// Pass request along
	next();
}

/**
 * Admin role check
 */
const adminRoleCheck = (req, res, next) => {
	if (!req.user.isAdmin) {
        return res.status(403).send({
            status: 'fail',
            message: 'Access denied. Only admin users are allowed.',
        });
    }
    next();
}

module.exports = {
	validateJwtToken,
	adminRoleCheck,
}