export interface Config {
	App: {
		JwtSecret?: string,
		InstanceID?: string,
	},
	Frontend: {
	  	Host: string,
		Port: number,
		SeriesLanguageMode: number
	}
	KaraExplorer: {
		Api: string,
		Port: number,
		Path: string
	},
	Mail: {
		Enabled: boolean,
		Host: string,
		Port: number,
		Secure: boolean,
		Auth: {
			User: string,
			Password: string,
		},
		From: string,
		To: string,
	},
	Import: {
		Template: {
			Title: string,
			Description: string
		},
		Mail: {
			Enabled: boolean,
			To: string,
		},
		Gitlab: {
			Enabled: boolean,
			AccessToken: string,
			URL: string,
			ProjectID: number,
			Labels: string[]
		}
	},
	Shortener: {
		ExpireTimeDays: number
	},
	System: {
		Binaries: {
			ffmpeg: {
				OSX: string,
				Linux: string,
				Windows: string
			}
		},
		Path: {
			Karas?: string[],
			Medias?: string[],
			Lyrics?: string[],
			Series?: string[],
			Temp?: string,
			Previews?: string,
			Avatars?: string,
			Inbox?: string,
			Jingles?: string[],
			Backgrounds?: string[],
			Import?: string
		}
	},
	Database: {
		'sql-file'?: boolean,
		defaultEnv?: string,
		prod: {
			driver?: string,
			host?: string,
			port?: number,
			user?: string,
			password?: string,
			superuser?: string,
			superuserPassword?: string,
			schema?: string,
			database?: string,
			bundledPostgresBinary?: boolean
		}
	}
}

export interface BinariesConfig {
	ffmpeg: string
}
