import logger from 'winston';
import express from 'express';
import {resolve} from 'path';
import bodyParser from 'body-parser';
import passport from 'passport';
import adminController from './_controllers/admin';
import authController from './_controllers/auth';
import KSController from './_controllers/karaserv';
import KIController from './_controllers/karaimport';
import StatsController from './_controllers/stats';
import ShortenerController from './_controllers/shortener';
import {configurePassport} from './_utils/passport_manager';
import {getConfig} from './_utils/config';
import range from 'express-range';

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function initFrontend(listenPort) {

	const conf = getConfig();
	const app = express();

	app.enable('trust proxy');
	app.use(bodyParser.json()); // support json encoded bodies
	app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

	app.use(passport.initialize());
	configurePassport();
	app.use(range());
	// Serve static files from the React app
	app.use('/site', express.static(resolve(__dirname, '../react_site/build')));

	app.use((req, res, next) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept, Key');
		if (req.method === 'OPTIONS') {
			res.statusCode = 200;
			res.json();
		} else {
			// Pass to next layer of middleware
			next();
		}
	});
	app.use('/downloads/karas', express.static(resolve(conf.appPath, conf.Path.Karas)));
	app.use('/downloads/lyrics', express.static(resolve(conf.appPath, conf.Path.Lyrics)));
	app.use('/downloads/medias', express.static(resolve(conf.appPath, conf.Path.Medias)));
	app.use('/downloads/series', express.static(resolve(conf.appPath, conf.Path.Series)));
	// API router
	app.use('/api', api());
	app.get('/', (req, res) => res.redirect('/api/shortener'));
	// The "catchall" handler: for any request that doesn't
	// match one above, send back React's index.html file.
	app.get('*', (req, res) => {
		res.sendFile(resolve(__dirname, '../build/index.html'));
	});

	const port = listenPort || 5000;
	app.listen(port);

	logger.info(`[App] App listening on ${port}`);
}

function api() {
	const apiRouter = express.Router();

	// Adding identification routes
	authController(apiRouter);
	// Adding admin routes
	adminController(apiRouter);
	// Adding KaraServ routes
	KSController(apiRouter);
	KIController(apiRouter);
	// Shortener/kara.moe route
	ShortenerController(apiRouter);
	// Stats
	StatsController(apiRouter);

	return apiRouter;
}
