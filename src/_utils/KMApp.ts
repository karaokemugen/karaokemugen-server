import pm2 from 'pm2';
import { getConfig } from './config';
import {resolve} from 'path';
import {asyncWriteFile, asyncMove, asyncUnlink} from './files';
import {stringify} from 'ini';
import {generate} from 'randomstring';
import fp from 'find-free-port';
import {connect} from 'socket.io-client';
import {createServer} from 'net';
import logger from 'winston';
import { basename } from 'path';

export default class KMApp {

	id: any;
	conf: any;
	port: number;
	app: any;
	appConfig: any;
	appPath: string;
	room: string;
	mpvSocketPath: string;
	mpvSocket: any;
	localSocket: any;
	websocket: any;

	constructor (opts) {
		this.id = opts;
		this.conf = getConfig();
		this.port = 0;
		this.app = null;
		this.appConfig = {};
		this.appPath = resolve(this.conf.appPath, this.conf.Path.KaraokeMugenApp);
		this.room = generate({
			length: 4,
			readable: true,
			charset: 'alphabetic',
			capitalization: 'lowercase'
		});
		//this.mpvSocketPath = resolve('/tmp/',`km-node-mpvsocket-${this.id}`);
		this.mpvSocketPath = `\\\\.\\pipe\\mpv-server-socket-${this.id}`;
		this.mpvSocket = null;
		this.localSocket = null;
		this.websocket = null;
	}

	setup = async(files, instanceConfig) => {
		logger.info(`[Spawn] [${this.id}] Setup start`);
		try {
			await asyncUnlink(this.mpvSocketPath);
		} catch(err) {
			//Do nothing.
		}
		for (const file of files) {
			await asyncMove(file, resolve(this.conf.appPath, this.conf.Path.KaraokeMugenApp,`app/db/${basename(file)}`), {overwrite: true});
		}
		logger.info(`[Spawn] [${this.id}] Moved databases in place`);
		this.port = await fp(13337, 14337);
		const onlineConfig = {
			appFirstRun: 0,
			appInstanceID: this.id,
			appFrontendPort: this.port[0],
			OnlineMode: 0,
			OnlineHost: 'localhost',
			OnlinePort: this.conf.Frontend.Port,
			PathBin: 'app/bin',
			PathKaras: resolve(this.conf.appPath, this.conf.Path.Karas),
			PathMedias: resolve(this.conf.appPath, this.conf.Path.Medias),
			PathSubs: resolve(this.conf.appPath, this.conf.Path.Lyrics),
			PathDB: 'app/db',
			PathDBKarasFile: `karas-${this.id}.sqlite3`,
			PathDBUserFile: `userdata-${this.id}.sqlite3`,
			PathSeries: resolve(this.conf.appPath, this.conf.Path.Series),
			PathBackgrounds: 'app/backgrounds',
			PathJingles: 'app/jingles',
			PathTemp: 'app/temp',
			PathPreviews: 'app/previews',
			PathImport: 'app/import',
			PathAvatars: 'app/avatars',
			PathMediasHTTP: '',
		};
		delete instanceConfig.VersionNo;
		delete instanceConfig.VersionName;
		delete instanceConfig.VersionImage;
		delete instanceConfig.os;
		delete instanceConfig.appPath;
		this.appConfig = {...instanceConfig, ...onlineConfig};
		await asyncWriteFile(resolve(this.appPath, `config-${this.id}.ini`), stringify(this.appConfig), 'utf-8');
		logger.info(`[Spawn] [${this.id}] Wrote config`);
		// Socket dance.
		// First we create a UNIX socket for mpv
		//if (await asyncExists(this.mpvSocketPath)) await asyncUnlink(this.mpvSocketPath);
		this.mpvSocket = createServer( (socket) => {
			this.localSocket = socket;
			// When we receive data on the unix socket, we send it to the websocket
			// So local MPV can receive and interpret data.
			socket.on('data', (data) => {
				const messages = data.toString().split('\n');
				for (const message of messages) {
					if (message.length > 0) {
						this.websocket.emit('server', message);
					}
				}
			});
		});
		this.mpvSocket.listen(this.mpvSocketPath);
		logger.info(`[Spawn] [${this.id}] mpv Socket created`);
		this.websocket = connect(`http://localhost:${this.conf.Frontend.Port}`);
		this.websocket.on('connect', () => {
			this.websocket.emit('room', this.id);
		});
		this.websocket.on('shutdown', () => {
		    this.stop();
		});
		// When receiving a message to mpv, write it to the unix socket so
		// spawned KM App can interpret it.
		this.websocket.on('client', (data) => {
			this.localSocket.write(data + '\n');
		});
		logger.info(`[Spawn] [${this.id}] Web Socket created`);
		return {
			room: this.room,
			port: this.port
		};
	}

	start = async() => {
		return new Promise((resolve, reject) => {
			pm2.connect(true, (err) => {
				if (err) {
					reject(err);
				} else {
					logger.info(`[Spawn] [${this.id}] connected to PM2`);
					let startParams: any = {
						name: this.id,
						script: 'dist/index.js',
						cwd: this.appPath,
						args: [
							'--config',
							resolve((this.appPath, `config-${this.id}.ini`)),
							'--noCheck',
							'--spawn'
						],
						pid: resolve((this.appPath, `app-${this.id}.pid`)),
						killTimeout: 10000
					};
					pm2.start(startParams, (err, apps) => {
						if (err) {
							reject(err);
						} else {
							this.app = apps;
							logger.info(`[Spawn] [${this.id}] Started KM App`);
							pm2.disconnect();
						}
					});
				}

			});
		});
	}

	stop = async() => {
		return new Promise((resolve, reject) => {
			pm2.connect(true, (err) => {
				if (err) {
					reject(err);
				} else {
					pm2.delete(this.id, (err) => {
						if (err) {
							reject(err);
						} else {
							pm2.disconnect();
							this.mpvSocket.close();
							// Signal the local KM App that it can get its database back.
							this.websocket.emit('terminated', this.id);
							this.websocket.close();
							resolve();
						}
					});
				}
			});
		});
	}

}
