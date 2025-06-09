import type { TagTypeNum } from '%/lib/types/tag';
import type { Roles } from '%/lib/types/user';

export interface TagType {
	icon: string;
	class: string;
	type?: TagTypeNum | 0;
	name?: string;
	language: 'song_name' | 'user';
}

export const tagRegex = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})~([0-9]{1,2})/;

export const tagTypesMap: { [key: number]: TagType } = {
	3: {
		icon: 'tasks',
		class: 'is-success',
		name: 'songtypes',
		language: 'user',
	},
	1: {
		icon: 'tv',
		class: 'is-success',
		name: 'series',
		language: 'song_name',
	},
	5: {
		icon: 'globe',
		class: 'is-success',
		name: 'langs',
		language: 'user',
	},
	2: {
		icon: 'microphone-alt',
		class: 'is-warning',
		name: 'singers',
		language: 'song_name',
	},
	17: {
		icon: 'people-group',
		class: 'is-warning',
		name: 'singergroups',
		language: 'song_name',
	},
	8: {
		icon: 'signature',
		class: 'is-warning',
		name: 'songwriters',
		language: 'song_name',
	},
	10: {
		icon: 'photo-video',
		class: 'is-info',
		name: 'families',
		language: 'user',
	},
	11: {
		icon: 'project-diagram',
		class: 'is-info',
		name: 'origins',
		language: 'user',
	},
	12: {
		icon: 'chess',
		class: 'is-info',
		name: 'genres',
		language: 'user',
	},
	13: {
		icon: 'laptop',
		class: 'is-info',
		name: 'platforms',
		language: 'user',
	},
	4: {
		icon: 'chalkboard-teacher',
		class: 'is-white',
		name: 'creators',
		language: 'song_name',
	},
	6: {
		icon: 'user-secret',
		class: 'is-white',
		name: 'authors',
		language: 'song_name',
	},
	9: {
		icon: 'box',
		class: 'is-black',
		name: 'groups',
		language: 'user',
	},
	7: {
		icon: 'tag',
		class: 'is-black',
		name: 'misc',
		language: 'user',
	},
	0: {
		icon: 'calendar-alt',
		class: 'is-grey',
		name: 'years',
		language: 'user',
	},
	14: {
		icon: 'tachometer-alt',
		class: 'is-white',
		name: 'versions',
		language: 'user',
	},
	15: {
		icon: 'exclamation-triangle',
		class: 'is-danger',
		name: 'warnings',
		language: 'user',
	},
	16: {
		icon: 'layer-group',
		class: 'is-white',
		name: 'collections',
		language: 'user',
	},
	18: {
		icon: 'sitemap',
		class: 'is-success',
		name: 'franchises',
		language: 'song_name',
	},
};

export const tagTypes: { [key: string]: TagType } = {
	songtypes: {
		icon: 'tasks',
		class: 'is-success',
		type: 3,
		language: 'user',
	},
	series: {
		icon: 'tv',
		class: 'is-success',
		type: 1,
		language: 'song_name',
	},
	langs: {
		icon: 'globe',
		class: 'is-success',
		type: 5,
		language: 'user',
	},
	singers: {
		icon: 'microphone-alt',
		class: 'is-warning',
		type: 2,
		language: 'song_name',
	},
	singergroups: {
		icon: 'people-group',
		class: 'is-warning',
		type: 17,
		language: 'song_name',
	},
	songwriters: {
		icon: 'signature',
		class: 'is-warning',
		type: 8,
		language: 'song_name',
	},
	families: {
		icon: 'photo-video',
		class: 'is-info',
		type: 10,
		language: 'user',
	},
	origins: {
		icon: 'project-diagram',
		class: 'is-info',
		type: 11,
		language: 'user',
	},
	genres: {
		icon: 'chess',
		class: 'is-info',
		type: 12,
		language: 'user',
	},
	platforms: {
		icon: 'laptop',
		class: 'is-info',
		type: 13,
		language: 'user',
	},
	creators: {
		icon: 'chalkboard-teacher',
		class: 'is-purple',
		type: 4,
		language: 'song_name',
	},
	authors: {
		icon: 'user-secret',
		class: 'is-purple',
		type: 6,
		language: 'song_name',
	},
	groups: {
		icon: 'box',
		class: 'is-black',
		type: 9,
		language: 'user',
	},
	misc: {
		icon: 'tag',
		class: 'is-black',
		type: 7,
		language: 'user',
	},
	years: {
		icon: 'calendar-alt',
		class: 'is-grey',
		type: 0,
		language: 'user',
	},
	versions: {
		icon: 'tachometer-alt',
		class: 'is-white',
		type: 14,
		language: 'user',
	},
	warnings: {
		icon: 'exclamation-triangle',
		class: 'is-danger',
		type: 15,
		language: 'user',
	},
	collections: {
		icon: 'layer-group',
		class: 'is-white',
		type: 16,
		language: 'user',
	},
	franchises: {
		icon: 'sitemap',
		class: 'is-success',
		type: 18,
		language: 'song_name',
	},
};

export interface RoleDetail {
	class: string;
	icon: string;
}

type RoleDetails = {
	[role in keyof Roles]: RoleDetail;
};

export const rolesList: RoleDetails = {
	donator: {
		icon: 'heart',
		class: 'is-purple',
	},
	admin: {
		icon: 'user-shield',
		class: 'is-danger',
	},
	contributor: {
		icon: 'user-secret',
		class: 'is-warning',
	},
	maintainer: {
		icon: 'user-cog',
		class: 'is-success',
	},
};
