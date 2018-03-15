import logger from 'winston';
require('winston-daily-rotate-file');
import {resolve} from 'path';

export function initConfig(appPath, argv) {
	configureLogger(appPath, argv.debug);
}

function configureLogger(appPath, debug) {
	const tsFormat = () => (new Date()).toLocaleTimeString();
	const consoleLogLevel = debug ? 'debug' : 'info';

	logger.configure({
		transports: [
			new (logger.transports.Console)({
				timestamp: tsFormat,
				level: consoleLogLevel,
				colorize: true
			}),
			new (logger.transports.DailyRotateFile)({
				timestap: tsFormat,
				filename: resolve(appPath, 'karaokemugen-server'),
				datePattern: '.yyyy-MM-dd.log',
				zippedArchive: true,
				level: 'debug',
				handleExceptions: true
			})
		]
	});
}
