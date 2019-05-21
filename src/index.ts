import {getConfig, initConfig, setConfig} from './_utils/config';
import logger from 'winston';
import {resolve, join} from 'path';
import {initFrontend} from './frontend';
import cli from 'commander';
import detect from 'detect-port';
import {initDB} from './_dao/database';
import {initMailer} from './_utils/mailer';
import {initShortener} from './_services/shortener';
import {initFavorites} from './_services/favorites';
import {createUser} from './_services/user';
import {run} from './_dao/generation';
import sudoBlock from 'sudo-block';
import {asyncCheckOrMkdir} from './_utils/files';
import KMExplorer from './_services/kmExplorer';
import findRemoveSync from 'find-remove';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');
let kmx;

process.on('uncaughtException', (exception) => {
	console.log(exception);
});
process.once('SIGTERM', () => {
	logger.info('[Launcher] Received SIGTERM, terminating properly.');
	exit(0);
});

process.once('SIGINT', () => {
	logger.info('[Launcher] Received SIGINT, terminating properly.');
	exit(0);
});

function exit(rc: number) {
	if (kmx) kmx.stop();
	process.exit(rc || 0);
};

main().catch(err => {
	logger.error(`[Launcher] Error during launch : ${JSON.stringify(err)}`);
	console.log(err);
	process.exit(1);
});

async function main() {
	sudoBlock('You should not run Karaoke Mugen Server with root permissions, it\'s dangerous.');
	const argv = parseArgs();
	await initConfig(appPath, argv);
	const conf: any = getConfig();
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');

	await Promise.all([
		asyncCheckOrMkdir(appPath, conf.Path.Medias),
		asyncCheckOrMkdir(appPath, conf.Path.Series),
		asyncCheckOrMkdir(appPath, conf.Path.Karas),
		asyncCheckOrMkdir(appPath, conf.Path.Lyrics),
		asyncCheckOrMkdir(appPath, conf.Path.Inbox),
		asyncCheckOrMkdir(appPath, conf.Path.Temp),
		asyncCheckOrMkdir(appPath, conf.Path.Previews),
		asyncCheckOrMkdir(appPath, conf.Path.Avatars)
	]);

	if (argv.sql) setConfig({ optSql: true });

	await initDB();
	if (argv.generate) {
		await run();
		exit(0);
	}
	if (argv.createAdmin) await createUser({
		login: argv.createAdmin[0],
		password: argv.createAdmin[1]
	}, {admin: true});
	const port = await detect(+argv.port || conf.Frontend.Port);
	if (port !== conf.Frontend.Port) setConfig({
		Frontend: {
			Port: port
		}
	});
	logger.debug(`[Launcher] Port ${port} is available`);
	const inits = [];


	kmx = new KMExplorer({
		api: conf.KaraExplorer.Api,
		port: conf.KaraExplorer.Port,
		path: conf.KaraExplorer.Path,
	});
	kmx.start();

	// Clean temp periodically of files older than two hours
	setInterval(findRemoveSync.bind(this, resolve(conf.appPath, conf.Path.Temp), {age: {seconds: 7200}}), 2 * 60 * 60 * 1000);

	if (getConfig().Mail.Enabled) inits.push(initMailer());
	inits.push(initShortener());
	inits.push(initFrontend(port));
	inits.push(initFavorites());
	await Promise.all(inits);
	logger.info('[Launcher] Karaoke Mugen Server is READY');
}


function parseArgs() {
	const argv = process.argv.filter(e => e !== '--');
	function login(val: string) {
		return val.split(',');
	}
	return cli
		.command('kmserver.sh')
		.description('Starts Karaoke Mugen Server')
		.version(pjson.version)
		.option('--port [port]', 'specify which port to listen to', 'port')
		.option('--generate', 'generate karaoke database')
		.option('--sql', 'display SQL queries (in debug)')
		.option('--debug', 'display debug messages')
		.option('--createAdmin [user],[password]', 'Create a new admin user', login)
		.parse(argv);
}
