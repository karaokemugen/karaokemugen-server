import { NuxtConfig as NuxtConfigType } from '@nuxt/types';

import { Config } from '../types/config';
import { sentryDSN } from './constants';

// Karaoke Mugen default configuration file

// this file is overwritten during updates, editing is ill-advised .
// you can change the default settings by using config.yml to bypass the default value .
export const defaults: Config = {
	App: {
		JwtSecret: 'Change me',
		InstanceID: 'Change me',
	},
	System: {
		Database: {
			username: 'karaokemugen_server',
			password: 'musubi',
			host: 'localhost',
			port: 5432,
			database: 'karaokemugen_server',
		},
		Binaries: {
			ffmpeg: {
				Linux: '/usr/bin/ffmpeg',
				Windows: 'ffmpeg.exe',
				OSX: 'ffmpeg'
			},
			git: {
				Linux: '/usr/bin/git',
				Windows: 'C:/Program Files/Git/cmd/git.exe',
				OSX: 'git'
			}
		},
		Repositories: [],
		Path: {
			Temp: 'temp',
			Import: 'inbox',
			Avatars: 'avatars',
			Banners: 'banners',
			Previews: 'previews',
			Hardsubs: 'hardsubs',
		},
		DefaultCollections: ['c7db86a0-ff64-4044-9be4-66dd1ef1d1c1']
	},
	Shortener: {
		Enabled: true,
		ExpireTimeDays: 1
	},
	BaseLicense: {
		Name: null,
		Link: null
	},
	Remote: {
		Enabled: true,
		BaseHost: 'localhost',
		FrontendRoot: '/'
	},
	Frontend: {
		Port: 1350,
		SeriesLanguageMode: 3
	},
	Hardsub: {
		Enabled: true
	},
	Users: {
		Enabled: true,
		BannerBan: []
	},
	Stats: {
		Enabled: true
	},
	API: {
		Secure: true,
		Host: 'localhost',
		Port: 1350
	},
	KaraExplorer: {
		Enabled: true,
		Host: 'localhost',
		Tagline: 'Explore! Find! Sing!',
		LiveURL: 'https://live.karaokes.moe',
		MediaLinks: true,
		Import: true,
		Secure: true,
		InProgressSongsList: null
	},
	Gitlab: {
		IssueTemplate: {
			Import: {
				Title: '[Inbox] $kara',
				Labels: ['To Add'],
				Description: `
A new karaoke has been sent to the Karaoke Mugen team inbox. Please integrate it as soon as possible if it meets the required quality criteria.


The files (.kara, video, .ass and serial if necessary) are present in the following location of your FTP account: kmpublic/inbox


# Karaoke data


**File** : $file


**Author(s)** : $author


**Title** : $title


**Series** : $series


**Type** : $type$order


**Language** : $lang


**Year** : $year


**Singer(s)** : $singer


**Tag(s)** : Misc: $tags - Famillies: $families - Genres: $genres - Platforms: $platforms - Origins: $origins


**Songwriter(s)** : $songwriter


**Creator(s)** : $creator


**Group(s)** : $groups


**Duration** : $duration


**Comment** : $comment`
			},
			Suggestion: {
				Title: '[Suggestion] $serie - $type - $title',
				Labels: ['suggestion'],
				Description: `
# Karaoke suggestion


**Issue author** : $username


**Title** : $title


**Series** : $serie


**Type** : $type


**Link** : $link`
			},
			Edit: {
				Title: '[Correction] $kara',
				Labels: ['To Add'],
				Description: `
A proposal to modify a karaoke has been sent. You will find all the new files in the inbox.


# Karaoke data


**File** : $file


**New subtitle?**: $newSub


**New media?**: $newVideo


**Author(s)** : $author


**Title** : $title


**Series** : $series


**Type** : $type$order


**Language** : $lang


**Year** : $year


**Singer(s)** : $singer


**Tag(s)** : Misc: $tags - Famillies: $families - Genres: $genres - Platforms: $platforms - Origins: $origins


**Songwriter(s)** : $songwriter


**Creator(s)** : $creator


**Group(s)** : $groups


**Duration** : $duration


**Comment** : $comment`
			},
			KaraProblem: {
				Media: {
					Title: '[Media issue] $kara',
					Labels: ['media', 'incident'],
					Description: `
# Media issue


**Issue author** : $username


**Comment** : $comment`
				},
				Metadata: {
					Title: '[Metadata issue] $kara',
					Labels: ['metadata', 'incident'],
					Description: `
# Metadata issue


**Issue author** : $username


**Comment** : $comment`
				},
				Lyrics: {
					Title: '[Lyrics issue] $kara',
					Labels: ['lyrics', 'incident'],
					Description: `
# Lyrics issue


**Issue author** : $username


**Comment** : $comment`
				}
			},
		}
	},
	Mail: {
		Enabled: false
	},
	Online: {
		Stats: false,
		ErrorTracking: true,
	}
};

