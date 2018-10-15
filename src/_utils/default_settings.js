// Karaoke Mugen default configuration file

// this file is overwritten during updates, editing is ill-advised .
// you can change the default settings by using config.ini to bypass the default value .
export const defaults = {
	JwtSecret: 'Change me',
	Database: {
		Host: 'localhost',
		User: 'karaokemugen_server',
		Pass: '',
		Base: 'karaokemugen_server'
	},
	Path: {
		Karas: 'data/karas',
		Lyrics: 'data/lyrics',
		Medias: 'data/medias',
		Series: 'data/series',
		Temp: 'data/temp',
		Inbox: 'data/inbox',
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
		FromMail: 'karaokemugen@localhost',
		To: '',
		ToMail: '',
	}

};

export const configConstraints = {

};
