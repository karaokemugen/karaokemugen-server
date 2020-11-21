import logger from './lib/utils/logger';
import express from 'express';
import {resolve, join} from 'path';
import bodyParser from 'body-parser';
import adminController from './controllers/http/admin';
import authController from './controllers/http/auth';
import KServerController from './controllers/http/karaserv';
import KImportController from './controllers/http/karaimport';
import statsController from './controllers/http/stats';
import shortenerController from './controllers/http/shortener';
import userController from './controllers/http/user';
import favoritesController from './controllers/http/favorites';
import shortenerSocketController from './controllers/ws/shortener';
import {getConfig, resolvedPathAvatars, resolvedPathPreviews, resolvedPathRepos, resolvedPathTemp} from './lib/utils/config';
import range from 'express-range';
import vhost from 'vhost';
//import {getInstanceRoom} from './dao/proxy'; For KM instances hosting
import {createServer} from 'http';
import helmet from 'helmet';
import compression from 'compression';
import { getState } from './utils/state';
import { initWS } from './lib/utils/ws';
import {startKMExplorer} from './services/kmexplorer';
import fileupload from 'express-fileupload';

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
	const Shortener = express();
	const KMServer = express();

	app.set('trust proxy', (ip: string) => {
		return ip === '127.0.0.1' ||
			ip === '::ffff:127.0.0.1';
	});
	app.use(helmet({
		hsts: false,
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ['\'self\'', 'data:'],
				scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://cdn.jsdelivr.net/'],
				styleSrc: ['\'self\'', '\'unsafe-inline\''],
				connectSrc: ['\'self\'', 'https:'],
				frameSrc: ['\'self\'', getConfig().KaraExplorer.LiveURL],
				workerSrc: ['\'self\'', 'https://cdn.jsdelivr.net']
			}
		}
	}));
	app.use(compression());
	app.use(bodyParser.json({limit: '1000mb'})); // support json encoded bodies
	app.use(bodyParser.urlencoded({
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
	app.use(fileupload({
		useTempFiles: true,
		tempFileDir: resolvedPathTemp(),
		debug: true,
		uploadTimeout: 0
	}));

	KMExplorer.get('/favicon.ico', (_, res) => {
		res.redirect('/static/favicon.ico');
		return;
	});

	//KMServer
	// If static serve is enabled, we're serving all files from KMServer instead of Apache/nginx
	if (state.opt.staticServe) {
		app.use(vhost(`${conf.API.Host}`, API));
		KMServer.use('/downloads/karaokes', express.static(resolvedPathRepos('Karas')[0]));
		KMServer.use('/downloads/lyrics', express.static(resolvedPathRepos('Lyrics')[0]));
		KMServer.use('/downloads/medias', express.static(resolvedPathRepos('Medias')[0]));
		KMServer.use('/downloads/tags', express.static(resolvedPathRepos('Tags')[0]));
	}

	// API router
	app.use(vhost(`${conf.API.Host}`, API));
	API.use('/api', api());
	if (conf.Users.Enabled) API.use('/avatars', express.static(resolvedPathAvatars()));
	if (conf.Shortener.Enabled) {
		app.use(vhost(`${conf.API.Host}`, Shortener));
		Shortener.get('/', (_, res) => {
			res.redirect('/api/shortener');
			return;
		});
	}
	// Old import route
	app.get('/import', (_req, res) => {
		res.redirect(join(conf.KaraExplorer.Path, 'import'));
	});
	// KMExplorer
	if (conf.KaraExplorer.Enabled) {
		app.use(vhost(`${conf.KaraExplorer.Host}`, KMExplorer));

		KMExplorer.use('/previews', express.static(resolvedPathPreviews()));

		startKMExplorer().then(nuxt => {
			KMExplorer.use(nuxt.render);
		});
	}
	if (conf.API.Host !== conf.KaraExplorer.Host && conf.KaraExplorer.Path && conf.KaraExplorer.Path !== '/') {
		KMExplorer.get('/', (_, res) => {
			res.redirect(conf.KaraExplorer.Path);
		});
	}

	// Load static assets from static folder (mostly error pages)
	app.use('/static', express.static(resolve(state.appPath, 'kmserver-core/static')));

	/** Disabled code for KM Rooms
	app.use(vhost(`*.${conf.Frontend.Host}`, getKMRoom), proxy(redirectKMRoom, {
		memoizeHost: false
	}));
	*/


	// The "catchall" handler: for any request that doesn't
	// match one above, send a 404 page.
	app.get('*', (_, res) => res.status(404).sendFile(resolve(state.appPath, 'kmserver-core/static/404.html')));

	const port = listenPort;
	const server = createServer(app);

	const ws = initWS(server);
	if (conf.Shortener.Enabled) {
		shortenerSocketController(ws);
	}

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
	// Shortener/kara.moe route
	if (conf.Shortener.Enabled) shortenerController(apiRouter);
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

/* This code is disabled until we get to host our own KM Apps on this server code
function getKMRoom(_req: any, _res: Response, next: any) {

	const instance = getInstanceRoom(req.vhost[0]);
    if (!instance) {
        res.status(404).send('No room exists by this name');
    } else {
        req.KMAppPort = instance.port;
        next();
	}
	next();
}

function redirectKMRoom(req: any) {
	return `http://localhost:${req.KMAppPort}`;
}
*/
