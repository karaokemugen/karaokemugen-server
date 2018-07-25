/** Centralized configuration management for Karaoke Mugen. */

import {resolve} from 'path';
import {safeLoad, safeDump} from 'js-yaml';
import osLocale from 'os-locale';
import i18n from 'i18n';
import logger from 'winston';
import uuidV4 from 'uuid/v4';
import {check} from './validators';
import {asyncWriteFile, asyncExists, asyncReadFile, asyncRequired} from './files';
import {configConstraints, defaults} from './default_settings.js';
import {configureLogger} from './logger';
import merge from 'lodash.merge';

/** Object containing all config */
let config = {};
let configFile = 'config.yml';
let savingSettings = false;
/**
 * We return a copy of the configuration data so the original one can't be modified
 * without passing by this module's functions.
 */
export function getConfig() {
	return {...config};
}

export function sanitizeConfig(conf) {
	for (const setting of Object.keys(conf)) {
		if (/^\+?(0|[1-9]\d*)$/.test(conf[setting])) {
			conf[setting] = parseInt(conf[setting], 10);
		}
	}
	return conf;
}

export function profile(func) {
	if (config.optProfiling) logger.profile(func);
}

export function verifyConfig(conf) {
	const validationErrors = check(conf, configConstraints);
	if (validationErrors) {
		throw `Config is not valid: ${JSON.stringify(validationErrors)}`;
	}
}

export async function mergeConfig(oldConfig, newConfig) {
	return setConfig(newConfig);
}

/** Initializing configuration */
export async function initConfig(appPath, argv) {
	if (argv.config) configFile = argv.config;
	configureLogger(appPath, !!argv.debug);

	config = {...config, appPath: appPath};
	config = {...config, os: process.platform};
	config = {...config, locale: osLocale.sync().substring(0, 2)};
	await loadConfigFiles(appPath);
	if (config.JwtSecret === 'Change me') setConfig( {JwtSecret: uuidV4() });
	configureLocale();
	return getConfig();
}

function configureLocale() {
	i18n.configure({
		directory: resolve(__dirname, '../_locales'),
		defaultLocale: 'en',
		cookie: 'locale',
		register: global
	});
	const detectedLocale = osLocale.sync().substring(0, 2);
	i18n.setLocale(detectedLocale);
	config = {...config, EngineDefaultLocale: detectedLocale };
}

async function loadConfigFiles(appPath) {
	const overrideConfigFile = resolve(appPath, configFile);
	config = {...config, ...defaults};
	config.appPath = appPath;
	if (await asyncExists(overrideConfigFile)) await loadConfig(overrideConfigFile);
}

async function loadConfig(configFile) {
	logger.debug(`[Config] Reading configuration file ${configFile}`);
	await asyncRequired(configFile);
	const content = await asyncReadFile(configFile, 'utf-8');
	const parsedContent = safeLoad(content);
	const newConfig = merge(config, parsedContent);
	try {
		verifyConfig(newConfig);
		config = merge(config, newConfig);
		//logger.debug('[Config] New configuration : '+JSON.stringify(config,null,2));
	} catch(err) {
		throw err;
	}
}

export async function setConfig(configPart) {
	config = {...config, ...configPart};
	updateConfig(config);
	return getConfig();
}

export async function updateConfig(newConfig) {
	if (savingSettings) return false;
	savingSettings = true;
	const forbiddenConfigPrefix = ['os','locale','appPath'];
	const filteredConfig = {};
	Object.entries(newConfig).forEach(([k, v]) => {
		forbiddenConfigPrefix.every(prefix => !k.startsWith(prefix))
			&& (newConfig[k] !== defaults[k])
            && (filteredConfig[k] = v);
	});
	logger.debug('[Config] Settings being saved : '+JSON.stringify(filteredConfig));
	await asyncWriteFile(resolve(config.appPath, configFile), safeDump(filteredConfig), 'utf-8');
	savingSettings = false;
}

