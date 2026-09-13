import type { DBKara, DBKaraTag } from '%/lib/types/database/kara';
import type { KaraFileV4 } from '%/lib/types/kara';
import type { DBPLC } from '%/lib/types/database/playlist';
import { v4 as UUIDv4 } from 'uuid';
import { tagTypes } from '~/assets/constants';
import type { TagExtend } from '~/store/menubar';

const tagTypesKaraFileV4Order: (
	| 'authors'
	| 'creators'
	| 'families'
	| 'genres'
	| 'groups'
	| 'langs'
	| 'misc'
	| 'origins'
	| 'platforms'
	| 'series'
	| 'singers'
	| 'singergroups'
	| 'songtypes'
	| 'songwriters'
	| 'versions'
	| 'warnings'
	| 'collections'
	| 'franchises'
)[] = [
	'authors',
	'collections',
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
	'singergroups',
	'songtypes',
	'songwriters',
	'versions',
	'warnings',
	'franchises',
];

export function determineVersion(titles: Record<string, string>, titles_default_language?: string): string {
	const mediaVersionArr = titles && titles[titles_default_language || 'eng']?.split(' ~ ');
	return mediaVersionArr?.length > 1 ? mediaVersionArr[mediaVersionArr.length - 1].replace(' Vers', '') : 'Default';
}

export function convertDBKaraToKaraFile(dbKara?: DBKara): KaraFileV4 {
	const mediaVersion = determineVersion(dbKara?.titles, dbKara?.titles_default_language);
	return {
		header: {
			version: 4,
			description: 'Karaoke Mugen Karaoke Data File',
		},
		medias: [
			{
				version: mediaVersion,
				filename: dbKara?.mediafile || '',
				loudnorm: dbKara?.loudnorm as string,
				filesize: dbKara?.mediasize || 0,
				duration: dbKara?.duration || 0,
				default: true,
				lyrics: dbKara?.lyrics_infos[0]
					? [
							{
								...dbKara.lyrics_infos[0], // Keep values like announcePosition
								filename: dbKara.lyrics_infos[0].filename,
								default: true,
								version: 'Default',
							},
						]
					: [],
			},
		],
		data: {
			comment: dbKara?.comment,
			created_at: dbKara?.created_at ? new Date(dbKara?.created_at).toISOString() : new Date().toISOString(),
			ignoreHooks: dbKara?.ignore_hooks || false,
			kid: dbKara?.kid || UUIDv4(),
			modified_at: new Date().toISOString(),
			parents: dbKara?.parents,
			repository: dbKara?.repository || '',
			songorder: dbKara?.songorder,
			tags: Object.fromEntries(
				tagTypesKaraFileV4Order // Get tagtypes
					.map((t) => {
						// Find the good things
						if (dbKara && dbKara[t] instanceof Array && dbKara[t].length > 0) {
							return [t, dbKara[t].map((t2) => t2.tid)];
						} else {
							return [t, []];
						}
					}),
			),
			from_display_type: dbKara?.from_display_type || undefined,
			titles: dbKara?.titles || {},
			titles_default_language: dbKara?.titles_default_language,
			titles_aliases: dbKara?.titles_aliases || [],
			year: dbKara?.year || new Date().getFullYear(),
		},
		meta: {},
	};
}

export function isPlayable(karaoke: DBPLC | DBKara, isAdmin?: boolean) {
	let playable = true;
	if (!isAdmin) {
		for (const tagType in tagTypes) {
			if (tagType === 'years') {
				continue;
			}
			for (const tag of (karaoke as any)[tagType]) {
				if (tag.noLiveDownload) {
					playable = false;
				}
			}
		}
	}
	return playable;
}

export function getTagsToDisplay(karaoke: DBKara, tagTypes: string[]) {
	const tags: TagExtend[] = [];
	for (const tagType of tagTypes) {
		let i = 0;
		// @ts-expect-error Attribute with string array
		if (karaoke[tagType] && karaoke[tagType].length !== 0) {
			// @ts-expect-error Attribute with string array
			for (const tag of karaoke[tagType]) {
				// Removing all tags mentioned in the karaphrase
				if (
					(tag as DBKaraTag).priority >= -1 &&
					!(
						(karaoke.from_display_type === tagType && i === 0) ||
						// Remove the first series
						(tagType === 'series' && i === 0 && !karaoke.from_display_type) ||
						// Remove the first songtype
						(tagType === 'songtypes' && i === 0) ||
						// Remove the first singergroups if the karaoke has no series
						(tagType === 'singergroups' &&
							i === 0 &&
							karaoke.series.length === 0 &&
							!karaoke.from_display_type) ||
						// Remove the first singer if the karaoke has no singergroups and no series
						(tagType === 'singers' &&
							i === 0 &&
							karaoke.singergroups.length === 0 &&
							karaoke.series.length === 0 &&
							!karaoke.from_display_type) ||
						// Remove the next tags to avoid overflow
						i > 1
					)
				) {
					tags.push({
						type: tagType,
						tag,
					});
				}
				i++;
			}
		}
	}
	return tags;
}
