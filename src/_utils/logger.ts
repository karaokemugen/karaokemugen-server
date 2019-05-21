import logger from 'winston';
import dailyRotateFile from  'winston-daily-rotate-file';
import {asyncCheckOrMkdir} from './files';
import {resolve} from 'path';
import {getConfig} from './config';

export async function configureLogger(appPath: string, debug: boolean) {
	const consoleLogLevel = debug ? 'debug' : 'info';
	const logDir = resolve(appPath, 'logs');
	await asyncCheckOrMkdir(logDir);
	logger.add(
		new logger.transports.Console({
			level: consoleLogLevel,
			format: logger.format.combine(
				logger.format.colorize(),
				logger.format.printf(info => {
					let duration = '';
					if (info.durationMs) duration = `duration: ${info.durationMs} ms`;
					return `${new Date()} - ${info.level}: ${info.message} ${duration}`;
				})
			)
		})
	);
	logger.add(
		new dailyRotateFile({
			filename: 'karaokemugen-%DATE%.log',
			dirname: logDir,
			zippedArchive: true,
			level: 'debug',
			handleExceptions: true,
			format: logger.format.combine(
				logger.format.printf(info => {
					let duration = '';
					if (info.durationMs) duration = `duration: ${info.durationMs} ms`;
					return `${new Date()} - ${info.level}: ${info.message} ${duration}`;
				})
			)
		})
	);
}

export function profile(func: string) {
	if (getConfig().optProfiling) logger.profile(`[Profiling] ${func}`);
}