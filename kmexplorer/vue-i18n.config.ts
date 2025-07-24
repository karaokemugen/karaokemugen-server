import type { VueI18nOptions } from 'vue-i18n';

export default {
	fallbackLocale: {
		br: ['fr'],
		default: ['en'],
	},
	silentFallbackWarn: true,
	legacy: false,
} as VueI18nOptions;
