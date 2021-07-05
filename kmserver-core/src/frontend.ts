import logger from './lib/utils/logger';
import express from 'express';
import {resolve} from 'path';
import adminController from './controllers/http/admin';
import authController from './controllers/http/auth';
import KServerController from './controllers/http/karaserv';
import KImportController from './controllers/http/karaimport';
import statsController from './controllers/http/stats';
import userController from './controllers/http/user';
import favoritesController from './controllers/http/favorites';
import remoteSocketController from './controllers/ws/remote';
import userSubSocketController from './controllers/ws/user';
import {getConfig, resolvedPathAvatars, resolvedPathPreviews, resolvedPathRepos} from './lib/utils/config';
import range from 'express-range';
import vhost from 'vhost';
import {createServer} from 'http';
import helmet from 'helmet';
import compression from 'compression';
import { getState } from './utils/state';
import { initWS } from './lib/utils/ws';
import { startKMExplorer } from './services/kmexplorer';
import { initRemote } from './services/remote';

/**
 * Starting express which will serve our app.
 * Serving this app means it has to be built beforehand.
 */
export function initFrontend(listenPort: number) {

	const conf = getConfig();
	const state = getState();
	const app = express();
	const API = express();
	const KMExplorer = express();
	const KMServer = express();

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
	}));
	app.use(compression());
	app.use(express.json({limit: '1000mb'})); // support json encoded bodies
	app.use(express.urlencoded({
		limit: '1000mb',
		extended: true
	})); // support encoded bodies

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

	KMExplorer.get('/favicon.ico', (_, res) => {
		res.redirect('/static/favicon.ico');
		return;
	});

	//KMServer
	// If static serve is enabled, we're serving all files from KMServer instead of Apache/nginx
	if (state.opt.staticServe) {
		KMServer.use('/downloads/karaokes', express.static(resolvedPathRepos('Karaokes')[0]));
		KMServer.use('/downloads/lyrics', express.static(resolvedPathRepos('Lyrics')[0]));
		KMServer.use('/downloads/medias', express.static(resolvedPathRepos('Medias')[0]));
		KMServer.use('/downloads/tags', express.static(resolvedPathRepos('Tags')[0]));
	}

	// API router
	app.use(vhost(`${conf.API.Host}`, API));
	API.use('/api', api());
	if (conf.Users.Enabled) API.use('/avatars', express.static(resolvedPathAvatars()));
	// Redirect old base route to root
	app.get('/base/*', (req, res) => {		
		res.redirect(301, req.url.replace(/base\//g, ''));
	});
	// KMExplorer
	if (conf.KaraExplorer.Enabled) {
		app.use(vhost(`${conf.KaraExplorer.Host}`, KMExplorer));

		KMExplorer.use('/previews', express.static(resolvedPathPreviews()));

		startKMExplorer().then(nuxt => {
			KMExplorer.use(nuxt.render);
		});
	}
	
	// Load static assets from static folder (mostly error pages)
	app.use('/static', express.static(resolve(state.appPath, 'kmserver-core/static')));

	const port = listenPort;
	const server = createServer(app);

	const ws = initWS(server);
	if (conf.Remote.Enabled) {
		remoteSocketController(ws);
		app.use(vhost(`*.${conf.Remote.BaseHost}`, initRemote()));
	}
	userSubSocketController(ws);

	// The "catchall" handler: for any request that doesn't
	// match one above, send a 404 page.
	app.get('*', (_, res) => res.status(404).sendFile(resolve(state.appPath, 'kmserver-core/static/404.html')));

	server.listen(port, () => logger.info(`App listening on ${port}`, {service: 'App'}));
}

function api() {
	const apiRouter = express.Router();
	const conf = getConfig();
	// Adding admin routes
	adminController(apiRouter);
	// Adding KaraServ routes
	KServerController(apiRouter);
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
