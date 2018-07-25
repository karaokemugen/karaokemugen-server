import {initConfig} from './_utils/config';
import logger from 'winston';
import {join} from 'path';
import {initFrontend} from './frontend';
import {argv} from 'yargs';
import detect from 'detect-port';
import {initDB, closeDB} from './_dao/database';
import {run} from './_dao/generation';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');

process.on('uncaughtException', function (exception) {
	console.log(exception);
});

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

main().catch(err => {
	console.log(err);
	logger.error(`[Launcher] Error during launch : ${err}`);
	process.exit(1);
});

async function main() {
	await initConfig(appPath, argv);
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');

	const opts = {
		port: argv.port || 1350,
	};

	await initDB();
	if (argv.generate) {
		await run();
		exit();
	}
	opts.port = await detect(opts.port);
	logger.debug(`[Launcher] Port ${opts.port} is available`);
	initFrontend(opts.port);
}

function exit(rc) {
	// Closing database
	closeDB().then(() => {
		process.exit(rc || 0);
	}).catch(() => {
		process;exit(1);
	});
}