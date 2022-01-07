import { Tag } from '../lib/types/tag';
import { resolvedPath } from '../lib/utils/config';
import { tagTypes } from '../lib/utils/constants';
import { Dirent, promises as fs } from 'fs';
import { basename, resolve } from 'path';

export async function findTagInImportedFiles(name: string, types: number[]): Promise<Tag> {
	// Read import directory
	const directories: Dirent[] = await fs.readdir(resolvedPath('Import'), {encoding: 'utf8', withFileTypes: true});
	let list = directories.filter(e => e.isDirectory()).map(e => e.name);
	let files: string[] = [];
	for (const dir of list) {
		const dirPath = resolve(resolvedPath('Import'), dir);
		let tags = await fs.readdir(dirPath);
		tags = tags.filter((f: string) => f.endsWith('.tag.json'));
		for (const tag of tags) {
			files.push(resolve(dirPath, tag));
		}
	};
	for (const file of files) {
		const data = JSON.parse(await fs.readFile(file, 'utf-8'));
		// Let's keep in mind that types will only return one type even though it's an array and that files in the Import folder only have one type
		if (data.tag.name === name && data.tag.types.map((t: string) => tagTypes[t])[0] === types[0]) {
			// Tag found, let's copy it to import dir so it's also copied to the new kara. See #152
			await fs.writeFile(resolve(resolvedPath('Import'), basename(file)), JSON.stringify(data, null, 2));
			return data.tag;
		}
	}
	return null;
}
