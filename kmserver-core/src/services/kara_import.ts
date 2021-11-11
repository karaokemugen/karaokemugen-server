/**
 * .kara files generation
 */

import logger from 'winston';
import {basename, resolve} from 'path';
import { promises as fs } from 'fs';
import { copy, mkdirp } from 'fs-extra';
import {getConfig, resolvedPathImport, resolvedPathTemp, resolvedPathRepos} from '../lib/utils/config';
import {duration} from '../lib/utils/date';
import { generateKara, validateNewKara } from '../lib/services/karaCreation';
import { NewKara, Kara } from '../lib/types/kara';
import { gitlabPostNewIssue } from './gitlab';
import { asyncExists, asyncMove } from '../lib/utils/files';
import sentry from '../utils/sentry';
import { addKaraInInbox } from './inbox';

export async function editKara(kara: Kara): Promise<string> {
	let newKara: NewKara;
	// Validation here, processing stuff later
	// No sentry triggered if validation fails
	try {
		const validationErrors = validateNewKara(kara);
		if (validationErrors) throw validationErrors;
	} catch(err) {
		throw {code: 400, msg: err};
	}
	try {
		const mediaFile = resolve(resolvedPathRepos('Medias')[0], kara.mediafile);
		const subFile = kara.subfile
			? resolve(resolvedPathRepos('Lyrics')[0], kara.subfile)
			: kara.subfile;
		// Removing useless data
		delete kara.karafile;
		// Copying already present files in temp directory to be worked on with by generateKara
		if (!kara.mediafile_orig) {
			kara.noNewVideo = true;
			kara.mediafile_orig = kara.mediafile;
			if (!await asyncExists(mediaFile)) throw `Mediafile ${mediaFile} does not exist! Check your base files or upload a new media`;
			await copy(mediaFile, resolve(resolvedPathTemp(), kara.mediafile), {overwrite: true});
		}
		if (!kara.subfile_orig) {
			kara.noNewSub = true;
			kara.subfile_orig = kara.subfile;
			if (kara.subfile) {
				if (!await asyncExists(subFile)) throw `Subfile ${subFile} does not exist! Check your base files or upload a new subfile`;
				await copy(subFile, resolve(resolvedPathTemp(), kara.subfile), {overwrite: true});
			}
		}
		// Treat files
		newKara = await generateKara(kara, resolvedPathImport(), resolvedPathImport(), resolvedPathImport());

		// Move files to their own dir
		const importDir = resolve(resolvedPathImport(), basename(newKara.file, '.kara.json'));
		try {
			await mkdirp(importDir);
		} catch(err) {
			// Folder might already exist. If it crashes, let it burn later.
		}
		await asyncMove(newKara.file, resolve(importDir, basename(newKara.file)), {overwrite: true});
		await asyncMove(resolve(resolvedPathImport(), newKara.data.mediafile), resolve(importDir, newKara.data.mediafile), {overwrite: true});
		if (newKara.data.subfile) await asyncMove(resolve(resolvedPathImport(), newKara.data.subfile), resolve(importDir, newKara.data.subfile), {overwrite: true});
		let tags = await fs.readdir(resolvedPathImport());
		tags = tags.filter((f: string) => f.endsWith('.tag.json'));
		for (const tag of tags) {
			await asyncMove(resolve(resolvedPathImport(), tag), resolve(importDir, tag), {overwrite: true});
		}
		// Remove files if they're not new
		if (kara.noNewSub && newKara.data.subfile) fs.unlink(resolve(resolvedPathImport(), importDir, newKara.data.subfile));
		if (kara.noNewVideo) {
			fs.unlink(resolve(resolvedPathImport(), importDir, newKara.data.mediafile));
			newKara.data.duration = 0;
		}

		// Post issue to gitlab
		logger.debug('Kara:', {service: 'GitLab', obj: newKara.data});
		const conf = getConfig();
		const karaName = basename(newKara.file, '.kara.json');
		let issueURL = '';
		let title = conf.Gitlab.IssueTemplate.Edit.Title || 'Edited kara: $kara';
		title = title.replace('$kara', karaName);
		let desc = conf.Gitlab.IssueTemplate.Edit.Description || '';
		desc = desc.replace('$file', basename(newKara.file))
			.replace('$comment', kara.comment || '')
			.replace('$newSub', `${!newKara.data.noNewSub}`)
			.replace('$newVideo', `${!newKara.data.noNewVideo}`)
			.replace('$author', newKara.data.authors.map(t => t.name).join(', '))
			.replace('$title', JSON.stringify(newKara.data.titles))
			.replace('$series', newKara.data.series.map(t => t.name).join(', '))
			.replace('$type', newKara.data.songtypes.map(t => t.name).join(', '))
			.replace('$order', (newKara.data.songorder && newKara.data.songorder.toString()) || '')
			.replace('$lang', newKara.data.langs.map(t => t.name).join(', '))
			.replace('$year', `${newKara.data.year}`)
			.replace('$singer', newKara.data.singers.map(t => t.name).join(', '))
			.replace('$tags', newKara.data.misc.map(t => t.name).join(', '))
			.replace('$songwriter', newKara.data.songwriters.map(t => t.name).join(', '))
			.replace('$creator', newKara.data.creators.map(t => t.name).join(', '))
			.replace('$groups', newKara.data.groups.map(t => t.name).join(', '))
			.replace('$families', newKara.data.families.map(t => t.name).join(', '))
			.replace('$genres', newKara.data.genres.map(t => t.name).join(', '))
			.replace('$platforms', newKara.data.platforms.map(t => t.name).join(', '))
			.replace('$origins', newKara.data.origins.map(t => t.name).join(', '))
			.replace('$versions', newKara.data.versions.map(t => t.name).join(', '))
			.replace('$duration', duration(newKara.data.duration));
		try {
			if (conf.Gitlab.Enabled) {
				issueURL = await gitlabPostNewIssue(title, desc, conf.Gitlab.IssueTemplate.Edit.Labels);
			}
		} catch(err) {
			logger.error('Call to Gitlab API failed', {service: 'GitLab', obj: err});
			sentry.error(err, 'Warning');
		}
		addKaraInInbox(karaName, issueURL, true);
		return issueURL;
	} catch(err) {
		logger.error('Error while editing kara', {service: 'KaraGen', obj: err});
		if (!err.msg) {
			sentry.addErrorInfo('Kara', JSON.stringify(kara, null, 2));
			sentry.error(err);
		}
		throw err;
	}
}


