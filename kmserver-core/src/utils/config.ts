import { cloneDeep } from 'lodash';
import {resolve} from 'path';
import { v4 as uuidV4 } from 'uuid';

import {exit} from '../index.js';
import { configureIDs, configureLocale, getConfig, loadConfigFiles, setConfigConstraints } from '../lib/utils/config.js';
import {fileRequired} from '../lib/utils/files.js';
import logger, { configureLogger } from '../lib/utils/logger.js';
import {emit} from '../lib/utils/pubsub.js';
import {BinariesConfig, Config} from '../types/config.js';
import { configConstraints, defaults } from './defaultSettings.js';
import { getState, setState } from './state.js';

const service = 'Config';

async function checkBinaries(config: Config): Promise<BinariesConfig> {
	const binariesPath = configuredBinariesForSystem(config);
	const requiredBinariesChecks = [];
	requiredBinariesChecks.push(fileRequired(binariesPath.ffmpeg));
	requiredBinariesChecks.push(fileRequired(binariesPath.git));

	try {
		await Promise.all(requiredBinariesChecks);
	} catch (err) {
		binMissing(binariesPath, err);
		exit(1);
	}

	return binariesPath;
}

function configuredBinariesForSystem(config: Config): BinariesConfig {
	switch (process.platform) {
	case 'win32':
		return {
			ffmpeg: resolve(getState().appPath, config.System.Binaries.ffmpeg.Windows),
			git: resolve(getState().appPath, config.System.Binaries.git.Windows)
		};
	case 'darwin':
		return {
			ffmpeg: resolve(getState().appPath, config.System.Binaries.ffmpeg.OSX),
			git: resolve(getState().appPath, config.System.Binaries.git.OSX),
		};
	default:
		return {
			ffmpeg: resolve(getState().appPath, config.System.Binaries.ffmpeg.Linux),
			git: resolve(getState().appPath, config.System.Binaries.git.Linux)
		};
	}
}

function binMissing(binariesPath: any, err: string) {
	logger.error('One or more binaries could not be found!', {service, obj: err});
	logger.error('Paths searched:', {service});
	logger.error(`ffmpeg: ${binariesPath.ffmpeg}`, {service});
	logger.error(`git: ${binariesPath.git}`, {service});
	logger.error('Exiting...', {service});
	console.log('\n');
	console.log('One or more binaries needed by Karaoke Mugen could not be found.');
	console.log('Check the paths above and make sure these are available.');
	console.log('Edit your config.yml and set System.Binaries.ffmpeg correctly for your OS.');
	console.log('You can download ffmpeg for your OS from http://ffmpeg.org');
}

export function resolvedPathRemoteRoot() {
	return resolve(getState().dataPath, getConfig().Remote.FrontendRoot);
}

/** Initializing configuration */
export async function initConfig(argv: any) {
	const dataPath = getState().dataPath;
	setConfigConstraints(configConstraints);
	await configureLogger(!!argv.debug || !!process.env.DEBUG, true);
	await configureLocale();
	await loadConfigFiles(dataPath, argv.config, defaults, getState().appPath);
	const conf = getConfig();
	logger.debug('Checking if binaries are available', {service});
	setState({binPath: await checkBinaries(conf)});
	if (conf.App.JwtSecret === 'Change me' || conf.App.InstanceID === 'Change me') {
		console.log('ERROR : Your InstanceID and/or JwtSecret are not set.');
		console.log('You MUST set a JwtSecret other than "Change me"');
		console.log(`You MUST set an Instance ID as a UUID v4. Here is a generated one for you : ${uuidV4()}`);
		console.log('Set them in your config.yml file, see the sample provided for help.');
		console.log('Aborting...');
		exit(1);
	}
	configureIDs();
	emit('configReady');
	return getConfig();
}

export function getPublicConfig(_?: boolean, __?: boolean) {
	const conf = cloneDeep(getConfig());
	delete conf.System;
	delete conf.App;
	delete conf.Gitlab.IssueTemplate;
	delete conf.Mail;
	return conf;
}
