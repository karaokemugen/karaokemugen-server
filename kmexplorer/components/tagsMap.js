import i18next from 'i18next';

export const tagsMap = Object.freeze({
	singer: {
		id: 2,
		label: i18next.t('tag:singer_label')
	},
	songtype: {
		id: 3,
		label: i18next.t('tag:songtype_label'),
		map: {
			TYPE_OP  : i18next.t("tag:songtype.TYPE_OP"),
			TYPE_ED  : i18next.t("tag:songtype.TYPE_ED"),
			TYPE_MV  : i18next.t("tag:songtype.TYPE_MV"),
			TYPE_AMV : i18next.t("tag:songtype.TYPE_AMV"),
			TYPE_IN  : i18next.t("tag:songtype.TYPE_IN"),
			TYPE_LIVE: i18next.t("tag:songtype.TYPE_LIVE"),
			TYPE_OT  : i18next.t("tag:songtype.TYPE_OT"),
			TYPE_CM  : i18next.t("tag:songtype.TYPE_CM"),
			TYPE_PV  : i18next.t("tag:songtype.TYPE_PV"),
		}
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
		map: {
			TAG_ANIME      : i18next.t('tag:misc.TAG_ANIME'),
			TAG_DREAMCAST  : i18next.t('tag:misc.TAG_DREAMCAST'),
			TAG_DS         : i18next.t('tag:misc.TAG_DS'),
			TAG_DUO        : i18next.t('tag:misc.TAG_DUO'),
			TAG_GAMECUBE   : i18next.t('tag:misc.TAG_GAMECUBE'),
			TAG_HARDMODE   : i18next.t('tag:misc.TAG_HARDMODE'),
			TAG_HUMOR      : i18next.t('tag:misc.TAG_HUMOR'),
			TAG_IDOL       : i18next.t('tag:misc.TAG_IDOL'),
			TAG_LONG       : i18next.t('tag:misc.TAG_LONG'),
			TAG_MAGICALGIRL: i18next.t('tag:misc.TAG_MAGICALGIRL'),
			TAG_MECHA      : i18next.t('tag:misc.TAG_MECHA'),
			TAG_MOBAGE     : i18next.t('tag:misc.TAG_MOBAGE'),
			TAG_MOVIE      : i18next.t('tag:misc.TAG_MOVIE'),
			TAG_ONA        : i18next.t('tag:misc.TAG_ONA'),
			TAG_OVA        : i18next.t('tag:misc.TAG_OVA'),
			TAG_PARODY     : i18next.t('tag:misc.TAG_PARODY'),
			TAG_PC         : i18next.t('tag:misc.TAG_PC'),
			TAG_PS2        : i18next.t('tag:misc.TAG_PS2'),
			TAG_PS3        : i18next.t('tag:misc.TAG_PS3'),
			TAG_PS4        : i18next.t('tag:misc.TAG_PS4'),
			TAG_PSP        : i18next.t('tag:misc.TAG_PSP'),
			TAG_PSV        : i18next.t('tag:misc.TAG_PSV'),
			TAG_PSX        : i18next.t('tag:misc.TAG_PSX'),
			TAG_R18        : i18next.t('tag:misc.TAG_R18'),
			TAG_REAL       : i18next.t('tag:misc.TAG_REAL'),
			TAG_REMIX      : i18next.t('tag:misc.TAG_REMIX'),
			TAG_SATURN     : i18next.t('tag:misc.TAG_SATURN'),
			TAG_SEGACD     : i18next.t('tag:misc.TAG_SEGACD'),
			TAG_SHOUJO     : i18next.t('tag:misc.TAG_SHOUJO'),
			TAG_SHOUNEN    : i18next.t('tag:misc.TAG_SHOUNEN'),
			TAG_SOUNDONLY  : i18next.t('tag:misc.TAG_SOUNDONLY'),
			TAG_SPECIAL    : i18next.t('tag:misc.TAG_SPECIAL'),
			TAG_SPOIL      : i18next.t('tag:misc.TAG_SPOIL'),
			TAG_SWITCH     : i18next.t('tag:misc.TAG_SWITCH'),
			TAG_TOKU       : i18next.t('tag:misc.TAG_TOKU'),
			TAG_TVSHOW     : i18next.t('tag:misc.TAG_TVSHOW'),
			TAG_VIDEOGAME  : i18next.t('tag:misc.TAG_VIDEOGAME'),
			TAG_VN         : i18next.t('tag:misc.TAG_VN'),
			TAG_VOCALOID   : i18next.t('tag:misc.TAG_VOCALOID'),
			TAG_WII        : i18next.t('tag:misc.TAG_WII'),
			TAG_WIIU        : i18next.t('tag:misc.TAG_WIIU'),
			TAG_XBOX360    : i18next.t('tag:misc.TAG_XBOX360'),
			TAG_XBOXONE    : i18next.t('tag:misc.TAG_XBOXONE'),
			TAG_YAOI       : i18next.t('tag:misc.TAG_YAOI'),
			TAG_YURI       : i18next.t('tag:misc.TAG_YURI'),
			TAG_3DS        : i18next.t('tag:misc.TAG_3DS'),
			TAG_CREDITLESS : i18next.t('tag:misc.TAG_CREDITLESS'),
		}
	},
	songwriter: {
		id: 8,
		label: i18next.t('tag:songwriter_label')
	},
	group:{
		id: 9,
		label: i18next.t('tag:group_label')
	}
});

export default tagsMap