import { Config } from '../types/config.js';

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
			Dumps: 'dumps',
			Temp: 'temp',
			Import: 'inbox',
			Avatars: 'avatars',
			Banners: 'banners',
			Previews: 'previews',
			Hardsubs: 'hardsubs',
		},
	},
	Remote: {
		Enabled: true,
		BaseHost: 'localhost',
		FrontendRoot: '/',
		FrontendBundlesURL: 'https://mugen.karaokes.moe/frontends',
	},
	Frontend: {
		Port: 1350,
		Secure: true,
		Host: 'localhost',
		Enabled: true,
		Tagline: 'Explore! Find! Sing!',
		Import: {
			Enabled: true,
			LimitedTagTypes: [
				3,
				5,
				7,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				16
			]
		},
		Suggestions: true,
		AddRepoModalInMenu: false
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
	Gitlab: {
		IssueTemplate: {
			Import: {
				Title: '[Inbox] $kara',
				Labels: ['To Add'],
				Description: `
A new karaoke has been sent to the inbox.


# Karaoke data


**Songname** : $songname


**Author(s)** : $author


**Title** : $title


**Versions** : $versions


**Series** : $series


**Franchises** : $franchises


**Type** : $type$order


**Language** : $lang


**Year** : $year


**Parents** : $parents


**Group(s) of singers** : $singergroup


**Singer(s)** : $singer


**Collections** : $collections


**Tag(s)** : Misc: $tags - Video Contents: $families - Genres: $genres - Platforms: $platforms - Origins: $origins - Warnings: $warnings


**Songwriter(s)** : $songwriter


**Creator(s)** : $creator


**Group(s)** : $groups


**Duration** : $duration


**From Display Type** : $fromDisplayType


**Comment** : $comment`
			},
			Suggestion: {
				Title: '[Suggestion] $displaytype - $type - $title',
				Labels: ['suggestion'],
				Description: `
# Karaoke suggestion


**Issue author** : $username


**Title** : $title


**Singer(s)** : $singer


**Series** : $series


**Type** : $type


**Link** : $link`
			},
			Edit: {
				Title: '[Correction] $kara',
				Labels: ['To Add'],
				Description: `
Someone suggested a karaoke edit. You will find all the new files in the inbox.


# Karaoke data


**Songname** : $songname


**New subtitle?**: $newSub


**New media?**: $newVideo


**Author(s)** : $author


**Title** : $title


**Versions** : $versions


**Series** : $series


**Franchises** : $franchises


**Type** : $type$order


**Language** : $lang


**Year** : $year


**Parents** : $parents


**Group(s) of singers** : $singergroup


**Singer(s)** : $singer


**Collections** : $collections


**Tag(s)** : Misc: $tags - Video Contents: $families - Genres: $genres - Platforms: $platforms - Origins: $origins - Warnings: $warnings


**Songwriter(s)** : $songwriter


**Creator(s)** : $creator


**Group(s)** : $groups


**Duration** : $duration


**From Display Type** : $fromDisplayType


**Comment** : $comment`
			},
			KaraProblem: {
				Media: {
					Title: '[Media issue] $kara',
					Labels: ['media', 'incident'],
					Description: `
# Media issue


**Kara URL** : $url


**Issue author** : $username


**Comment** : $comment`
				},
				Metadata: {
					Title: '[Metadata issue] $kara',
					Labels: ['metadata', 'incident'],
					Description: `
# Metadata issue


**Kara URL** : $url


**Issue author** : $username


**Comment** : $comment`
				},
				Lyrics: {
					Title: '[Lyrics issue] $kara',
					Labels: ['lyrics', 'incident'],
					Description: `
# Lyrics issue


**Kara URL** : $url


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
	'Frontend.Port': { numericality: true}
};
