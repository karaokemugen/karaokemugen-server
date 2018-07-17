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
	Paths: {
		Downloads: {
			Karas: 'data/karas',
			Lyrics: 'data/lyrics',
			Medias: 'data/medias'
		}
	}

};

export const configConstraints = {

};
