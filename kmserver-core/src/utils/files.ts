import {promises as fs} from 'fs';
import {resolve} from 'path';

import {KaraFileV4} from '../lib/types/kara.js';
import {resolvedPathRepos} from '../lib/utils/config.js';
import {listAllFiles} from '../lib/utils/files.js';

export async function findFileByUUID(property: 'kid', uuid: string, repo: string): Promise<[string, KaraFileV4]> {
	const files = await listAllFiles('Karaokes', repo);
	const directory = resolvedPathRepos('Karaokes', repo)[0];
	for (const file of files) {
		const content = JSON.parse(await fs.readFile(resolve(directory, file), 'utf-8'));
		if (content.data[property] === uuid) {
			return [file, content];
		}
	}
	throw new Error(`File not found by UUID: ${property}/${uuid}`);
}
