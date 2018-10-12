import {initConfig} from './_utils/config';
import logger from 'winston';
import {join} from 'path';
import {initFrontend} from './frontend';
import cli from 'commander';
import detect from 'detect-port';
import {initDB, closeDB} from './_dao/database';
import {run} from './_dao/generation';
import sudoBlock from 'sudo-block';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');

process.on('uncaughtException', (exception) => {
	console.log(exception);
});

main().catch(err => {
	logger.error(`[Launcher] Error during launch : ${err}`);
	process.exit(1);
});

async function main() {
	sudoBlock('You should not run Karaoke Mugen Server with root permissions, it\'s dangerous.');
	const argv = parseArgs();
	await initConfig(appPath, cli);
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');

	const opts = {
		port: +argv.port || 1350,
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
		process.exit(1);
	});
}

function parseArgs() {
	const argv = process.argv.filter(e => e !== '--');
	return cli
		.command('kmserver.sh')
		.description('Starts Karaoke Mugen Server')
		.version(pjson.version)
		.option('-p, --port [port]', 'specify which port to listen to', 'port')
		.option('-g, --generate', 'generate karaoke database')
		.parse(argv);
}