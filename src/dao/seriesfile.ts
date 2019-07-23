import { asyncReadDir, asyncReadFile } from "../lib/utils/files";
import { resolvedPathImport } from "../lib/utils/config";
import { resolve } from "path";
import { Series } from "../lib/types/series";

export async function findSeriesInImportedFiles(name: string): Promise<Series> {
	// Read import directory
	let files = await asyncReadDir(resolvedPathImport());
	files = files.filter((f: string) => f.endsWith('.series.json'));
	for (const file of files) {
		const data = await asyncReadFile(resolve(resolvedPathImport(), file), 'utf-8');
		if (data.series.name === name) return data.series;
	}
	return null;
}