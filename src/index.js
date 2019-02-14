import {getConfig, initConfig, setConfig} from './_utils/config';
import logger from 'winston';
import {join} from 'path';
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
import KaraExplorer from './karaExplorer';

const pjson = require('../package.json');
const appPath = join(__dirname,'../');

process.on('uncaughtException', (exception) => {
	console.log(exception);
});

main().catch(err => {
	logger.error(`[Launcher] Error during launch : ${JSON.stringify(err)}`);
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

	await initDB();
	if (argv.generate) {
		await run();
		exit();
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

	var kmx = new KaraExplorer({
		api:'http://'+conf.Frontend.Host+(conf.Frontend.Port != 80 ? ':'+conf.Frontend.Port:''),
		port:conf.KaraExplorer.Port,
		path:conf.KaraExplorer.Path,
	});
	kmx.start();

	if (getConfig().Mail.Enabled) inits.push(initMailer());
	inits.push(initShortener());
	inits.push(initFrontend(port));
	inits.push(initFavorites());
//	inits.push();
	await Promise.all(inits);
	logger.info('[Launcher] Karaoke Mugen Server is READY');
}

function exit(rc) {
	process.exit(rc || 0);
}

function parseArgs() {
	const argv = process.argv.filter(e => e !== '--');
	function login(val) {
		return val.split(',');
	}
	return cli
		.command('kmserver.sh')
		.description('Starts Karaoke Mugen Server')
		.version(pjson.version)
		.option('--port [port]', 'specify which port to listen to', 'port')
		.option('--generate', 'generate karaoke database')
		.option('--createAdmin [user],[password]', 'Create a new admin user', login)
		.parse(argv);
}



