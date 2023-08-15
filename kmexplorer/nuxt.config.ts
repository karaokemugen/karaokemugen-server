import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { load } from 'js-yaml';
import merge from 'lodash/merge';

import { Config } from 'kmserver-core/src/types/config';
import { defineNuxtConfig } from 'nuxt/config';
import { supportedFiles } from '../kmserver-core/src/lib/utils/constants';
import { sentryDSN } from '../kmserver-core/src/utils/constants';
import { defaults } from '../kmserver-core/src/utils/defaultSettings';

const file = readFileSync(resolve('../app/config.yml'), 'utf-8');
const conf = merge(defaults, load(file)) as Config;

const production = process.env.NODE_ENV === 'production';

const apiUrl = `http${conf.API.Secure ? 's' : ''}://${conf.API.Host}${!conf.API.Port || conf.API.Port === 443 || conf.API.Port === 80 ? '' : `:${conf.API.Port}`}/`;

const nuxtConfig = defineNuxtConfig({

	dev: !production,

	components: [{ path: '~/components', pathPrefix: false }],

	nitro: {
		preset: 'node'
	},

	runtimeConfig: {
		public: {
			KM_IMPORT: conf.KaraExplorer.Import,
			IN_PROGRESS_SONGS_LIST: conf.KaraExplorer.InProgressSongsList,
			DISCORD_LINK: conf.KaraExplorer.DiscordURL,
			DISCOURSE_LINK: conf.KaraExplorer.DiscourseURL,
			BASE_LICENSE_NAME: conf.BaseLicense?.Name,
			BASE_LICENSE_LINK: conf.BaseLicense?.Link,
			SUPPORTED_LYRICS: supportedFiles.lyrics,
			SUPPORTED_MEDIAS:
				conf.KaraExplorer.SupportedMedias && conf.KaraExplorer.SupportedMedias?.length > 0
					? conf.KaraExplorer.SupportedMedias
					: ([] as string[]).concat(supportedFiles.video, supportedFiles.audio),
			API_URL: apiUrl,
			HARDSUB_URL: conf.Hardsub.Url ? `${conf.Hardsub.Url}/` : apiUrl,
			INSTANCE_NAME: conf.API.Host,
			EXPLORER_PROTOCOL: `http${conf.KaraExplorer.Secure ? 's' : ''}`,
			EXPLORER_HOST: conf.KaraExplorer.Host,
			EXPLORER_TAGLINE: conf.KaraExplorer.Tagline,
			BANNER_BAN: conf.Users.BannerBan,
			USERS: conf.Users.Enabled,
			SUGGESTIONS: conf.Suggestions.Enabled,
			DEFAULT_COLLECTIONS: conf.System.DefaultCollections,
			GITLAB: conf.Gitlab?.Enabled,
			ADD_REPO_MODAL_IN_MENU: conf.KaraExplorer.AddRepoModalInMenu,
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
							trackComponents: true
						}
					},
					browserOptions: {}
				},
				config: {
					ignoreErrors: [
						'Request aborted',
						'Network Error',
						'document.querySelector(\'video\').webkitPresentationMode',
						'Request failed with status code 403',
						'Request failed with status code 401'
					]
				}
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
			display: 'standalone'
		},
		icon: {
			maskablePadding: 0
		},
		workbox: {
			enabled: production,
			runtimeCaching: [
				{
					urlPattern: '/previews/.*',
					handler: 'cacheFirst'
				}
			]
		}
	},

	build: {
		transpile: [
			'@fortawesome/fontawesome-svg-core',
			'@fortawesome/free-brands-svg-icons',
			'@fortawesome/free-solid-svg-icons',
			'@fortawesome/vue-fontawesome'
		]
	},

	modules: [
		// Doc: https://v8.i18n.nuxtjs.org/getting-started/setup
		'@nuxtjs/i18n',
		// Doc: https://github.com/nuxt-community/sentry-module
		'@pinia/nuxt',
		'@pinia-plugin-persistedstate/nuxt',
		'@kevinmarrec/nuxt-pwa'
	],

	css: [
		'assets/main.scss'
	],

	app: {
		head: {
			htmlAttrs: {
				class: ['has-navbar-fixed-top']
			},
			meta: [
				{ charset: 'utf-8' },
				{ hid: 'viewport', name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ hid: 'twitter:card', name: 'twitter:card', content: 'summary' },
				{ hid: 'twitter:site', name: 'twitter:site', content: '@KaraokeMugen' },
				{ hid: 'twitter:title', name: 'twitter:title', content: conf.KaraExplorer.Tagline },
				{ hid: 'description', name: 'description', content: conf.KaraExplorer.Tagline },
				{ hid: 'theme-color', name: 'theme-color', content: '#375a7f' },
				{ hid: 'og:title', property: 'og:title', content: conf.KaraExplorer.Host },
				{ hid: 'og:description', property: 'og:description', content: conf.KaraExplorer.Tagline },
				{ hid: 'og:type', property: 'og:type', content: 'website' },
				{ hid: 'og:image', property: 'og:image', content: 'https://gitlab.com/karaokemugen/main/-/raw/master/Resources/banniere/banner-website-2021b.png' },
				{ hid: 'author', name: 'author', content: 'Karaoke Mugen contributors' }
			],
			link: [
				{ rel: 'author', href: '/humans.txt' }
			]
		}
	},

	i18n: {
		vueI18n: {
			fallbackLocale: 'en',
			silentFallbackWarn: true,
			legacy: false
		},
		locales: [
			{
				code: 'en',
				name: 'English',
				iso: 'en',
				file: 'en.json'
			},
			{
				code: 'fr',
				name: 'Français',
				iso: 'fr',
				file: 'fr.json'
			},
			{
				code: 'id',
				name: 'bahasa Indonesia',
				iso: 'id',
				file: 'id.json'
			},
			{
				code: 'pt',
				name: 'Português',
				iso: 'pt',
				file: 'pt.json'
			},
			{
				code: 'de',
				name: 'Deutsch',
				iso: 'de',
				file: 'de.json'
			}
		],
		baseUrl: `http${conf.API.Secure ? 's' : ''}://${conf.API.Host}${!conf.API.Port || conf.API.Port === 443 || conf.API.Port === 80 ? '' : `:${conf.API.Port}`}/`,
		lazy: true,
		defaultLocale: 'en',
		strategy: 'no_prefix',
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'i18n_redirected'
		},
		langDir: 'lang/'
	},

	typescript: {
		shim: false
	},

	telemetry: false,

	modulesDir: ['../node_modules/']
});

export default nuxtConfig;
