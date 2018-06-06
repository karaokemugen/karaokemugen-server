import minimist from 'minimist';
import {initConfig} from './_utils/config';
import logger from 'winston';
import {createServer} from 'net';
import {join} from 'path';
import {launchTunnelServer} from './tunnel';
import {startExpressReactServer} from './react';
import {argv} from 'yargs';
import detect from 'detect-port';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');

process.on('uncaughtException', function (exception) {
	console.log(exception);
});

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
	
main().catch(err => {
	logger.error(`[Launcher] Error during launch : ${err}`);
	process.exit(1);
});

async function main() {
	initConfig(appPath, argv);
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');

	const opts = {
		maxSockets: argv['max-sockets'] || 15,
		port: argv.port || 1350,
		secure: argv.secure || false
	};
	
	const port = await detect(opts.port);
	opts.port = port;
	logger.info(`Port ${opts.port} is available`);
	//launchTunnelServer(opts);
	startExpressReactServer(opts.port);	
}

