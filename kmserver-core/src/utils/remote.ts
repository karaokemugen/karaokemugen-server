import { promises as fs, watch } from 'fs';
import { resolve } from 'path';

import logger from '../lib/utils/logger';
import { resolvedPathRemoteRoot } from './config';

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
