// Karaoke Mugen default configuration file

// this file is overwritten during updates, editing is ill-advised .
// you can change the default settings by using config.ini to bypass the default value .
export const defaults = {
	JwtSecret: 'Change me',
	ServerID: 'Change me',
	Database: {
		Host: 'localhost',
		User: 'karaokemugen_server',
		Pass: '',
		Base: 'karaokemugen_server'
	},
	Path: {
		Karas: 'app/data/karas',
		Lyrics: 'app/data/lyrics',
		Medias: 'app/data/medias',
		Series: 'app/data/series',
		Temp: 'app/temp',
		Inbox: 'app/inbox',
		Avatars: 'app/avatars',
		Previews: 'app/previews',
		KaraokeMugenApp: 'karaokemugen-app/',
		Bin: {
			ffmpeg: '/usr/bin/ffmpeg'
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
		Host: 'localhost'
	},
	KaraExplorer: {
		Port: 1351,
		Path: '/base'
	}
};

const bools = [true, false];

export const configConstraints = {
	JwtSecret: { presence: {allowEmpty: false}},
	ServerID: { presence: {allowEmpty: false}},
	'Import.Mail.Enabled': { inclusion: bools },
	'Import.Gitlab.Enabled': { inclusion: bools },
	'Import.Gitlab.Labels': { arrayValidator: true },
	'Database.User': { presence: {allowEmpty: false}},
	'Database.Pass': { presence: true },
	'Database.Host': { presence: {allowEmpty: false}},
	'Database.Base': { presence: {allowEmpty: false}},
	'Path.Karas': { presence: {allowEmpty: false}},
	'Path.Lyrics': { presence: {allowEmpty: false}},
	'Path.Medias': { presence: {allowEmpty: false}},
	'Path.Series': { presence: {allowEmpty: false}},
	'Path.Temp': { presence: {allowEmpty: false}},
	'Path.Inbox': { presence: {allowEmpty: false}},
	'Path.KaraokeMugenApp': { presence: {allowEmpty: false}},
	'Path.Bin.ffmpeg': { presence: {allowEmpty: false}},
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
