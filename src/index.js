import {getConfig, initConfig, setConfig} from './_utils/config';
import logger from 'winston';
import {join} from 'path';
import {initFrontend} from './frontend';
import cli from 'commander';
import detect from 'detect-port';
import {initDB} from './_dao/database';
import {initMailer} from './_utils/mailer';
import {initShortener} from './_services/shortener';
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
	const conf = getConfig();
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');

	await initDB();
	if (argv.generate) {
		await run();
		exit();
	}
	const port = await detect(+argv.port || conf.Frontend.Port);
	if (port !== conf.Frontend.Port) setConfig({
		Frontend: {
			Port: port
		}
	});
	logger.debug(`[Launcher] Port ${port} is available`);
	if (getConfig().Mail.Enabled) initMailer();
	initShortener();
	initFrontend(port);
	logger.info('[Launcher] Karaoke Mugen Server is READY');
}

function exit(rc) {
	process.exit(rc || 0);
}

function parseArgs() {
	const argv = process.argv.filter(e => e !== '--');
	return cli
		.command('kmserver.sh')
		.description('Starts Karaoke Mugen Server')
		.version(pjson.version)
		.option('--port [port]', 'specify which port to listen to', 'port')
		.option('--generate', 'generate karaoke database')
		.parse(argv);
}