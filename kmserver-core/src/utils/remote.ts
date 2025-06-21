import extract from 'extract-zip';
import { promises as fs, watch } from 'fs';
import { resolve } from 'path';

import { getConfig, resolvedPath } from '../lib/utils/config.js';
import { downloadFile } from '../lib/utils/downloader.js';
import { fileExists } from '../lib/utils/files.js';
import HTTP from '../lib/utils/http.js';
import logger from '../lib/utils/logger.js';
import { resolvedPathRemoteRoot } from './config.js';

const service = 'Remote';

let availableRemotes: string[] = [];

export async function listAvailableRemotes(): Promise<string[]> {
	availableRemotes = await fs.readdir(resolvedPathRemoteRoot());
	logger.debug('Computed remote frontends', { service, obj: availableRemotes });
	return availableRemotes;
}

export function watchRemotes(): void {
	listAvailableRemotes();
	watch(resolvedPathRemoteRoot(), { persistent: false }, listAvailableRemotes);
}

export function getVersion(version: string): string | false {
	if (availableRemotes.includes(version)) {
		return resolve(resolvedPathRemoteRoot(), version);
	}
		return false;
}

export async function isRemoteAvailable(version: string) {
	return fileExists(resolve(resolvedPathRemoteRoot(), version));
}

export async function isRemoteDownloadable(version: string) {
	try {
		const url = `${getConfig().Remote.FrontendBundlesURL}/${version}.zip`;
		await HTTP.head(url);
		return true;
	} catch (err) {
		return false;
	}
}

export async function fetchRemote(version: string) {
	try {
		const filename = resolve(resolvedPath('Temp'), `${version}.zip`);
		await downloadFile({
			url: `https://${getConfig().Remote.FrontendBundlesURL}/${version}.zip`,
			name: `Frontend ${version}`,
			filename
		});
		logger.info(`Installing remote ${version}`, { service });
		const outDir = resolve(resolvedPathRemoteRoot(), version);
		await fs.mkdir(outDir);
		await extract(filename, {
			dir: outDir
		});
		logger.info(`Installed remote ${version}`, { service });
	} catch(err) {
		logger.error(`Error fetching remote ${version} : ${err}`, { service });
		throw err;
	}
}

