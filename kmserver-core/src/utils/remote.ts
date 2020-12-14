import { watch } from 'fs';
import { asyncReadDir } from '../lib/utils/files';
import { resolve } from 'path';
import { getConfig } from '../lib/utils/config';
import logger from '../lib/utils/logger';

let availableRemotes: string[] = [];

export async function listAvailableRemotes(): Promise<string[]> {
	availableRemotes = await asyncReadDir(getConfig().Remote.FrontendRoot);
	logger.debug('Computed remote frontends', { service: 'Remote', obj: availableRemotes });
	return availableRemotes;
}

export function watchRemotes(): void {
	listAvailableRemotes();
	watch(getConfig().Remote.FrontendRoot, { persistent: false }, listAvailableRemotes);
}

export function getVersion(version: string): string | false {
	if (availableRemotes.includes(version)) {
		return resolve(getConfig().Remote.FrontendRoot, version);
	} else {
		return false;
	}
}
