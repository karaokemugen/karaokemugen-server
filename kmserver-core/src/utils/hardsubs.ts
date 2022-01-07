import { createHash } from 'crypto';
import { promise as fastq } from 'fastq';
import { promises as fs } from 'fs';
import { extname, resolve } from 'path';
import { KaraList } from '../lib/types/kara';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import { createHardsub } from '../lib/utils/ffmpeg';
import { asyncExists, resolveFileInDirs } from '../lib/utils/files';
import logger, { profile } from '../lib/utils/logger';
import { getState } from './state';

let queue = null;

export async function initHardsubGeneration() {
	queue = fastq<never, [string, string, string, string], void>(wrappedGenerateHS, 1);
}

async function wrappedGenerateHS(payload: [string, string, string, string]) {
	const [mediaPath, subPath, outputFile, kid] = payload;
	logger.info(`Creating hardsub for ${mediaPath}`, {service: 'Hardsubs'});
	if (await asyncExists(outputFile)) return;
	const assPath = subPath ? `${kid}.ass` : null;
	if (assPath) await fs.copyFile(payload[1], assPath);
	try {
		await createHardsub(mediaPath, assPath, outputFile);
		logger.info(`${queue.length()} hardsubs left in queue`, {service: 'Hardsubs'});
	} catch(err) {
		logger.error(`Error creating hardsub for ${mediaPath} : ${err}`, {service: 'Hardsubs', obj: err});
		throw err;
	} finally {
		if (assPath) await fs.unlink(assPath);
	}
}

export async function generateHardsubs(karas: KaraList) {
	logger.info('Generate subchecksums', {service: 'Hardsubs'});
	interface HardsubInfo {
		kid: string,
		mediafile: string,
		mediasize: number,
		subfile: string,
		repository: string,
		subchecksum: string
	}
	const mediaMap = new Map<string, HardsubInfo>();
	const mediaWithInfosSet = new Set();
	for (const k of karas.content) {
		mediaMap.set(k.kid, {
			kid: k.kid,
			mediafile: k.mediafile,
			mediasize: k.mediasize,
			subfile: k.subfile,
			repository: k.repository,
			subchecksum: null,
		});
	}
	for (const media of mediaMap.values()) {
		try {
			const subfile = await resolveFileInDirs(media.subfile || 'no_ass.txt', resolvedPathRepos('Lyrics', media.repository));
			media.subchecksum = await generateSubchecksum(subfile[0]);
		} catch(err) {
			media.subchecksum = 'no_ass_file';
		}
		const ext = extname(media.mediafile);

		mediaWithInfosSet.add(media.mediafile.replace(ext, `.${media.mediasize}.${media.subchecksum}.mp4`));
	}
	logger.info('Generated subchecksums', {service: 'Hardsubs'});
	const hardsubDir = resolve(getState().dataPath, getConfig().System.Path.Hardsubs);
	const hardsubFiles = await fs.readdir(hardsubDir);
	const hardsubSet = new Set<string>(hardsubFiles);
	// Remove unused previewFiles
	profile('removeHardsubs');
	hardsubFiles.forEach((file: string) => {
		const fileParts = file.split('.');
		if (mediaMap.has(fileParts[0])) {
			// Compare mediasizes. If mediasize or subchecksum are different, remove file
			if (mediaMap.get(fileParts[0]).mediasize !== +fileParts[1] || mediaMap.get(fileParts[0]).subchecksum !== fileParts[2]) {
				fs.unlink(resolve(hardsubDir, file));
				logger.info(`Removing ${file}`, {service: 'Hardsubs'});
			}
		}
	});
	profile('removeHardsubs');
	profile('createHardsubs');
	for (const media of mediaMap.values()) {
		try {
			const hardsubFile = `${media.kid}.${media.mediasize}.${media.subchecksum}.mp4`;
			if (!hardsubSet.has(hardsubFile)) {
				const mediaPath = (await resolveFileInDirs(media.mediafile, resolvedPathRepos('Medias', media.repository)))[0];
				let subPath = null;
				if (media.subfile) {
					subPath = (await resolveFileInDirs(media.subfile, resolvedPathRepos('Lyrics', media.repository)))[0];
				}
				const outputFile = resolve(hardsubDir, hardsubFile);
				queue.push([mediaPath, subPath, outputFile, media.kid]);
			}
		} catch (error) {
			logger.error(`Error when creating hardsub for ${media.mediafile}: ${error}`, {service: 'Hardsubs'});
		}
	}
	profile('createHardsubs');

}

async function generateSubchecksum(path: string) {
	let ass = await fs.readFile(path, {encoding: 'utf-8'}).catch(reason => {
		if (reason.code === 'ENOENT') {
			return 'no_ass_file';
		} else {
			throw reason;
		}
	});
	if (ass === 'no_ass_file') {
		return ass;
	} else {
		ass = ass.replace(/\r/g, '');
		return createHash('md5').update(ass, 'utf-8').digest('hex');
	}
}