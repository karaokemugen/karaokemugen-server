import {createWriteStream, exists, readFile, readdir, rename, unlink, stat, writeFile} from 'fs';
import {remove, mkdirp, copy, move} from 'fs-extra';
import {promisify} from 'util';
import {resolve} from 'path';
import {mediaFileRegexp} from '../services/constants';
import {createHash, HexBase64Latin1Encoding} from 'crypto';
import sanitizeFilename from 'sanitize-filename';
import deburr from 'lodash.deburr';
import { Stream } from 'stream';
import fileType = require('file-type');
import readChunk from 'read-chunk';

export function sanitizeFile(file: string): string {
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
		.replace(/\?\?/,' question_mark 2')
		.replace(/\?/,' question_mark ')
		.replace(/^\./,'')
		.replace(/♭/,' Flat ')
		.replace(replaceRegExp, input => {
			return replaceMap[input];
		})
	;
	// Remove all diacritics and other non-ascii characters we might have left
	// Also, remove useless spaces.
	file = deburr(file)
		.replace(/[^\x00-\xFF]/g, ' ' )
		.replace(/ [ ]+/g,' ')
	;
	// One last go using sanitizeFilename just in case.
	file = sanitizeFilename(file);
	return file;
}

const passThroughFunction = (fn: any, args: any) => {
	if(!Array.isArray(args)) args = [args];
	return promisify(fn)(...args);
};

export const asyncExists = (file: string) => passThroughFunction(exists, file);
export const asyncReadFile = (...args: any) => passThroughFunction(readFile, args);
export const asyncReadDir = (...args: any) => passThroughFunction(readdir, args);
export const asyncMkdirp = (...args: any) => passThroughFunction(mkdirp, args);
export const asyncRemove = (...args: any) => passThroughFunction(remove, args);
export const asyncRename = (...args: any) => passThroughFunction(rename, args);
export const asyncUnlink = (...args: any) => passThroughFunction(unlink, args);
export const asyncCopy = (...args: any) => passThroughFunction(copy, args);
export const asyncStat = (...args: any) => passThroughFunction(stat, args);
export const asyncWriteFile = (...args: any) => passThroughFunction(writeFile, args);
export const asyncMove = (...args: any) => passThroughFunction(move, args);

export const isMediaFile = (fileName: string) => new RegExp(mediaFileRegexp).test(fileName);

const filterValidFiles = (files: string[]) => files.filter(file => !file.startsWith('.') && isMediaFile(file));
export const filterMedias = (files: string[]) => filterValidFiles(files);
export const filterImages = (files: string[]) => filterValidFiles(files);

export const checksum = (str: string, algorithm = 'md5', encoding: HexBase64Latin1Encoding = 'hex') => createHash(algorithm)
	.update(str, 'utf8')
	.digest(encoding);

/** Function used to verify if a required file exists. It throws an exception if not. */
export async function asyncRequired(file: string) {
	if (!await asyncExists(file)) throw `File "${file}" does not exist`;
}

export async function asyncCheckOrMkdir(...dir: string[]) {
	const resolvedDir = resolve(...dir);
	if (!await asyncExists(resolvedDir)) return await asyncMkdirp(resolvedDir);
}


/** Replacing extension in filename */
export function replaceExt(filename: string, newExt: string): string {
	return filename.replace(/\.[^.]+$/, newExt);
}

export function writeStreamToFile(stream: Stream, filePath: string) {
	return new Promise((resolve, reject) => {
		const file = createWriteStream(filePath);
		stream.pipe(file);
		stream.on('end', () => resolve());
		stream.on('error', (err: string) => reject(err));
	});
}

export async function detectFileType(file: string): Promise<string> {
	const buffer = await readChunk(file, 0, 4100);
	const detected = fileType(buffer);
	if (!detected) throw `Unable to detect filetype of ${file}`;
	return detected.ext;
}

export async function asyncReadDirFilter(dir: string, ext: string) {
	const dirListing = await asyncReadDir(dir);
	return dirListing.filter((file: string) => file.endsWith(ext) && !file.startsWith('.')).map((file: string) => resolve(dir, file));
}
