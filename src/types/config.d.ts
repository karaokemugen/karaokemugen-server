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
	Gitlab?: {
		Enabled?: boolean,
		Host?: string,
		Token?: string,
		ProjectID?: number,
		IssueTemplate?: {
			Import?: GitlabTemplate
			Suggestion?: GitlabTemplate
		}
	}
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
			Import?: string,
			Jingles?: string[],
			Backgrounds?: string[]
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

interface GitlabTemplate {
	Description?: string,
	Title?: string,
	Labels?: string[]
}