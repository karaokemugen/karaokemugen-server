/*
 * Constants for KM (tags, langs, types, etc.).
 */

/** Regexps for validation. */
export const uuidRegexp = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
export const mediaFileRegexp = '^.+\\.(avi|mkv|mp4|webm|mov|wmv|mpg|ogg|m4a|mp3)$';
export const subFileRegexp = '^.+\\.ass$';

export const karaTypes = Object.freeze({
	OP: {type: 'OP', dbType: 'TYPE_OP'},
	ED: {type: 'ED', dbType: 'TYPE_ED'},
	IN: {type: 'IN', dbType: 'TYPE_IN'},
	MV: {type: 'MV', dbType: 'TYPE_MV'},
	PV: {type: 'PV', dbType: 'TYPE_PV'},
	CM: {type: 'CM', dbType: 'TYPE_CM'},
	OT: {type: 'OT', dbType: 'TYPE_OT'},
	AMV: {type: 'AMV', dbType: 'TYPE_AMV'},
	LIVE: {type: 'LIVE', dbType: 'TYPE_LIVE'}
});

export const karaTypesArray = Object.freeze(Object.keys(karaTypes));

export const tagTypes = Object.freeze({
	singer: 2,
	songtype: 3,
	creator: 4,
	lang: 5,
	author: 6,
	misc: 7,
	songwriter: 8,
	groups: 9
});

/** Map used for database generation */
export const karaTypesMap: any = Object.freeze(new Map([
	[karaTypes.OP.type, 'TYPE_OP,3'],
	[karaTypes.ED.type, 'TYPE_ED,3'],
	[karaTypes.IN.type, 'TYPE_IN,3'],
	[karaTypes.MV.type, 'TYPE_MV,3'],
	[karaTypes.PV.type, 'TYPE_PV,3'],
	[karaTypes.CM.type, 'TYPE_CM,3'],
	[karaTypes.OT.type, 'TYPE_OT,3'],
	[karaTypes.AMV.type, 'TYPE_AMV,3'],
	[karaTypes.LIVE.type, 'TYPE_LIVE,3'],
]));

/** Extracting type from a string */
export function getType(types) {
	return types.split(/\s+/).find(t => karaTypesArray.includes(t));
}

export const tags = [
	'SPECIAL',
	'REMIX',
	'SOUNDONLY',
	'IDOL',
	'DREAMCAST',
	'PARODY',
	'HUMOR',
	'R18',
	'SPOIL',
	'LONG',
	'HARDMODE',
	'DUO',
	'REAL',
	'ANIME',
	'MOVIE',
	'TVSHOW',
	'OVA',
	'ONA',
	'VIDEOGAME',
	'VN',
	'MOBAGE',
	'VOCALOID',
	'TOKU',
	'MECHA',
	'MAGICALGIRL',
	'SHOUJO',
	'SHOUNEN',
	'YURI',
	'YAOI',
	'PSX',
	'PS2',
	'PS3',
	'PS4',
	'PSV',
	'PSP',
	'XBOX360',
	'XBOXONE',
	'GAMECUBE',
	'DS',
	'3DS',
	'PC',
	'SEGACD',
	'SATURN',
	'WII',
	'CREDITLESS',
	'SWITCH',
	'N64',
	'DRAMA',
	'DUB',
	'COVER'
];
