import { watch, promises as fs } from 'fs';
import { resolve } from 'path';
import { resolvedPathRemoteRoot } from '../utils/config';
import logger from '../lib/utils/logger';

let availableRemotes: string[] = [];

export async function listAvailableRemotes(): Promise<string[]> {
	availableRemotes = await fs.readdir(resolvedPathRemoteRoot());
	logger.debug('Computed remote frontends', { service: 'Remote', obj: availableRemotes });
	return availableRemotes;
}

export function watchRemotes(): void {
	listAvailableRemotes();
	watch(resolvedPathRemoteRoot(), { persistent: false }, listAvailableRemotes);
}

export function getVersion(version: string): string | false {
	if (availableRemotes.includes(version)) {
		return resolve(resolvedPathRemoteRoot(), version);
	} else {
		return false;
	}
}
