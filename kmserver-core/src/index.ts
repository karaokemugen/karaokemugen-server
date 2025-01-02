import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { program } from 'commander';
import detect from 'detect-port';
import dotenv from 'dotenv';
import findRemoveSync from 'find-remove';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import sourceMapSupport from 'source-map-support';
import sudoBlock from 'sudo-block';
import { register } from 'ts-node';
import logger from 'winston';

import { initDB } from './dao/database.js';
import { updateBanSession } from './dao/stats.js';
import { initFrontend } from './frontend.js';
import { buildKMExplorer } from './kmexplorer.js';
import { configureLocale, getConfig, resolvedPath } from './lib/utils/config.js';
import { asyncCheckOrMkdir } from './lib/utils/files.js';
import { createImagePreviews } from './lib/utils/previews.js';
import { initGitRepos } from './services/git.js';
import { generate, getAllKaras } from './services/kara.js';
import { promoteToken } from './services/remote.js';
import { initRepos } from './services/repo.js';
import { addSuggestionsFromFile } from './services/suggestions.js';
import { addRoleToUser, changePassword, createUser, initUsers, removeRoleFromUser } from './services/user.js';
import { initConfig } from './utils/config.js';
import { generateHardsubs, hardsubsDone, initHardsubGeneration } from './utils/hardsubs.js';
import { initMailer } from './utils/mailer.js';
import sentry from './utils/sentry.js';
import { getState, setState } from './utils/state.js';

sourceMapSupport.install();

const appPath = findWorkspaceRoot();
const dataPath = resolve(appPath, 'app/');
const resourcePath = resolve(appPath, 'kmserver-core/');

const acceptedLanguages = ['en', 'fr', 'es', 'id', 'de', 'pt', 'it', 'pl'];

const pjson = JSON.parse(readFileSync(resolve(appPath, 'kmserver-core/package.json'), 'utf-8'));

const service = 'Launcher';

dotenv.config({path: join(appPath, '.env')});
sentry.init();

process.on('uncaughtException', (exception) => {
	console.log(exception);
	sentry.error(exception);
});

process.on('unhandledRejection', (error: any) => {
	if (error?.message !== '[nuxt] instance unavailable') {
		console.log(error);
		sentry.error(new Error(JSON.stringify(error, null, 2)));
	}
});

process.once('SIGTERM', () => {
	logger.info('Received SIGTERM, terminating properly.', {service});
	exit(0);
});

process.once('SIGINT', () => {
	logger.info('Received SIGINT, terminating properly.', {service});
	exit(0);
});

export function exit(rc: number) {
	process.exit(rc || 0);
}

// Workaround for Nuxt store to work in production environments
register({
	transpileOnly: true,
	project: join(appPath, 'kmexplorer/tsconfig.json')
});

main().catch(err => {
	logger.error('Error during launch', {service, obj: err});
	process.exit(1);
});

async function main() {
	if (!process.env.ROOT_OVERRIDE && process.platform !== 'win32') sudoBlock('You should not run Karaoke Mugen Server with root permissions, it\'s dangerous.');
	const argv = parseArgs();
	setState({
		appPath,
		dataPath,
		resourcePath,
		originalAppPath: appPath,
		electron: false
	});
	await initConfig(argv.opts());
	initRepos();
	const conf = getConfig();
	console.log('--------------------------------------------------------------------');
	console.log(`Karaoke Mugen Server ${pjson.version}`);
	console.log('--------------------------------------------------------------------');
	console.log('\n');
	const paths = conf.System.Path;
	const checks = [
		asyncCheckOrMkdir(resolve(dataPath, paths.Dumps)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Import)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Temp)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Previews)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Avatars)),
		asyncCheckOrMkdir(resolve(dataPath, paths.Hardsubs))
	];
	for (const repo of conf.System.Repositories) {
		for (const p of Object.keys(repo.Path)) {
			repo.Path[p].forEach((dir: string) => checks.push(asyncCheckOrMkdir(resolve(dataPath, dir))));
		}
	}

	await Promise.all(checks);

	if (argv.opts().build) {
		await buildKMExplorer();
		exit(0);
	}

	if (argv.opts().sql) setState({ opt: {sql: true }});
	if (argv.opts().staticServe) setState({opt: {staticServe: true}});

	await initDB(getState().opt.sql);
	await initUsers();

	if (argv.opts().createPreviews) {
		const karas = await getAllKaras({ ignoreCollections: true }, undefined, true);
		await createImagePreviews(karas, 'full', 1280);
		exit(0);
	}

	if (argv.opts().generate) {
		await generate();
		exit(0);
	}

	if (argv.opts().processHardsubs) {
		await initHardsubGeneration(true);
		await generateHardsubs(await getAllKaras({}));
		await hardsubsDone();
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

	if (argv.opts().banSession) {
		await updateBanSession(argv.opts().banSession[0], true);
		exit(0);
	}

	if (argv.opts().unbanSession) {
		await updateBanSession(argv.opts().banSession[0], false);
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

	if (argv.opts().suggestionSource && argv.opts().importSuggestionsFrom) {
		await addSuggestionsFromFile(argv.opts().importSuggestionsFrom, argv.opts().suggestionSource);
		exit(0);
	}

	// Normal start here.

	const port = +argv.opts().port || conf.Frontend.Port;
	try {
		await detect(port);
	} catch (err) {
		logger.error(`Port ${port} is unavailable. Cannot start KM Server`);
		throw err;
	}
	logger.debug(`Port ${port} is available`, {service});

	// Clean temp periodically of files older than two hours
	setInterval(() => {
		findRemoveSync(resolvedPath('Temp'), {age: {seconds: 7200}});
	}, 2 * 60 * 60 * 1000);

	initGitRepos();
	if (conf.Mail.Enabled) initMailer();
	initFrontend(port);
	logger.info('Karaoke Mugen Server launched', {service});

	// Post launch stuff

	if (conf.Hardsub.Enabled) initHardsubGeneration();

	setState({ acceptedLanguages });
	configureLocale(acceptedLanguages);
	initRepos();
}

function parseArgs() {
	const argv = process.argv.filter(e => e !== '--');
	function login(val: string) {
		return val.split(',');
	}
	return program
		.command('kmserver.sh')
		.description('Starts Karaoke Mugen Server')
		.version(pjson.version)
		.option('--port [port]', 'specify which port to listen to', 'port')
		.option('--generate', 'generate karaoke database')
		.option('--processHardsubs', 'process any missing hardsubs')
		.option('--sql', 'display SQL queries (in debug)')
		.option('--debug', 'display debug messages')
		.option('--staticServe', 'serve static files via NodeJS')
		.option('--banSession', 'ban a session SEID')
		.option('--unbanSession', 'ban a session SEID')
		.option('--createPreviews', 'generate image previews')
		.option('--createAdmin [user],[password]', 'Create a new admin user', login)
		.option('--changePassword [user],[password]', 'Change a user password', login)
		.option('--addUserRole [user],[role]', 'Add role to user', login)
		.option('--removeUserRole [user],[role]', 'Remove role from user', login)
		.option('--promoteToken [token],[newcode]', 'Promote a remote token to a permanent one', login)
		.option('--build', 'Build KMExplorer (required in production environments)')
		.option('--importSuggestionsFrom [file]', 'Import suggestions from CSV file')
		.option('--suggestionSource [source]', 'Name the source of your inported sugggestion CSV file')
		.parse(argv);
}