export const configConstraints = {
	'App.JwtSecret': { presence: {allowEmpty: false}},
	'App.InstanceID': { presence: {allowEmpty: false}},
	'System.Database.username': { presence: {allowEmpty: false}},
	'System.Database.password': { presence: true },
	'System.Database.host': { presence: {allowEmpty: false}},
	'System.Database.database': { presence: {allowEmpty: false}},
	'System.Binaries.ffmpeg': { presence: {allowEmpty: false}},
	'Shortener.ExpireTimeDays': { numericality: { greaterThan: 0 }},
	'Frontend.Port': { numericality: true}
};

export const NuxtConfig: NuxtConfigType = {
	target: 'server',
	modern: 'server',
	dev: false,

	env: {
		LIVE_URL: 'false',
		KM_IMPORT: 'false',
		IN_PROGRESS_SONGS_LIST: '',
		BASE_LICENSE_NAME: '',
		BASE_LICENSE_LINK: '',
		SUPPORTED_LYRICS: 'ass',
		SUPPORTED_MEDIAS: 'mp4',
		API_HOST: '',
		EXPLORER_HOST: ''
	},
	/*
	 ** Nuxt.js dev-modules
	 */
	buildModules: [
		'@nuxt/typescript-build'
	],

	modules: [
		// Doc: https://axios.nuxtjs.org/usage
		'@nuxtjs/axios',
		// Doc: https://nuxt-community.github.io/nuxt-i18n
		'nuxt-i18n',
		// Doc: https://buefy.org/documentation/start
		['nuxt-buefy', { css: false, materialDesignIcons: false }],
		// Doc: https://auth.nuxtjs.org/
		'@nuxtjs/auth',
		// Doc: https://github.com/nuxt-community/modules/tree/master/packages/toast
		'@nuxtjs/toast',
		// Doc: https://github.com/nuxt-community/sentry-module
		'@nuxtjs/sentry',
		// Doc: https://pwa.nuxtjs.org/
		'@nuxtjs/pwa'
	],

	plugins: [
		'~/plugins/icons.js',
		{src: '~/plugins/axios.js', mode: 'client'},
		{src: '~/plugins/collections_memories.js', mode: 'client'}
	],

	head: {
		htmlAttrs: {
			class: ['has-navbar-fixed-top']
		},
		titleTemplate: (titleChunk) => {
			// If undefined or blank then we don't need the hyphen
			return titleChunk ? `${titleChunk} - Karaoke Mugen` : 'Karaoke Mugen';
		},
		meta: [

		]
	},

	axios: {
		baseURL: 'http://localhost:1350',
		https: false
	},

	auth: {
		strategies: {
			local: {
				endpoints: {
					login: { url: '/api/auth/login', method: 'post', propertyName: 'token' },
					user: { url: '/api/myaccount', method: 'get', propertyName: false },
					logout: false
			},
				tokenType: false
			}
		},
		redirect: {
			login: '/#login',
			home: false
		}
	},

	toast: {
		position: 'top-center',
		duration: '2500'
	},

	css: [
		'~/assets/main.scss'
	],

	i18n: {
		vueI18n: {
			fallbackLocale: 'en',
			silentFallbackWarn: true
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
				code: 'de',
				name: 'Deutsch',
				iso: 'de',
				file: 'de.json'
			}
		],
		baseUrl: 'http://localhost:1350/',
		seo: false,
		lazy: true,
		defaultLocale: 'en',
		fallbackLocale: 'en',
		strategy: 'no_prefix',
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'i18n_redirected'
		},
		langDir: 'lang/',
		vuex: false
	},

	sentry: {
		dsn: sentryDSN,
		disabled: false,
		publishRelease: false,
		config: {
			ignoreErrors: [
				'Request aborted',
				'Network Error',
				'document.querySelector(\'video\').webkitPresentationMode',
				'Request failed with status code 403',
				'Request failed with status code 401',
			]
		}
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
		workbox: {
			runtimeCaching: [
				{
					urlPattern: '/previews/.*',
					handler: 'cacheFirst'
				}
			]
		}
	},

	modulesDir: ['../node_modules/'],
	rootDir: '../kmexplorer/',
	// No.
	telemetry: false
};
