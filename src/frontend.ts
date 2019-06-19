import logger from 'winston';
import express, { Response } from 'express';
import {resolve} from 'path';
import bodyParser from 'body-parser';
import passport from 'passport';
import adminController from './controllers/admin';
import authController from './controllers/auth';
import KServerController from './controllers/karaserv';
import KImportController from './controllers/karaimport';
import statsController from './controllers/stats';
import shortenerController from './controllers/shortener';
import userController from './controllers/user';
import favoritesController from './controllers/favorites';
import {configurePassport} from './utils/passport_manager';
import {getConfig} from './utils/config';
import range from 'express-range';
import vhost from 'vhost';
import {getInstanceRoom} from './dao/proxy';
import proxy from 'express-http-proxy';
import {createServer} from 'http';
import helmet from 'helmet';

let ws: any;

export function getWS() {
	return ws;
}

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function initFrontend(listenPort: number) {

	const conf = getConfig();
	const app = express();
	const mainApp = express();

	app.set('trust proxy', (ip: string) => {
		if (ip === '127.0.0.1' ||
			ip === '::ffff:127.0.0.1'
	 	) return true;
		return false;
	});
	app.use(helmet());
	app.use(bodyParser.json({limit: '100mb'})); // support json encoded bodies
	app.use(bodyParser.urlencoded({
		limit: '100mb',
		extended: true
	})); // support encoded bodies

	app.use(passport.initialize());
	configurePassport();
	// Server allows resuming file downloads :
	app.use(range());
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
	app.use(vhost(`${conf.Frontend.Host}`, mainApp));
	app.use(vhost(`*.${conf.Frontend.Host}`, getKMRoom), proxy(redirectKMRoom, {
		memoizeHost: false
	}));
	// Serve static files from the React app
	mainApp.use('/base', proxy(`http://127.0.0.1:${conf.KaraExplorer.Port}`));
	// fix bad behavior of next-i18next - language file are not prefixed correctly
	mainApp.get('/static/locales/*', (req, res) => {
		res.redirect('/base'+req.url);
		return;
	});
	mainApp.use('/import',  express.static(resolve(conf.appPath, 'kmimport/build')));
	mainApp.get('/import/*', (_, res) => {
		res.sendFile(resolve(conf.appPath, 'kmimport/build/index.html'));
	});

	mainApp.use('/downloads/karas', express.static(resolve(conf.appPath, conf.Path.Karas)));
	mainApp.use('/downloads/karaokes', express.static(resolve(conf.appPath, conf.Path.Karas, '../karaokes/')));
	mainApp.use('/downloads/lyrics', express.static(resolve(conf.appPath, conf.Path.Lyrics)));
	mainApp.use('/downloads/medias', express.static(resolve(conf.appPath, conf.Path.Medias)));
	mainApp.use('/downloads/series', express.static(resolve(conf.appPath, conf.Path.Series)));
	mainApp.use('/previews', express.static(resolve(conf.appPath, conf.Path.Previews)));
	mainApp.use('/avatars', express.static(resolve(conf.appPath, conf.Path.Avatars)));
	// API router
	mainApp.use('/api', api());
	mainApp.get('/', (_, res) => {
		res.redirect('/api/shortener');
		return;
	});
	// The "catchall" handler: for any request that doesn't
	// match one above, send back React's index.html file.
	mainApp.get('*', (_, res) => {
		res.status(404).send('Not found');
	});

	const port = listenPort || 5000;
	const server = createServer(app);
	ws = require('socket.io').listen(server);
	server.listen(port, () => {
		logger.info(`[App] App listening on ${port}`);
	});
}

function api() {
	const apiRouter = express.Router();

	// Adding identification routes
	authController(apiRouter);
	// Adding admin routes
	adminController(apiRouter);
	// Adding KaraServ routes
	KServerController(apiRouter);
	KImportController(apiRouter);
	// Shortener/kara.moe route
	shortenerController(apiRouter);
	// Stats
	statsController(apiRouter);
	// Online Mode for KM App
	userController(apiRouter);
	favoritesController(apiRouter);
	return apiRouter;
}

function getKMRoom(req: any, res: Response, next: any) {
    const instance = getInstanceRoom(req.vhost[0]);
    if (!instance) {
        res.status(404).send('No room exists by this name');
    } else {
        req.KMAppPort = instance.port;
        next();
    }
}


function redirectKMRoom(req: any) {
	return `http://localhost:${req.KMAppPort}`;
}
