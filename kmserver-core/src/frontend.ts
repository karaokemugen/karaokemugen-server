import { resolve } from 'node:path';

import compression from 'compression';
import express from 'express';
import range from 'express-range';
import helmet from 'helmet';
import { createServer } from 'http';
import vhost from 'vhost';

import adminController from './controllers/http/admin.js';
import authController from './controllers/http/auth.js';
import favoritesController from './controllers/http/favorites.js';
import inboxController from './controllers/http/inbox.js';
import KImportController from './controllers/http/karaImport.js';
import KServerController from './controllers/http/karaserv.js';
import PLController from './controllers/http/playlist.js';
import PMController from './controllers/http/playlistMedias.js';
import remoteController from './controllers/http/remote.js';
import statsController from './controllers/http/stats.js';
import suggestionsController from './controllers/http/suggestions.js';
import userController from './controllers/http/user.js';
import remoteSocketController from './controllers/ws/remote.js';
import userSubSocketController from './controllers/ws/user.js';
import { startKMExplorer } from './kmexplorer.js';
import {
	getConfig,
	resolvedPath,
	resolvedPathRepos
} from './lib/utils/config.js';
import logger from './lib/utils/logger.js';
import { initWS } from './lib/utils/ws.js';
import { initRemote } from './services/remote.js';
import { getState } from './utils/state.js';

const service = 'Frontend';

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function initFrontend(listenPort: number) {
	const conf = getConfig();
	const state = getState();
	const app = express();
	const protocol = `http${conf.Frontend.Secure ? 's' : ''}:`;

	// Trust our reverse proxy entirely
	app.set('trust proxy', (ip: string) => {
		return ip === '127.0.0.1' ||
			ip === '::ffff:127.0.0.1';
	});
	// Remove double-slashes at the start of URLs
	app.use((req, res, next) => {
		if (/\/\//g.test(req.path)) res.redirect(req.path.replace(/\/\//g, '/'));
		else next();
	});
	app.use(helmet({
		crossOriginResourcePolicy: conf.Frontend.Host === 'localhost' ? false : {
			policy: 'same-origin'
		},
		hsts: false,
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ['\'self\'', 'data:'],
				scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://storage.googleapis.com/workbox-cdn/'],
				styleSrc: ['\'self\'', '\'unsafe-inline\''],
				connectSrc: ['\'self\'', protocol, 'wss:', 'data:'],
				mediaSrc: ['\'self\'', protocol, 'data:', 'blob:'],
				imgSrc: ['\'self\'', protocol, 'data:', 'blob:'],
				frameSrc: ['\'self\''],
				frameAncestors: [protocol],
				workerSrc: ['\'self\'', 'https://storage.googleapis.com/workbox-cdn/'],
				upgradeInsecureRequests: conf.Frontend.Secure ? [] : null,
			}
		}
	}) as express.Handler);
	app.use(compression());
	app.use(express.json({limit: '1000mb'}) as express.Handler); // support json encoded bodies
	app.use(express.urlencoded({
		limit: '1000mb',
		extended: true
	}) as express.Handler); // support encoded bodies

	// Server allows resuming file downloads :
	app.use(range());

	app.use((req, res, next) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept, Key');
		req.method === 'OPTIONS'
			? res.json()
			: next();
	});

	// KMServer
	// If static serve is enabled, we're serving all files from KMServer instead of our reverse proxy
	if (state.opt.staticServe) {
		app.use('/downloads', express.static(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir)));
		app.use('/downloads/medias', express.static(resolvedPathRepos('Medias')[0]));
		app.use('/hardsubs', express.static(resolve(getState().dataPath, getConfig().System.Path.Hardsubs)));
	}

	// API router
	app.use('/api', api());
	if (conf.Users.Enabled) {
		app.use('/avatars', express.static(resolvedPath('Avatars')));
		app.use('/banners', express.static(resolvedPath('Banners')));
	}
	// KMExplorer
	if (conf.Frontend.Enabled) {
		app.use('/previews', express.static(resolvedPath('Previews')));
	}

	const port = listenPort;
	const server = createServer(app);

	const ws = initWS(server);
	if (conf.Remote.Enabled) {
		remoteSocketController(ws);
		app.use(vhost(`*.${conf.Remote.BaseHost}`, initRemote()));
	}
	// KMExplorer
	if (conf.Frontend.Enabled) {
		startKMExplorer(app);
	}
	userSubSocketController(ws);

	server.listen(port, () => logger.info(`App listening on ${port}`, {service}));
}

function api() {
	const apiRouter = express.Router();
	const conf = getConfig();
	// Adding admin routes
	adminController(apiRouter);
	remoteController(apiRouter);
	// Adding KaraServ routes
	KServerController(apiRouter);
	PLController(apiRouter);
	inboxController(apiRouter);
	PMController(apiRouter);
	if (conf.Frontend.Import.Enabled) KImportController(apiRouter);
	// Stats
	if (conf.Stats.Enabled) statsController(apiRouter);
	if (conf.Users.Enabled) {
		userController(apiRouter);
		favoritesController(apiRouter);
		authController(apiRouter);
	}
	if (conf.Frontend.Suggestions) suggestionsController(apiRouter);
	return apiRouter;
}
