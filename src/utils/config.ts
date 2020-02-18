import {resolve} from 'path';
import {asyncRequired} from '../lib/utils/files';
import {exit} from '../';
import logger from '../lib/utils/logger';
import { getState, setState } from './state';
import {Config} from '../types/config';
import {BinariesConfig} from '../types/config';
import { setConfigConstraints, configureLocale, loadConfigFiles, getConfig, configureIDs } from '../lib/utils/config';
import { configConstraints, defaults } from './default_settings';
import { configureLogger } from '../lib/utils/logger';
import uuidV4 from 'uuid/v4';
import cloneDeep from 'lodash.clonedeep';

async function checkBinaries(config: Config): Promise<BinariesConfig> {

	const binariesPath = configuredBinariesForSystem(config);
	let requiredBinariesChecks = [];
	requiredBinariesChecks.push(asyncRequired(binariesPath.ffmpeg));

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
		};
	case 'darwin':
		return {
			ffmpeg: resolve(getState().appPath, config.System.Binaries.ffmpeg.OSX),
		};
	default:
		return {
			ffmpeg: resolve(getState().appPath, config.System.Binaries.ffmpeg.Linux)
		};
	}
}

function binMissing(binariesPath: any, err: string) {
	logger.error('[BinCheck] One or more binaries could not be found! (' + err + ')');
	logger.error('[BinCheck] Paths searched : ');
	logger.error('[BinCheck] ffmpeg : ' + binariesPath.ffmpeg);
	logger.error('[BinCheck] Exiting...');
	console.log('\n');
	console.log('One or more binaries needed by Karaoke Mugen could not be found.');
	console.log('Check the paths above and make sure these are available.');
	console.log('Edit your config.yml and set System.Binaries.ffmpeg correctly for your OS.');
	console.log('You can download ffmpeg for your OS from http://ffmpeg.org');
}

/** Initializing configuration */
export async function initConfig(argv: any) {
	const dataPath = getState().dataPath;
	setConfigConstraints(configConstraints);
	await configureLogger(dataPath, !!argv.debug, true);
	await configureLocale();
	await loadConfigFiles(dataPath, argv.config, defaults);
	const conf = getConfig();
	logger.debug('[Launcher] Checking if binaries are available');
	setState({binPath: await checkBinaries(conf)});
	if (conf.App.JwtSecret === 'Change me' || conf.App.InstanceID === 'Change me') {
		console.log('ERROR : Your InstanceID and/or JwtSecret are not set.');
		console.log('You MUST set a JwtSecret other than "Change me"');
		console.log('You MUST set an Instance ID as a UUID v4. Here is a generated one for you : ' + uuidV4());
		console.log('Set them in your config.yml file, see the sample provided for help.');
		console.log('Aborting...');
		exit(1);
	}
	configureIDs();
	return getConfig();
}

export function getPublicConfig() {
	const conf = cloneDeep(getConfig());
	delete conf.App;
	delete conf.Database;
	delete conf.System;
	delete conf.Gitlab;
	delete conf.Mail;
	return conf;
}