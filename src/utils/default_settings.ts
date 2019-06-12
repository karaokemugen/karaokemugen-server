import { bools } from "../lib/utils/constants";

// Karaoke Mugen default configuration file

// this file is overwritten during updates, editing is ill-advised .
// you can change the default settings by using config.ini to bypass the default value .
export const defaults = {
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
		Path: {
			Karas: ['app/data/karas'],
			Lyrics: ['app/data/lyrics'],
			Medias: ['app/data/medias'],
			Series: ['app/data/series'],
			Temp: 'app/temp',
			Inbox: 'app/inbox',
			Avatars: 'app/avatars',
			Previews: 'app/previews',
		}
	},
	Mail: {
		Enabled: false,
		Host: '',
		Port: 25,
		Secure: false,
		Auth: {
			User: '',
			Password: '',
		},
		From: 'KMServer <karaokemugen@localhost.localdomain>',
		To: 'Karaoke Mugen <karaokemugen@localhost.localdomain>',
	},
	Import: {
		Template: {
			Title: undefined,
			Description: undefined
		},
		Mail: {
			Enabled: false,
			To: undefined,
		},
		Gitlab: {
			Enabled: false,
			AccessToken: undefined,
			URL: undefined,
			ProjectID: undefined,
			Labels: []
		}
	},
	Shortener: {
		ExpireTimeDays: 1
	},
	Frontend: {
		Port: 1350,
		Host: 'localhost',
		SeriesLanguageMode: 0
	},
	KaraExplorer: {
		Api: 'http://localhost',
		Port: 1351,
		Path: '/base'
	}
};

export const configConstraints = {
	JwtSecret: { presence: {allowEmpty: false}},
	ServerID: { presence: {allowEmpty: false}},
	'Import.Mail.Enabled': { inclusion: bools },
	'Import.Gitlab.Enabled': { inclusion: bools },
	'Import.Gitlab.Labels': { arrayValidator: true },
	'Database.prod.user': { presence: {allowEmpty: false}},
	'Database.prod.password': { presence: true },
	'Database.prod.host': { presence: {allowEmpty: false}},
	'Database.prod.database': { presence: {allowEmpty: false}},
	'System.Path.Karas': { arrayValidator: true },
	'System.Path.Lyrics': { arrayValidator: true },
	'System.Path.Medias': { arrayValidator: true },
	'System.Path.Series': { arrayValidator: true },
	'System.Path.Temp': { presence: {allowEmpty: false}},
	'System.Path.Inbox': { presence: {allowEmpty: false}},
	'System.Binaries.ffmpeg': { presence: {allowEmpty: false}},
	'Shortener.ExpireTimeDays': { numericality: { greaterThan: 0 }},
	'Mail.Enabled': { inclusion: bools },
	'Mail.Host': { presence: true },
	'Mail.Port': { numericality: { greaterThan: 0 }},
	'Mail.Secure': { inclusion: bools },
	'Mail.Auth.User': { presence: { allowEmpty: true } },
	'Mail.Auth.Password': { presence: { allowEmpty: true } },
	'Mail.From': { presence: true },
	'Mail.To': { presence: true },
	'Frontend.Host': { presence: { allowEmpty: false } },
	'Frontend.Port': { numericality: true}
};
