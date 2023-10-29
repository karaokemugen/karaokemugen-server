import { Repository, RepositoryManifest } from '../lib/types/repo.js';
import { RepositoryServer } from './repo.js';

type RepositoryWithManifest = Repository & RepositoryManifest & RepositoryServer;

export interface Config {
	App: {
		JwtSecret?: string,
		InstanceID?: string,
	},
	BaseLicense?: {
		Name?: string
		Link?: string
	},
	Karaoke?: {
		Collections: any
	},
	Remote: {
		Enabled: boolean
		BaseHost: string
		FrontendRoot: string
	},
	Frontend: {
		Port: number
	},
	API: {
		Secure: boolean
		Host: string
		Port: number
	},
	Hardsub: {
		Enabled: boolean
		Url?: string
	},
  	Users: {
		Enabled: boolean,
		BannerBan: string[]
	},
	Stats: {
		Enabled: boolean,
	},
	Suggestions: {
		Enabled: boolean,
	},
	KaraExplorer: {
		Enabled: boolean
		Host: string
		Tagline: string
		DiscordURL?: string
		DiscourseURL?: string
		MediaLinks: boolean
		Import: boolean
		InProgressSongsList?: string
		Secure: boolean
		SupportedMedias?: string []
		AddRepoModalInMenu: boolean
	},
	Gitlab?: {
		Enabled?: boolean,
		IssueTemplate?: {
			Import?: GitlabTemplate
			Suggestion?: GitlabTemplate
			Edit?: GitlabTemplate
			KaraProblem?: {
				Media?: GitlabTemplate,
				Metadata?: GitlabTemplate,
				Lyrics?: GitlabTemplate
			}
		},
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
			Dumps?: string,
			Hardsubs?: string,
			Temp?: string,
			Previews?: string,
			Avatars?: string,
			Banners?: string,
			Import?: string,
			SessionExports?: string,
			Jingles?: string[],
			Backgrounds?: string[],
			Intros?: string[],
			Outros?: string[],
			Encores?: string[],
			Sponsors?: string[],
			StreamFiles?: string,
		},
		DefaultCollections: string[],
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
