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
import {createUser} from './services/user';
import {generateDatabase} from './lib/services/generation';
import sudoBlock from 'sudo-block';
import {asyncCheckOrMkdir} from './lib/utils/files';
import {kmExplorerStart} from './services/kmExplorer';
import findRemoveSync from 'find-remove';
import { setState, getState } from './utils/state';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');

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
	setState({appPath: appPath});
	await initConfig(argv);
	const conf = getConfig();
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');
	const paths = conf.System.Path;
	const checks = [
		asyncCheckOrMkdir(appPath, paths.Import),
		asyncCheckOrMkdir(appPath, paths.Temp),
		asyncCheckOrMkdir(appPath, paths.Previews),
		asyncCheckOrMkdir(appPath, paths.Avatars)
	];
	paths.Medias.forEach(e => checks.push(asyncCheckOrMkdir(appPath, e)));
	paths.Karas.forEach(e => checks.push(asyncCheckOrMkdir(appPath, e)));
	paths.Series.forEach(e => checks.push(asyncCheckOrMkdir(appPath, e)));
	paths.Lyrics.forEach(e => checks.push(asyncCheckOrMkdir(appPath, e)));

	await Promise.all(checks);

	if (argv.sql) setState({ opt: {sql: true }});

	await initDB(getState().opt.sql);

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

	const port = await detect(+argv.port || conf.Frontend.Port);

	if (port !== conf.Frontend.Port) setConfig({
		Frontend: {
			Port: port
		}
	});

	logger.debug(`[Launcher] Port ${port} is available`);
	const inits = [];

	kmExplorerStart({
		api: conf.KaraExplorer.Api,
		port: conf.KaraExplorer.Port,
		path: conf.KaraExplorer.Path,
	});

	// Clean temp periodically of files older than two hours
	setInterval(findRemoveSync.bind(this, resolve(appPath, conf.System.Path.Temp), {age: {seconds: 7200}}), 2 * 60 * 60 * 1000);

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
