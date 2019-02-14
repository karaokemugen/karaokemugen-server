import pm2 from 'pm2';
import { getConfig } from './_utils/config';
import {resolve} from 'path';
import {asyncWriteFile, asyncMove, asyncExists, asyncUnlink} from './_utils/files';
import {stringify} from 'ini';
import {generate} from 'randomstring';
import fp from 'find-free-port';
import {connect} from 'socket.io-client';
import {createServer} from 'net';
import logger from 'winston';
import { basename } from 'path';

var uniqid = function() {
	return (new Date().getTime() + Math.floor((Math.random()*10000)+1)).toString(16);
};

export default class KaraExplorer {

	constructor (opts) {
		this.conf = getConfig();
		this.appPath = resolve(this.conf.appPath, this.conf.Path.KaraokeMugenApp);
		this.app = null;

		this.id = 'KMX_'+uniqid();
		this.api = opts.api ? opts.api : 'http://localhost:1350';
		this.port = opts.port ? opts.port : 3000;
		this.path = opts.path ? opts.path : '/';
	}

	start = async() => {
		return new Promise((resolve, reject) => {
			pm2.connect(true, (err) => {
				if (err) {
					reject(err);
				} else {
					logger.info(`[Spawn] [${this.id}] connected to PM2`);
					pm2.start({
						name: `kmx-${this.id}`,
						script: 'server.js',
						cwd: __dirname+'/../react_site/',
						args: [
							'--api='+this.api,
							'--port='+this.port,
							'--path='+this.path,
						],
						pid: resolve(this.appPath, `${this.id}.pid`),
						killTimeout: 10000
					}, (err, apps) => {
						if (err) {
							reject(err);
						} else {
							this.app = apps;
							logger.info(`[Spawn] Started [${this.id}]`);
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
							resolve();
						}
					});
				}
			});
		});
	}

}