import {resolve} from 'path';
import {asyncRequired} from '../lib/utils/files';
import {exit} from '../';
import logger from 'winston';
import { getState } from './state';
import {Config} from '../types/config';
import {BinariesConfig} from '../types/config';
import { setConfigConstraints, configureLocale, loadConfigFiles, getConfig } from '../lib/utils/config';
import { configConstraints, defaults } from './default_settings';
import { configureLogger } from '../lib/utils/logger';

export async function checkBinaries(config: Config): Promise<BinariesConfig> {

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
	let appPath = getState().appPath;
	setConfigConstraints(configConstraints);
	await configureLogger(appPath, !!argv.debug, true);
	await configureLocale();
	await loadConfigFiles(appPath, argv.config, defaults);
	return getConfig();
}
