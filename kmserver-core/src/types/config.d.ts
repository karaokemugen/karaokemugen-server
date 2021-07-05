import { Repository, RepositoryManifest } from '../lib/types/repo';

type RepositoryWithManifest = Repository & RepositoryManifest;

export interface Config {
	App: {
		JwtSecret?: string,
		InstanceID?: string,
	},
	BaseLicense: {
		Name: string
		Link: string
	},
	Remote: {
		Enabled: boolean
		BaseHost: string
		FrontendRoot: string
	},
	Frontend: {
		Port: number
		SeriesLanguageMode: number
	},
	API: {
		Secure: boolean
		Host: string
		Port: number
	},
  	Users: {
		Enabled: boolean
	},
	Stats: {
		Enabled: boolean,
	},
	Shortener: {
		Enabled: boolean
		ExpireTimeDays: number
	},
  	KaraExplorer: {
		Enabled: boolean
		Host: string
		Tagline: string
		LiveURL: string
		MediaLinks: boolean
		Import: boolean
		InProgressSongsList: string
		Secure: boolean
		NuxtOverrides?: any
	},
	Gitlab?: {
		Enabled?: boolean,
		Host?: string,
		Token?: string,
		ProjectID?: number,
		IssueTemplate?: {
			Import?: GitlabTemplate
			Suggestion?: GitlabTemplate
			Edit?: GitlabTemplate
			KaraProblem?: {
				Quality?: GitlabTemplate,
				Time?: GitlabTemplate
			}
		}
	},
	System: {
		Database: {
			host?: string,
			port?: number,
			username?: string,
			password?: string,
			database?: string,
			superuser?: string,
			superuserPassword?: string,
		},
		Binaries: {
			ffmpeg: {
				OSX: string,
				Linux: string,
				Windows: string
			},
			git: {
				OSX: string,
				Linux: string,
				Windows: string
			}
		},
		Repositories: RepositoryWithManifest[]
		Path: {
			Karas?: string,
			Tags?: string,
			Medias?: string,
			Lyrics?: string,
			Temp?: string,
			Previews?: string,
			Avatars?: string,
			Import?: string,
			SessionExports?: string,
			Jingles?: string[],
			Backgrounds?: string[],
			Intros?: string[],
			Outros?: string[],
			Encores?: string[],
			Sponsors?: string[],
			StreamFiles?: string,
		}
	},
	Mail: {
		Enabled: boolean,
		Host?: string,
		Port?: number,
		Secure?: boolean,
		User?: string,
		Password?: string,
		From?: string,
		FromMail?: string
	},
	Online: {
		Stats?: boolean,
		ErrorTracking?: boolean,
	}
}

export interface BinariesConfig {
	ffmpeg: string
	git: string
}

interface GitlabTemplate {
	Description?: string,
	Title?: string,
	Labels?: string[]
}
