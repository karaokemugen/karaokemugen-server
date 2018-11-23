import pm2 from 'pm2';
import {promisify} from 'util';
import { getConfig } from './config';
import {resolve} from 'path';
import {asyncWriteFile, asyncMove} from './files';
import {stringify} from 'ini';
import {generate} from 'randomstring';
import fp from 'find-free-port';

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
		return {
			room: this.room,
			port: this.port
		};
	}

	start = async() => {

		await connect(true);
		await start({
			name: this.id,
			script: 'dist/index.js',
			cwd: this.appPath,
			args: [
				'--config',
				resolve(this.appPath, `config-${this.id}.ini`),
				'--noCheck',
				'--spawn'
			]
		});
		await disconnect();

	}

	stop = async() => {
		await connect(true);
		await delete(this.id);
		await disconnect();
	}

}