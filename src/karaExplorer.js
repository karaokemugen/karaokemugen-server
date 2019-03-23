import pm2 from 'pm2';
import { getConfig } from './_utils/config';
import {resolve} from 'path';
import logger from 'winston';

var uniqid = function() {
	return (new Date().getTime() + Math.floor((Math.random()*10000)+1)).toString(16);
};

export default class KaraExplorer {

	constructor (opts) {
		this.conf = getConfig();
		this.appPath = resolve(this.conf.appPath);
		this.app = null;

		this.id = uniqid();
		this.api = opts.api || 'http://localhost:1350';
		this.port = opts.port || 3000;
		this.path = opts.path || '/';
	}

	start = async() => {
		return new Promise((OK, NOK) => {
			pm2.connect(true, (err) => {
				if (err) {
					NOK(err);
				} else {
					logger.info(`[Spawn] [${this.id}] connected to PM2`);
					pm2.start({
						name: `kmx-${this.id}`,
						script: 'server.js',
						cwd: resolve(__dirname,'../kmexplorer/'),
						args: [
							'--api='+this.api,
							'--port='+this.port,
							'--path='+this.path,
						],
						pid: resolve(this.appPath, `${this.id}.pid`),
						killTimeout: 10000,
						output: resolve(this.appPath, 'logs/kmexplorer.log'),
						error: resolve(this.appPath, 'logs/kmexplorer-err.log')
					}, (err, apps) => {
						if (err) {
							NOK(err);
						} else {
							this.app = apps;
							logger.info(`[Spawn] Started [${this.id}]`);
							pm2.disconnect();
							OK();
						}
					});
				}

			});
		});
	}

	stop = () => {
		pm2.delete(`kmx-${this.id}`);
		pm2.disconnect();
	}
}