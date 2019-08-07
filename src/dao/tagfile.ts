import { Tag } from "../lib/types/tag";
import { asyncReadDir, asyncReadFile } from "../lib/utils/files";
import { resolvedPathImport } from "../lib/utils/config";
import { tagTypes } from "../lib/utils/constants";
import { resolve } from "path";

export async function findTagInImportedFiles(name: string, types: number[]): Promise<Tag> {
	// Read import directory
	let files = await asyncReadDir(resolvedPathImport());
	files = files.filter((f: string) => f.endsWith('.tag.json'));
	for (const file of files) {
		const data = JSON.parse(await asyncReadFile(resolve(resolvedPathImport(), file), 'utf-8'));
		// Let's keep in mind that types will only return one type even though it's an array and that files in the Import folder only have one type
		if (data.tag.name === name && data.tag.types.map((t: string) => tagTypes[t])[0] === types[0]) return data.tag;
	}
	return null;
}