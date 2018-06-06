import minimist from 'minimist';
import {initConfig} from './config';
import logger from 'winston';
import {createServer} from 'net';
import {join} from 'path';
import {launchTunnelServer} from './tunnel';
import {argv} from 'yargs';
const pjson = require('../package.json');
const appPath = join(__dirname,'../');
	
main().catch(err => {
	logger.error(`[Launcher] Error during launch : ${err}`);
	process.exit(1);
});

function main() {
	initConfig(appPath, argv);
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');

	const opts = {
		maxSockets: argv['max-sockets'] || 15,
		port: argv.port || 1339,
		secure: argv.secure || false
	};
	
	verifyOpenPort(opts.port);
	logger.info(`Port ${opts.port} is available`);
	//launchTunnelServer(opts);
	process.exit(0);
}

function verifyOpenPort(port) {
	const server = createServer();
	server.once('error', err => {
		if (err.code === 'EADDRINUSE') {
			logger.error(`Port ${port} is already in use.`);
			console.log('If another Karaoke Mugen Server instance is running, please kill it (process name is "node")');
			console.log('Then restart the app.');
			process.exit(1);
		}
	});
	server.once('listening', () => server.close());
	server.listen(port);
}

