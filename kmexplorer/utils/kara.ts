import { DBKara } from '%/lib/types/database/kara';
import { KaraFileV4 } from '%/lib/types/kara';

const tagTypesKaraFileV4Order: (
	'authors'|
	'creators'|
	'families'|
	'genres'|
	'groups'|
	'langs'|
	'misc'|
	'origins'|
	'platforms'|
	'series'|
	'singers'|
	'songtypes'|
	'songwriters'|
	'versions'|
	'warnings')[] = [
		'authors',
		'creators',
		'families',
		'genres',
		'groups',
		'langs',
		'misc',
		'origins',
		'platforms',
		'series',
		'singers',
		'songtypes',
		'songwriters',
		'versions',
		'warnings'
	];

export function determineVersion(titles: Record<string, string>): string {
	const mediaVersionArr = titles.eng?.split(' ~ ');
	return mediaVersionArr?.length > 1 ? mediaVersionArr[mediaVersionArr.length - 1].replace(' Vers', '') : 'Default';
}

export function DBKaraToKaraFile(dbKara: DBKara): KaraFileV4 {
	const mediaVersion = determineVersion(dbKara.titles);
	return {
		header: {
			description: 'Karaoke Mugen Karaoke Data File',
			version: 4
		},
		medias: [
			{
				version: mediaVersion,
				filename: dbKara.mediafile,
				audiogain: dbKara.gain as number,
				loudnorm: dbKara.loudnorm as string,
				duration: dbKara.duration,
				filesize: dbKara.mediasize,
				default: true,
				lyrics: dbKara.subfile
					? [
						{
							filename: dbKara.subfile,
							default: true,
							version: 'Default'
						}
					]
					: []
			}
		],
		data: {
			comment: dbKara.comment,
			created_at: new Date(dbKara.created_at).toISOString(),
			ignoreHooks: dbKara.ignoreHooks,
			kid: dbKara.kid,
			modified_at: new Date(dbKara.modified_at).toISOString(),
			parents: dbKara.parents,
			repository: dbKara.repository,
			songorder: dbKara.songorder,
			// @ts-ignore: langs and songtypes are already included
			tags: Object.fromEntries(
				tagTypesKaraFileV4Order // Get tagtypes
					.map((t) => {
						// Find the good things
						if (dbKara[t] instanceof Array && dbKara[t].length > 0) {
							return [t, dbKara[t].map(t2 => t2.tid)];
						} else {
							return [t, []];
						}
					})),
			titles: dbKara.titles,
			titles_aliases: dbKara.titles_aliases,
			title: dbKara.titles.eng,
			year: dbKara.year
		}
	};
}