export async function createKara(kara: Kara) {
	const conf = getConfig();
	let newKara: NewKara;
	kara.repository = conf.System.Repositories[0].Name;
	// Validation here, processing stuff later
	// No sentry triggered if validation fails
	try {
		const validationErrors = validateNewKara(kara);
		if (validationErrors) throw validationErrors;
	} catch(err) {
		throw {code: 400, msg: err};
	}
	try {
		newKara = await generateKara(kara,
			resolvedPathImport(),
			resolvedPathImport(),
			resolvedPathImport()
		);
		// Move files to their own directory
		const importDir = resolve(resolvedPathImport(), basename(newKara.file, '.kara.json'));
		try {
			await mkdirp(importDir);
		} catch(err) {
			// Folder might exist already
		}
		await asyncMove(newKara.file, resolve(importDir, basename(newKara.file)), {overwrite: true});
		await asyncMove(resolve(resolvedPathImport(), newKara.data.mediafile), resolve(importDir, newKara.data.mediafile), {overwrite: true});
		if (newKara.data.subfile) await asyncMove(resolve(resolvedPathImport(), newKara.data.subfile), resolve(importDir, newKara.data.subfile), {overwrite: true});
		let tags = await fs.readdir(resolvedPathImport());
		tags = tags.filter((f: string) => f.endsWith('.tag.json'));
		for (const tag of tags) {
			await asyncMove(resolve(resolvedPathImport(), tag), resolve(importDir, tag), {overwrite: true});
		}
	} catch(err) {
		logger.error('Error importing kara', {service: 'KaraGen', obj: err});
		if (!err.msg) {
			sentry.addErrorInfo('Kara', JSON.stringify(kara, null, 2));
			sentry.error(err);
		}
		throw err;
	}
	const karaName = basename(newKara.file, '.kara.json');
	let issueURL = '';
	logger.debug('Kara', {service: 'GitLab', obj: newKara.data});
	let title = conf.Gitlab.IssueTemplate.Import.Title || 'New kara: $kara';
	title = title.replace('$kara', karaName);
	let desc = conf.Gitlab.IssueTemplate.Import.Description || '';
	desc = desc.replace('$file', basename(newKara.file))
		.replace('$comment', kara.comment || '')
		.replace('$author', newKara.data.authors.map(t => t.name).join(', '))
		.replace('$title', JSON.stringify(newKara.data.titles))
		.replace('$series', newKara.data.series.map(t => t.name).join(', '))
		.replace('$type', newKara.data.songtypes.map(t => t.name).join(', '))
		.replace('$order', (newKara.data.songorder && newKara.data.songorder.toString()) || '')
		.replace('$lang', newKara.data.langs.map(t => t.name).join(', '))
		.replace('$year', `${newKara.data.year}`)
		.replace('$singer', newKara.data.singers.map(t => t.name).join(', '))
		.replace('$tags', newKara.data.misc.map(t => t.name).join(', '))
		.replace('$songwriter', newKara.data.songwriters.map(t => t.name).join(', '))
		.replace('$creator', newKara.data.creators.map(t => t.name).join(', '))
		.replace('$groups', newKara.data.groups.map(t => t.name).join(', '))
		.replace('$families', newKara.data.families.map(t => t.name).join(', '))
		.replace('$genres', newKara.data.genres.map(t => t.name).join(', '))
		.replace('$platforms', newKara.data.platforms.map(t => t.name).join(', '))
		.replace('$origins', newKara.data.origins.map(t => t.name).join(', '))
		.replace('$versions', newKara.data.versions.map(t => t.name).join(', '))
		.replace('$duration', duration(newKara.data.duration));
	try {
		if (conf.Gitlab.Enabled) {
			issueURL = await gitlabPostNewIssue(title, desc, conf.Gitlab.IssueTemplate.Import.Labels);
		}
		addKaraInInbox(karaName, issueURL);
		return issueURL;
	} catch(err) {
		logger.error('Call to Gitlab API failed', {service: 'KaraImport', obj: err});
		sentry.error(err, 'Warning');
		throw err;
	}
}
