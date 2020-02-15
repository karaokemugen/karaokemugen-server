import {getConfig, setConfig} from './lib/utils/config';
import {initConfig} from './utils/config';
import logger from 'winston';
import {resolve, join} from 'path';
import {initFrontend} from './frontend';
import cli from 'commander';
import detect from 'detect-port';
import {initDB} from './dao/database';
import {initShortener} from './services/shortener';
import {initFavorites} from './services/favorites';
import {createUser, changePassword} from './services/user';
import {generateDatabase} from './lib/services/generation';
import sudoBlock from 'sudo-block';
import {asyncCheckOrMkdir} from './lib/utils/files';
import {kmExplorerStart} from './services/kmExplorer';
import findRemoveSync from 'find-remove';
import { setState, getState } from './utils/state';
import { createImagePreviews } from './lib/utils/previews';
import { getAllKaras } from './services/kara';
import { initMailer } from './utils/mailer';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');
const dataPath = resolve(appPath, 'app/');

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

export function exit(rc: number) {
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
	setState({appPath: appPath, dataPath: dataPath});
	await initConfig(argv);
	const conf = getConfig();
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');
	const paths = conf.System.Path;
	const checks = [
		asyncCheckOrMkdir(resolve(dataPath, paths.Import)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Temp)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Previews)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Avatars))
	];
	for (const repo of conf.System.Repositories) {
		for (const paths of Object.keys(repo.Path)) {
			repo.Path[paths].forEach((dir: string) => checks.push(asyncCheckOrMkdir(resolve(dataPath, dir))));
		}
	}

	await Promise.all(checks);

	if (argv.sql) setState({ opt: {sql: true }});

	await initDB(getState().opt.sql);

	if (argv.staticServe) setState({opt: {staticServe: true}});

	if (argv.createPreviews) {
		const karas = await getAllKaras();
		await createImagePreviews(karas);
		exit(0);
	}

	if (argv.generate) {
		await generateDatabase();
		exit(0);
	}

	if (argv.createAdmin) {
		await createUser({
			login: argv.createAdmin[0],
			password: argv.createAdmin[1]
		}, {admin: true});
		exit(0);
	}

	if (argv.changePassword) {
		await changePassword(argv.changePassword[0], argv.changePassword[1]);
		exit(0);
	}

	const port = await detect(+argv.port || conf.Frontend.Port);

	if (port !== conf.Frontend.Port) setConfig({
		Frontend: {
			Port: port
		}
	});

	logger.debug(`[Launcher] Port ${port} is available`);
	const inits = [];

	kmExplorerStart({
		api: `${conf.API.Secure ? 'https://' : 'http://'}${conf.API.Host}${conf.API.Port ? ':' + conf.API.Port : ''}`,
		port: conf.KaraExplorer.Port,
		path: conf.KaraExplorer.Path,
	});

	// Clean temp periodically of files older than two hours
	setInterval(findRemoveSync.bind(this, resolve(dataPath, conf.System.Path.Temp), {age: {seconds: 7200}}), 2 * 60 * 60 * 1000);

	inits.push(initShortener());
	inits.push(initFrontend(port));
	inits.push(initFavorites());
	if (conf.Mail.Enabled) initMailer();
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
		.option('--staticServe', 'serve static files via NodeJS')
		.option('--createPreviews', 'generate image previews')
		.option('--createAdmin [user],[password]', 'Create a new admin user', login)
		.option('--changePassword [user],[password]', 'Change a user password', login)
		.parse(argv);
}
