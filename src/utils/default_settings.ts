import { Config } from "../types/config";

// Karaoke Mugen default configuration file

// this file is overwritten during updates, editing is ill-advised .
// you can change the default settings by using config.ini to bypass the default value .
export const defaults: Config = {
	App: {
		JwtSecret: 'Change me',
		InstanceID: 'Change me',
	},
	Database: {
		'sql-file': true,
		defaultEnv: 'prod',
		prod: {
			driver: 'pg',
			user: 'karaokemugen_server',
			password: 'musubi',
			host: 'localhost',
			port: 5432,
			database: 'karaokemugen_server',
			schema: 'public'
		}
	},
	System: {
		Binaries: {
			ffmpeg: {
				Linux: '/usr/bin/ffmpeg',
				Windows: 'ffmpeg.exe',
				OSX: 'ffmpeg'
			}
		},
		Repositories: [
			{
				Name: 'Local',
				Online: false,
				Path: {
					Karas: ['data/karaokes'],
					Lyrics: ['data/lyrics'],
					Medias: ['data/medias'],
					Series: ['data/series'],
					Tags: ['data/tags']
				}
			}
		],
		Path: {
			Temp: 'temp',
			Import: 'inbox',
			Avatars: 'avatars',
			Previews: 'previews',
		}
	},
	Shortener: {
		Enabled: true,
		ExpireTimeDays: 1
	},
	Frontend: {
		Port: 1350,
		SeriesLanguageMode: 3
	},
	Users: {
		Enabled: true
	},
	Stats: {
		Enabled: true
	},
	Import: {
		Enabled: true,
		Host: 'localhost',
		Path: '/import'
	},
	API: {
		Secure: true,
		Host: 'localhost',
		Port: 1350
	},
	KaraExplorer: {
		Enabled: true,
		Host: 'localhost',
		Port: 1351,
		Path: '/base'
	},
	Gitlab: {
		IssueTemplate: {
			Import: {
				Labels: []
			},
			Suggestion: {
				Description: `
# Suggestion de karaoké


**Titre** : $title


**Série** : $serie


**Type** : $type


**Lien** : $link`,
				Title: "[Suggestion] $serie - $title",
				Labels: ['suggestion']
			},
			Edit: {
				Labels: []
			},
			KaraProblem: {
				Labels: []
			},
		}
	},
	Mail: {
		Enabled: false
	}
};

export const configConstraints = {
	'App.JwtSecret': { presence: {allowEmpty: false}},
	'App.InstanceID': { presence: {allowEmpty: false}},
	'Database.prod.user': { presence: {allowEmpty: false}},
	'Database.prod.password': { presence: true },
	'Database.prod.host': { presence: {allowEmpty: false}},
	'Database.prod.database': { presence: {allowEmpty: false}},
	'System.Binaries.ffmpeg': { presence: {allowEmpty: false}},
	'Shortener.ExpireTimeDays': { numericality: { greaterThan: 0 }},
	'Frontend.Port': { numericality: true}
};
