import { defineNuxtConfig } from 'nuxt/config';
import { sentryDSN } from '../kmserver-core/src/utils/constants';

const production = process.env.NODE_ENV === 'production';

const nuxtConfig = defineNuxtConfig({
	dev: !production,
	compatibilityDate: '2025-10-04',

	components: [{ path: '~/components', pathPrefix: false }],

	nitro: {
		preset: 'node',
		devProxy: {
            '/api': {
                target: 'http://localhost:1350/api',
                changeOrigin: true
            },
			'/previews': {
                target: 'http://localhost:1350/previews',
                changeOrigin: true
            },
			'/hardsubs': {
                target: 'http://localhost:1350/hardsubs',
                changeOrigin: true
            },
			'/banners': {
                target: 'http://localhost:1350/banners',
                changeOrigin: true
            },
			'/avatars': {
                target: 'http://localhost:1350/avatars',
                changeOrigin: true
            },
			'/downloads': {
                target: 'http://localhost:1350/downloads',
                changeOrigin: true
            }
        }
	},

	runtimeConfig: {
		public: {
			sentry: {
				disabled: process.env.SENTRY_TEST === 'true',
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
		'@sentry/nuxt/module'
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
			{
				code: 'br',
				name: 'Brezhoneg',
				iso: 'br',
				file: 'br.json',
			},
			{
				code: 'ja',
				name: '日本語',
				iso: 'ja',
				file: 'ja.json',
			},
		],
		restructureDir: false,
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
