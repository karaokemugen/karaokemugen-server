import compression from 'compression';
import express from 'express';
import range from 'express-range';
import helmet from 'helmet';
import {createServer} from 'http';
import {resolve} from 'path';
import vhost from 'vhost';

import adminController from './controllers/http/admin';
import authController from './controllers/http/auth';
import favoritesController from './controllers/http/favorites';
import inboxController from './controllers/http/inbox';
import KImportController from './controllers/http/karaimport';
import KServerController from './controllers/http/karaserv';
import statsController from './controllers/http/stats';
import userController from './controllers/http/user';
import remoteSocketController from './controllers/ws/remote';
import userSubSocketController from './controllers/ws/user';
import {
	getConfig,
	resolvedPath,
	resolvedPathRepos
} from './lib/utils/config';
import logger from './lib/utils/logger';
import { initWS } from './lib/utils/ws';
import { startKMExplorer } from './services/kmexplorer';
import { initRemote } from './services/remote';
import { getState } from './utils/state';

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function initFrontend(listenPort: number) {
	const conf = getConfig();
	const state = getState();
	const app = express();

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
		hsts: false,
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ['\'self\'', 'data:'],
				scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://cdn.jsdelivr.net/'],
				styleSrc: ['\'self\'', '\'unsafe-inline\''],
				connectSrc: ['\'self\'', 'https:', 'wss:', 'data:'],
				mediaSrc: ['\'self\'', 'https:', 'data:', 'blob:'],
				imgSrc: ['\'self\'', 'https:', 'data:', 'blob:'],
				frameSrc: ['\'self\'', getConfig().KaraExplorer.LiveURL],
				workerSrc: ['\'self\'', 'https://cdn.jsdelivr.net']
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
	// If static serve is enabled, we're serving all files from KMServer instead of Apache/nginx
	if (state.opt.staticServe) {
		app.use('/downloads', express.static(resolve(getState().appPath, getConfig().System.Repositories[0].BaseDir)));
		app.use('/downloads/medias', express.static(resolvedPathRepos('Medias')[0]));
		app.use('/hardsubs', express.static(resolve(getState().dataPath, getConfig().System.Path.Hardsubs)));
	}

	// API router
	app.use('/api', api());
	if (conf.Users.Enabled) {
		app.use('/avatars', express.static(resolvedPath('Avatars')));
		app.use('/banners', express.static(resolvedPath('Banners')));
	}
	// Redirect old base route to root
	app.get('/base*', (req, res) => {
		res.redirect(301, req.url.replace(/^\/base\/?/, '/'));
	});
	// KMExplorer
	if (conf.KaraExplorer.Enabled) {
		app.use('/previews', express.static(resolvedPath('Previews')));

		startKMExplorer().then(nuxt => {
			app.use(nuxt.render);
		});
	}

	const port = listenPort;
	const server = createServer(app);

	const ws = initWS(server);
	if (conf.Remote.Enabled) {
		remoteSocketController(ws);
		app.use(vhost(`*.${conf.Remote.BaseHost}`, initRemote()));
	}
	userSubSocketController(ws);

	server.listen(port, () => logger.info(`App listening on ${port}`, {service: 'App'}));
}

function api() {
	const apiRouter = express.Router();
	const conf = getConfig();
	// Adding admin routes
	adminController(apiRouter);
	// Adding KaraServ routes
	KServerController(apiRouter);
	inboxController(apiRouter);
	if (conf.KaraExplorer.Import) KImportController(apiRouter);
	// Stats
	if (conf.Stats.Enabled) statsController(apiRouter);
	// Online Mode for KM App
	if (conf.Users.Enabled) {
		userController(apiRouter);
		favoritesController(apiRouter);
		authController(apiRouter);
	}
	return apiRouter;
}
