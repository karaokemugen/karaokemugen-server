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
import ProxyController from './_controllers/proxy';
import {configurePassport} from './_utils/passport_manager';
import {getConfig} from './_utils/config';
import range from 'express-range';
import vhost from 'vhost';
import {getInstanceRoom} from '../_dao/proxy';
import proxy from 'express-http-proxy';

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function initFrontend(listenPort) {

	const conf = getConfig();
	const app = express();

	app.enable('trust proxy');
	app.use(bodyParser.json({limit: '100mb'})); // support json encoded bodies
	app.use(bodyParser.urlencoded({
		limit: '100mb',
		extended: true
	})); // support encoded bodies

	app.use(passport.initialize());
	configurePassport();
	// Server allows resuming file downloads :
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
		res.status(404).send('Not found');
	});

	app.use(vhost(`*.${conf.KMProxy.Host}`), getKMRoom, proxy(redirectKMRoom, {
		memoizeHost: false
	}));

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
	// Online Mode for KM App
	ProxyController(apiRouter);

	return apiRouter;
}

function getKMRoom(req, res, next) {
	const instance = getInstanceRoom(req.vhost[0]);
	if (!instance) {
		res.status(404).send('No room exists by this name');
	} else {
		req.KMAppPort = instance.port;
		next();
	}
}

function redirectKMRoom(req) {
	return `http://localhost:${req.KMAppPort}`;
}