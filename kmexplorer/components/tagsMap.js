import i18next from 'i18next';

export const tagsMap = Object.freeze({
	singer: {
		id: 2,
		label: i18next.t('tag:singer_label')
	},
	songtype: {
		id: 3,
		label: i18next.t('tag:songtype_label'),
	},
	creator: {
		id: 4,
		label: i18next.t('tag:creator_label')
	},
	language: {
		id: 5,
		label: i18next.t('tag:language_label')
	},
	author: {
		id: 6,
		label: i18next.t('tag:author_label')
	},
	misc: {
		id: 7,
		label: i18next.t('tag:misc_label'),
	},
	songwriter: {
		id: 8,
		label: i18next.t('tag:songwriter_label')
	},
	group:{
		id: 9,
		label: i18next.t('tag:group_label')
	},
	family:{
		id: 10,
		label: i18next.t('tag:family_label')
	},
	origin:{
		id: 11,
		label: i18next.t('tag:origin_label')
	},
	genre:{
		id: 12,
		label: i18next.t('tag:genre_label')
	},
	platform:{
		id: 13,
		label: i18next.t('tag:platform_label')
	}
});

export default tagsMap