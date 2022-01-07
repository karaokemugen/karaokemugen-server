import {getConfig, setConfig} from './lib/utils/config';
import {initConfig} from './utils/config';
import logger from 'winston';
import {resolve, join} from 'path';
import {initFrontend} from './frontend';
import cli from 'commander';
import detect from 'detect-port';
import {initDB} from './dao/database';
import {createUser, changePassword, initUsers, addRoleToUser, removeRoleFromUser} from './services/user';
import sudoBlock from 'sudo-block';
import {asyncCheckOrMkdir} from './lib/utils/files';
import findRemoveSync from 'find-remove';
import { setState, getState } from './utils/state';
import { createImagePreviews } from './lib/utils/previews';
import { getAllKaras, generate } from './services/kara';
import { initMailer } from './utils/mailer';
import dotenv from 'dotenv';
import sentry from './utils/sentry';
import {buildKMExplorer} from './services/kmexplorer';
import pjson from '../../package.json';
import { promoteToken } from './dao/remote';
import { initGitRepos } from './services/git';
import { register } from 'ts-node';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import { initHardsubGeneration } from './utils/hardsubs';

const appPath = findWorkspaceRoot();
const dataPath = resolve(appPath, 'app/');
const resourcePath = appPath;

dotenv.config({path: join(appPath, '.env')});
sentry.init();

process.on('uncaughtException', (exception) => {
	console.log(exception);
	sentry.error(exception);
});

process.on('unhandledRejection', (error) => {
	console.log(error);
	sentry.error(new Error(JSON.stringify(error, null, 2)));
});

process.once('SIGTERM', () => {
	logger.info('Received SIGTERM, terminating properly.', {service: 'Launcher'});
	exit(0);
});

process.once('SIGINT', () => {
	logger.info('Received SIGINT, terminating properly.', {service: 'Launcher'});
	exit(0);
});

export function exit(rc: number) {
	process.exit(rc || 0);
}

if (process.env.NODE_ENV === 'production') {
	// Workaround for Nuxt store to work in production environments
	register({
		transpileOnly: true,
		project: join(appPath, 'kmexplorer/tsconfig.json')
	});
}

main().catch(err => {
	logger.error('Error during launch', {service: 'Launcher', obj: err});
	process.exit(1);
});

async function main() {
	if (!process.env.ROOT_OVERRIDE && process.platform !== 'win32') sudoBlock('You should not run Karaoke Mugen Server with root permissions, it\'s dangerous.');
	const argv = parseArgs();
	setState({
		appPath: appPath,
		dataPath: dataPath,
		resourcePath: resourcePath,
		originalAppPath: appPath,
		electron: false
	});
	await initConfig(argv.opts());
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

	if (argv.opts().build) {
		await buildKMExplorer();
		exit(0);
	}

	if (argv.opts().sql) setState({ opt: {sql: true }});

	await initDB(getState().opt.sql);

	if (argv.opts().staticServe) setState({opt: {staticServe: true}});

	await initUsers();

	if (conf.Hardsub.Enabled) initHardsubGeneration();

	if (argv.opts().createPreviews) {
		const karas = await getAllKaras({});
		await createImagePreviews(karas, 'full', 1280);
		exit(0);
	}

	if (argv.opts().generate) {
		await generate();
		exit(0);
	}

	if (argv.opts().addUserRole) {
		await addRoleToUser(argv.opts().addUserRole[0], argv.opts().addUserRole[1]);
		exit(0);
	}

	if (argv.opts().removeUserRole) {
		await removeRoleFromUser(argv.opts().removeUserRole[0], argv.opts().removeUserRole[1]);
		exit(0);
	}

	if (argv.opts().createAdmin) {
		await createUser({
			login: argv.opts().createAdmin[0],
			password: argv.opts().createAdmin[1]
		}, {admin: true});
		exit(0);
	}

	if (argv.opts().changePassword) {
		await changePassword(argv.opts().changePassword[0], argv.opts().changePassword[1]);
		exit(0);
	}

	if (argv.opts().promoteToken) {
		await promoteToken(argv.opts().promoteToken[0], argv.opts().promoteToken[1]);
		logger.info('Token was promoted to permanent token. Restart the app to see changes.', {service: 'Remote'});
		exit(0);
	}


	const port = await detect(+argv.opts().port || conf.Frontend.Port);

	if (port !== conf.Frontend.Port) setConfig({
		Frontend: {
			Port: port
		}
	});

	logger.debug(`Port ${port} is available`, {service: 'Launcher'});
	const inits = [];

	// Clean temp periodically of files older than two hours
	setInterval(findRemoveSync.bind(this, resolve(dataPath, conf.System.Path.Temp), {age: {seconds: 7200}}), 2 * 60 * 60 * 1000);

	inits.push(initFrontend(port));
	initGitRepos();
	if (conf.Mail.Enabled) initMailer();
	await Promise.all(inits);
	logger.info('Karaoke Mugen Server is READY', {service: 'Launcher'});
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
		.option('--addUserRole [user],[role]', 'Add role to user', login)
		.option('--removeUserRole [user],[role]', 'Remove role from user', login)
		.option('--promoteToken [token],[newcode]', 'Promote a remote token to a permanent one', login)
		.option('--build', 'Build KMExplorer (required in production environments)')
		.parse(argv);
}
