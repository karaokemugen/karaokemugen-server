import { createHash } from 'crypto';
import { promise as fastq } from 'fastq';
import { promises as fs } from 'fs';
import { extname, resolve } from 'path';

import { KaraList } from '../lib/types/kara.js';
import { getConfig, resolvedPathRepos } from '../lib/utils/config.js';
import { createHardsub } from '../lib/utils/ffmpeg.js';
import { fileExists, resolveFileInDirs } from '../lib/utils/files.js';
import logger, { profile } from '../lib/utils/logger.js';
import { emit, once } from '../lib/utils/pubsub.js';
import { generateHardsubsCache, getAllKaras } from '../services/kara.js';
import { getState } from './state.js';

const service = 'Hardsubs';

let queue = null;

const hardsubsBeingProcessed = new Set();

export function getHardsubsBeingProcessed() {
	return [...hardsubsBeingProcessed] as string[];
}

export function hardsubsDone() {
	return new Promise<void>((done) => {
		once('hardsubsQueueDrained', () => {
			done();
		}).setMaxListeners(30);
	});
}

export async function initHardsubGeneration(drainEvent = false) {
	queue = fastq<never, [string, string, string, string, string, string], void>(wrappedGenerateHS, 1);
	const karas = await getAllKaras({ ignoreCollections: true }, undefined, true);
	generateHardsubsCache(karas);
	if (drainEvent)
		queue.drain = () => {
			emit('hardsubsQueueDrained');
		};
}

async function wrappedGenerateHS(payload: [string, string, string, string, string, string]) {
	const [mediaPath, subPath, outputFile, kid, loudnorm, fontsDir] = payload;
	logger.info(`Creating hardsub for ${mediaPath}`, { service });
	if (await fileExists(outputFile)) return;
	const assPath = subPath ? `${kid}.ass` : null;
	if (subPath) await fs.copyFile(subPath, assPath);
	try {
		await createHardsub(mediaPath, assPath, fontsDir, outputFile, loudnorm);
		hardsubsBeingProcessed.delete(kid);
		logger.info(`Hardsub for ${mediaPath} created`, { service });
		logger.info(`${queue.length()} hardsubs left in queue`, { service });
	} catch (err) {
		logger.error(`Error creating hardsub for ${mediaPath} : ${err}`, { service, obj: err });
		throw err;
	} finally {
		if (assPath) await fs.unlink(assPath);
	}
}

export async function generateHardsubs(karas: KaraList) {
	logger.info('Generate subchecksums', { service });
	interface HardsubInfo {
		kid: string;
		mediafile: string;
		mediasize: number;
		songname: string;
		subfile: string;
		repository: string;
		subchecksum: string;
		loudnorm: string;
	}
	const mediaMap = new Map<string, HardsubInfo>();
	const mediaWithInfosSet = new Set();
	for (const k of karas.content) {
		mediaMap.set(k.kid, {
			kid: k.kid,
			songname: k.songname,
			mediafile: k.mediafile,
			mediasize: k.mediasize,
			subfile: k.lyrics_infos[0]?.filename,
			repository: k.repository,
			subchecksum: null,
			loudnorm: k.loudnorm,
		});
	}
	for (const media of mediaMap.values()) {
		try {
			const subfile = await resolveFileInDirs(
				media.subfile || 'no_ass.txt',
				resolvedPathRepos('Lyrics', media.repository),
			);
			media.subchecksum = await generateSubchecksum(subfile[0]);
		} catch (err) {
			media.subchecksum = 'no_ass_file';
		}
		const ext = extname(media.mediafile);

		mediaWithInfosSet.add(media.mediafile.replace(ext, `.${media.mediasize}.${media.subchecksum}.mp4`));
	}
	logger.info('Generated subchecksums', { service });
	const hardsubDir = resolve(getState().dataPath, getConfig().System.Path.Hardsubs);
	const hardsubFiles = await fs.readdir(hardsubDir);
	const hardsubSet = new Set<string>(hardsubFiles);
	profile('removeHardsubs');
	try {
		hardsubFiles.forEach((file: string) => {
			const fileParts = file.split('.');
			if (mediaMap.has(fileParts[0])) {
				// Compare mediasizes. If mediasize or subchecksum are different, remove file
				if (
					mediaMap.get(fileParts[0]).mediasize !== +fileParts[1] ||
					mediaMap.get(fileParts[0]).subchecksum !== fileParts[2]
				) {
					fs.unlink(resolve(hardsubDir, file));
					logger.info(`Removing ${file}`, { service });
				}
			}
		});
	} catch (err) {
		logger.error('Unable to remove hardsubs, continuing', { service });
	} finally {
		profile('removeHardsubs');
	}
	profile('createHardsubs');
	try {
		let hardsubsCount = 0;
		for (const media of mediaMap.values()) {
			try {
				const hardsubFile = `${media.kid}.${media.mediasize}.${media.subchecksum}.mp4`;
				if (!hardsubSet.has(hardsubFile)) {
					const mediaPath = (
						await resolveFileInDirs(media.mediafile, resolvedPathRepos('Medias', media.repository))
					)[0];
					let subPath = null;
					if (media.subfile) {
						subPath = (
							await resolveFileInDirs(media.subfile, resolvedPathRepos('Lyrics', media.repository))
						)[0];
					}

					const fontsDir = resolvedPathRepos('Fonts', media.repository)[0];

					const outputFile = resolve(hardsubDir, hardsubFile);
					hardsubsBeingProcessed.add(media.kid);
					queue.push([mediaPath, subPath, outputFile, media.kid, media.loudnorm, fontsDir]);
					hardsubsCount += 1;
				}
			} catch (error) {
				logger.error(`Error when creating hardsub for ${media.mediafile}: ${error}`, { service });
			}
		}
		return hardsubsCount;
	} catch (err) {
		logger.warn('Some hardsubs could not be created', { service });
	} finally {
		profile('createHardsubs');
	}
}

async function generateSubchecksum(path: string) {
	let ass = await fs.readFile(path, { encoding: 'utf-8' }).catch((reason) => {
		if (reason.code === 'ENOENT') {
			return 'no_ass_file';
		}
		throw reason;
	});
	if (ass === 'no_ass_file') {
		return ass;
	}
	ass = ass.replace(/\r/g, '');
	return createHash('md5').update(ass, 'utf-8').digest('hex');
}
