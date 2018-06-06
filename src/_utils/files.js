import {exists, readFile, readdir, rename, unlink, stat, writeFile} from 'fs';
import {remove, mkdirp, copy, move} from 'fs-extra';
import {promisify} from 'util';
import {resolve} from 'path';
import logger from 'winston';

/** Function used to verify a file exists with a Promise.*/
export function asyncExists(file) {
	return promisify(exists)(file);
}

/** Function used to read a file with a Promise */
export function asyncReadFile(...args) {
	return promisify(readFile)(...args);
}

export function asyncReadDir(...args) {
	return promisify(readdir)(...args);
}

export function asyncMkdirp(...args) {
	return promisify(mkdirp)(...args);
}

export function asyncRemove(...args) {
	return promisify(remove)(...args);
}

export function asyncRename(...args) {
	return promisify(rename)(...args);
}

export function asyncUnlink(...args) {
	return promisify(unlink)(...args);
}

export function asyncCopy(...args) {
	return promisify(copy)(...args);
}

export function asyncStat(...args) {
	return promisify(stat)(...args);
}

export function asyncWriteFile(...args) {
	return promisify(writeFile)(...args);
}

export function asyncMove(...args) {
	return promisify(move)(...args);
}

/** Function used to verify if a required file exists. It throws an exception if not. */
export async function asyncRequired(file) {
	if (!await asyncExists(file)) throw 'File \'' + file + '\' does not exist';
}

export async function asyncCheckOrMkdir(...dir) {
	const resolvedDir = resolve(...dir);
	if (!await asyncExists(resolvedDir)) {
		if (logger) logger.debug('[Launcher] Creating folder ' + resolvedDir);
		return await asyncMkdirp(resolvedDir);
	}
}

