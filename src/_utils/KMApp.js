import pm2 from 'pm2';
import {promisify} from 'util';
import { getConfig } from './config';
import {resolve} from 'path';
import {asyncWriteFile, asyncMove, asyncExists, asyncUnlink} from './files';
import {stringify} from 'ini';
import {generate} from 'randomstring';
import fp from 'find-free-port';
import io from 'socket.io';
import {createServer} from 'net';

function connect(...args) {
	return promisify(pm2.connect)(...args);
}

function start(...args) {
	return promisify(pm2.start)(...args);
}

function disconnect(...args) {
	return promisify(pm2.disconnect)(...args);
}

export default class KMApp {

	constructor (opts) {
		this.id = opts.id;
		this.conf = getConfig();
		this.port = 0;
		this.appConfig = {};
		this.appPath = resolve(this.conf.appPath, this.conf.Path.KaraokeMugenApp);
		this.room = generate({
			length: 4,
			readable: true,
			charset: 'alphabetic',
			capitalization: 'uppercase'
		});
		this.mpvSocket = null;
		this.localSocket = null;
		this.websocket = null;
	}

	setup = async(files, instanceConfig) => {
		for (const file of files) {
			await asyncMove(file.path, resolve(this.conf.appPath, this.conf.Path.KaraokeMugenApp,'app/db/',`${this.id}-${file.fieldname}.sqlite3`), {overwrite: true});
		}
		this.port = await fp(13337, 14337);
		const onlineConfig = {
			appFirstRun: 0,
			appInstanceID: this.id,
			appFrontendPort: this.port,
			OnlineMode: 0,
			PathBin: 'app/bin',
			PathKaras: 'app/data/karas',
			PathMedias: 'app/data/medias',
			PathSubs: 'app/data/lyrics',
			PathDB: 'app/db',
			PathDBKarasFile: `${this.id}-karaDB.sqlite3`,
			PathDBUserFile: `${this.id}-userDB.sqlite3`,
			PathSeries: 'app/data/series',
			PathBackgrounds: 'app/backgrounds',
			PathJingles: 'app/jingles',
			PathTemp: 'app/temp',
			PathPreviews: 'app/previews',
			PathImport: 'app/import',
			PathAvatars: 'app/avatars',
			PathMediasHTTP: '',
		};
		this.appConfig = {...instanceConfig, ...onlineConfig};
		await asyncWriteFile(resolve(this.appPath, `config-${this.id}.ini`), stringify(this.appConfig), 'utf-8');

		// Socket dance.
		// First we create a UNIX socket for mpv
		const mpvSocketPath = resolve(this.appPath, `socket-${this.id}`);
		if (await asyncExists(mpvSocketPath)) await asyncUnlink(mpvSocketPath);
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
		this.mpvSocket.listen(mpvSocketPath);
		this.websocket = io.connect(`http://localhost:${this.conf.Frontend.Port}`);
		this.websocket.on('connect', () => {
			this.websocket.emit('room', this.id);
		});
		// When receiving a message to mpv, write it to the unix socket so
		// spawned KM App can interpret it.
		this.websocket.on('client', (data) => {
			this.localSocket.write(data + '\n');
		});

		return {
			room: this.room,
			port: this.port
		};
	}

	start = async() => {

		await connect(true);
		await start({
			name: this.id,
			script: 'src/index.js',
			cwd: this.appPath,
			args: [
				'--config',
				resolve(this.appPath, `config-${this.id}.ini`),
				'--noCheck',
				'--spawn'
			],
			pid: resolve(this.appPath, `app-${this.id}.pid`),
			killTimeout: 5000,
			interpreter: 'babel-node'
		});
		await disconnect();
	}

	stop = async() => {
		await connect(true);
		await delete(this.id);
		await disconnect();
		// Signal the local KM App that it can get its database back.
		this.websocket.emit('terminated', this.id);
	}

}