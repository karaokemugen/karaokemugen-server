// Karaoke Mugen default configuration file

// this file is overwritten during updates, editing is ill-advised .
// you can change the default settings by using config.ini to bypass the default value .
export const defaults = {
	JwtSecret: 'Change me',
	AdminPassword: '',
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
		From: '[KMServer]',
		FromMail: 'karaokemugen@localhost.localdomain',
		To: 'Karaoke Mugen',
		ToMail: 'karaokemugen@localhost.localdomain',
	},
	Shortener: {
		ExpireTimeDays: 1
	},
	KMProxy: {
		Host: 'kara.moe'
	},
	Frontend: {
		Port: 1350
	}
};

const bools = [true, false];

export const configConstraints = {
	JwtSecret: { presence: {allowEmpty: false}},
	AdminPassword: { presence: {allowEmpty: false}},
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
	'Mail.FromMail': { email: true },
	'Mail.ToMail': { email: true },
	'KMProxy.Host': { presence: true},
	'Frontend.Port': { numericality: true}
};
