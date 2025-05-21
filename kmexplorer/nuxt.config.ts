import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { load } from 'js-yaml';
import merge from 'lodash/merge';

import type { Config } from '../kmserver-core/src/types/config';
import { defineNuxtConfig } from 'nuxt/config';
import { supportedFiles } from '../kmserver-core/src/lib/utils/constants';
import { sentryDSN } from '../kmserver-core/src/utils/constants';
import { defaults } from '../kmserver-core/src/utils/defaultSettings';

const production = process.env.NODE_ENV === 'production';

let apiUrl = '/';

let properties = {};
if (!production) {
	const file = readFileSync(resolve('../app/config.yml'), 'utf-8');
	const conf = merge(defaults, load(file)) as Config;
	apiUrl = `http${conf.API.Secure ? 's' : ''}://${conf.API.Host}${conf.API.Port ? `:${conf.API.Port}` : ''}/`;
	properties = {
		supportedMedias:
			conf.KaraExplorer.SupportedMedias && conf.KaraExplorer.SupportedMedias?.length > 0
				? conf.KaraExplorer.SupportedMedias
				: ([] as string[]).concat(supportedFiles.video, supportedFiles.audio),
		importEnabled: conf.KaraExplorer.Import,
		inProgressSongsList: conf.KaraExplorer.InProgressSongsList,
		discordLink: conf.KaraExplorer.DiscordURL,
		discourseLink: conf.KaraExplorer.DiscourseURL,
		hardsubUrl: conf.Hardsub.Url ? `${conf.Hardsub.Url}/` : apiUrl,
		host: conf.API.Host,
		explorerProtocol: `http${conf.KaraExplorer.Secure ? 's' : ''}`,
		explorerHost: conf.KaraExplorer.Host,
		explorerTagline: conf.KaraExplorer.Tagline,
		bannerBan: conf.Users.BannerBan,
		usersEnabled: conf.Users.Enabled,
		suggestionsEnabled: conf.Suggestions.Enabled,
		defaultCollections: conf.System.DefaultCollections,
		gitlabEnabled: conf.Gitlab?.Enabled,
		addRepoToModalInMenu: conf.KaraExplorer.AddRepoModalInMenu,
	}
}

const nuxtConfig = defineNuxtConfig({
	dev: !production,

	components: [{ path: '~/components', pathPrefix: false }],

	nitro: {
		preset: 'node',
	},

	runtimeConfig: {
		public: {
			...properties,
			supportedLyrics: supportedFiles.lyrics,
			supportedAudio: supportedFiles.audio,
			apiUrl: apiUrl,
			sentry: {
				disabled: Boolean(process.env.SENTRY_TEST),
				dsn: process.env.SENTRY_DSN || sentryDSN,
				publishRelease: false,
				tracing: {
					tracesSampleRate: 0.5,
					vueOptions: {
						tracing: true,
						tracingOptions: {
							hooks: ['mount', 'update'],
							timeout: 2000,
							trackComponents: true,
						},
					},
					browserOptions: {},
				},
				config: {
					ignoreErrors: [
						'Request aborted',
						'Network Error',
						"document.querySelector('video').webkitPresentationMode",
						'Request failed with status code 403',
						'Request failed with status code 401',
					],
				},
			},
		},
	},
	pwa: {
		manifest: {
			name: 'Karaoke Mugen Explorer',
			lang: 'fr',
			short_name: 'KMExplorer',
			description: 'Explorez la base de données de karaokés!',
			background_color: '#36393f',
			theme_color: '#375a7f',
			display: 'standalone',
			icons: [
				{
					src: 'pwa-64x64.png',
					sizes: '64x64',
					type: 'image/png',
				},
				{
					src: 'pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: 'pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
				{
					src: 'maskable-icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
		},
		workbox: {
			runtimeCaching: [
				{
					urlPattern: '/previews/.*',
					handler: 'CacheFirst',
				},
			],
		},
	},

	build: {
		transpile: [
			'@fortawesome/fontawesome-svg-core',
			'@fortawesome/free-brands-svg-icons',
			'@fortawesome/free-solid-svg-icons',
			'@fortawesome/vue-fontawesome',
		],
	},

	modules: [
		// Doc: https://v8.i18n.nuxtjs.org/getting-started/setup
		'@nuxtjs/i18n',
		// Doc: https://github.com/nuxt-community/sentry-module
		'@pinia/nuxt',
		'pinia-plugin-persistedstate/nuxt',
		'@vite-pwa/nuxt',
		'@nuxt/eslint',
	],

	css: ['assets/main.scss'],

	app: {
		head: {
			htmlAttrs: {
				class: ['has-navbar-fixed-top'],
			},
			link: [{ rel: 'author', href: '/humans.txt' }],
		},
	},

	i18n: {
		vueI18n: 'vue-i18n.config.ts',
		locales: [
			{
				code: 'en',
				name: 'English',
				iso: 'en',
				file: 'en.json',
			},
			{
				code: 'fr',
				name: 'Français',
				iso: 'fr',
				file: 'fr.json',
			},
			{
				code: 'id',
				name: 'bahasa Indonesia',
				iso: 'id',
				file: 'id.json',
			},
			{
				code: 'es',
				name: 'Español',
				iso: 'es',
				file: 'es.json',
			},
			{
				code: 'pt',
				name: 'Português',
				iso: 'pt',
				file: 'pt.json',
			},
			{
				code: 'it',
				name: 'Italiano',
				iso: 'it',
				file: 'it.json',
			},
			{
				code: 'de',
				name: 'Deutsch',
				iso: 'de',
				file: 'de.json',
			},
			{
				code: 'pl',
				name: 'Polski',
				iso: 'pl',
				file: 'pl.json',
			},
			{
				code: 'ta',
				name: 'தமிழ்',
				iso: 'ta',
				file: 'ta.json',
			},
		],
		restructureDir: false,
		baseUrl: apiUrl,
		lazy: true,
		defaultLocale: 'en',
		strategy: 'no_prefix',
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'i18n_redirected',
		},
		langDir: 'lang/',
	},

	typescript: {
		shim: false,
	},

	telemetry: false,

	modulesDir: ['../node_modules/'],
});

export default nuxtConfig;
