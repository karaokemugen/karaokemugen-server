import logger from 'winston';
import express from 'express';
import {resolve} from 'path';
import bodyParser from 'body-parser';
import passport from 'passport';
import adminController from './_controllers/admin';
import authController from './_controllers/auth';
import {configurePassport} from './_utils/passport_manager';

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function startExpressReactServer(listenPort) {

	const app = express();

	app.use(bodyParser.json()); // support json encoded bodies
	app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

	app.use(passport.initialize());
	configurePassport();

	// Serve static files from the React app
	app.use(express.static(resolve(__dirname, '../react_site/build')));

	// API router
	app.use('/api', apiRouter());
	// The "catchall" handler: for any request that doesn't
	// match one above, send back React's index.html file.
	app.get('*', (req, res) => {
		res.sendFile(resolve(__dirname, '../build/index.html'));
	});

	const port = listenPort || 5000;	
	app.listen(port);

	logger.info(`[App] App listening on ${port}`);
}

function apiRouter() {
	const apiRouter = express.Router();

	// Adding identification routes
	authController(apiRouter);
	// Adding admin routes
	adminController(apiRouter);

	return apiRouter;
}
