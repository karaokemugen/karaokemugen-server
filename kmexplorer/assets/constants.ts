export interface tagType {
	icon: string,
	class: string,
	type?: number,
	name?: string
}

export const tagRegex = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})~([0-9]{1,2})/;

export const tagTypesMap: { [key: number]: tagType } = {
	3: {
		icon: 'tasks',
		class: 'is-success',
		name: 'songtypes'
	},
	1: {
		icon: 'tv',
		class: 'is-success',
		name: 'series'
	},
	5: {
		icon: 'globe',
		class: 'is-success',
		name: 'langs'
	},
	2: {
		icon: 'microphone-alt',
		class: 'is-warning',
		name: 'singers'
	},
	8: {
		icon: 'signature',
		class: 'is-warning',
		name: 'singers'
	},
	10: {
		icon: 'photo-video',
		class: 'is-info',
		name: 'families'
	},
	11: {
		icon: 'project-diagram',
		class: 'is-info',
		name: 'origins'
	},
	12: {
		icon: 'chess',
		class: 'is-info',
		name: 'genres'
	},
	13: {
		icon: 'laptop',
		class: 'is-info',
		name: 'platforms'
	},
	4: {
		icon: 'chalkboard-teacher',
		class: 'is-white',
		name: 'creators'
	},
	6: {
		icon: 'user-secret',
		class: 'is-white',
		name: 'authors'
	},
	9: {
		icon: 'box',
		class: 'is-black',
		name: 'groups'
	},
	7: {
		icon: 'tag',
		class: 'is-black',
		name: 'misc'
	},
	0: {
		icon: 'calendar-alt',
		class: 'is-grey',
		name: 'years'
	}
};

export const tagTypes: { [key: string]: tagType } = {
	songtypes: {
		icon: 'tasks',
		class: 'is-success',
		type: 3
	},
	series: {
		icon: 'tv',
		class: 'is-success',
		type: 1
	},
	langs: {
		icon: 'globe',
		class: 'is-success',
		type: 5
	},
	singers: {
		icon: 'microphone-alt',
		class: 'is-warning',
		type: 2
	},
	songwriters: {
		icon: 'signature',
		class: 'is-warning',
		type: 8
	},
	families: {
		icon: 'photo-video',
		class: 'is-info',
		type: 10
	},
	origins: {
		icon: 'project-diagram',
		class: 'is-info',
		type: 11
	},
	genres: {
		icon: 'chess',
		class: 'is-info',
		type: 12
	},
	platforms: {
		icon: 'laptop',
		class: 'is-info',
		type: 13
	},
	creators: {
		icon: 'chalkboard-teacher',
		class: 'is-purple',
		type: 4
	},
	authors: {
		icon: 'user-secret',
		class: 'is-purple',
		type: 6
	},
	groups: {
		icon: 'box',
		class: 'is-black',
		type: 9
	},
	misc: {
		icon: 'tag',
		class: 'is-black',
		type: 7
	},
	years: {
		icon: 'calendar-alt',
		class: 'is-grey',
		type: 0
	}
};
