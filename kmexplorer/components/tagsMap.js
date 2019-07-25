import {i18n,withNamespaces} from '../i18n';
import Icons from './Icons.js';

export const tagsMap = Object.freeze({
	singer: {
		id: 2,
		label: i18n.t('common:category.singer'),
		icon: Icons.singer,
	},
	songtype: {
		id: 3,
		label: i18n.t('common:category.songtype'),
		icon: Icons.songtype,
	},
	creator: {
		id: 4,
		label: i18n.t('common:category.creator'),
		icon: Icons.creator,
	},
	language: {
		id: 5,
		label: i18n.t('common:category.language'),
		icon: Icons.language,
	},
	author: {
		id: 6,
		label: i18n.t('common:category.author'),
		icon: Icons.author,
	},
	misc: {
		id: 7,
		label: i18n.t('common:category.misc'),
		icon: Icons.misc,
	},
	songwriter: {
		id: 8,
		label: i18n.t('common:category.songwriter'),
		icon: Icons.songwriter,
	},
	group:{
		id: 9,
		label: i18n.t('common:category.group'),
		icon: Icons.group,
	},
	family:{
		id: 10,
		label: i18n.t('common:category.family'),
		icon: Icons.family,
	},
	origin:{
		id: 11,
		label: i18n.t('common:category.origin'),
		icon: Icons.origin,
	},
	genre:{
		id: 12,
		label: i18n.t('common:category.genre'),
		icon: Icons.genre,
	},
	platform:{
		id: 13,
		label: i18n.t('common:category.platform'),
		icon: Icons.platform,
	}
});

export function tagTypeFromId(id) {
	for(const i in tagsMap)
	{
		let t = tagsMap[i];
		if(t.id === parseInt(id))
		{
			t.code = i;
			return t;
		}
	}
}

export default withNamespaces(['common','tag'])(tagsMap)
