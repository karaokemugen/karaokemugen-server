import {exists, readFile, readdir, rename, unlink, stat, writeFile} from 'fs';
import {remove, mkdirp, copy, move} from 'fs-extra';
import {promisify} from 'util';
import {resolve} from 'path';
import logger from 'winston';
import deburr from 'lodash.deburr';
import sanitizeFilename from 'sanitize-filename';
import {mediaFileRegexp} from '../_services/constants';
import {createHash} from 'crypto';
import fileType from 'file-type';
import readChunk from 'read-chunk';

/** Function used to verify a file exists with a Promise.*/
export function asyncExists(file) {
	return promisify(exists)(file);
}

export function replaceExt(filename, newExt) {
	return filename.replace(/\.[^.]+$/, newExt);
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

export function sanitizeFile(file) {
	const replaceMap = {
		'·': '.',
		'・': '.',
		'Λ': 'A',
		'Я': 'R',
		'³': '3',
		'²': '2',
		'°': '0',
		'θ': '0',
		'Ø': '0',
		'○': 'O',
		'×': 'x',
		'Φ': 'O',
		'±': '+',
		'∀': 'A'
	};
	const replaceRegExp = new RegExp('[' + Object.keys(replaceMap).join('') + ']', 'ig');
	// Romanizing japanese characters by their romanization
	// Also making some obvious replacements of things we often find in japanese names.
	file = file.replace(/ô/g,'ou')
		.replace(/Ô/g,'Ou')
		.replace(/û/g,'uu')
		.replace(/µ's/g,'Mu\'s')
		.replace(/®/g,'(R)')
		.replace(/∆/g,'Delta')
		.replace(/;/g,' ')
		.replace(/\[/g,' ')
		.replace(/\]/g,' ')
		.replace(/[△:\/☆★†↑½♪＊*∞♥❤♡⇄♬]/g, ' ')
		.replace(/…/,'...')
		.replace(/\+/,' Plus ')
		.replace(/^\./,'')
		.replace(/\?/,' question_mark ')
		.replace(/♭/,' Flat ')
		.replace(replaceRegExp, input => {
			return replaceMap[input];
		})
	;
	// Remove all diacritics and other non-ascii characters we might have left
	// Also, remove useless spaces.
	file = deburr(file)
		.replace(/[^\x00-\xFF]/g, ' ' )
		.replace(/ [ ]+/,' ')
	;
	// One last go using sanitizeFilename just in case.
	file = sanitizeFilename(file);
	return file;
}

export function isMediaFile(filename) {
	return new RegExp(mediaFileRegexp).test(filename);
}

export function checksum(str, algorithm, encoding) {
	return createHash(algorithm || 'md5')
		.update(str, 'utf8')
		.digest(encoding || 'hex');
}

export async function detectFileType(file) {
	const buffer = await readChunk(file, 0, 4100);
	const detected = fileType(buffer);
	return detected.ext;
}
