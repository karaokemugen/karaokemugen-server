<<<<<<< HEAD
import { KaraLineDisplayElement, KaraSortElement } from '../lib/types/config.js';
import { AudioCodec, Repository, RepositoryManifest, VideoColorSpace, VideoContainer } from '../lib/types/repo.js';
=======
import { Repository, RepositoryManifest } from '../lib/types/repo.js';
>>>>>>> 402-be-able-to-disable-creation-of-some-tag-types
import { TagTypeNum } from '../lib/types/tag.js';
import { RepositoryServer } from './repo.js';

type RepositoryWithManifest = Repository & RepositoryManifest & RepositoryServer;

export interface Config {
	App: {
		JwtSecret?: string,
		InstanceID?: string,
		MasterServersUplink?: string[],
	},
	Karaoke?: {
		Collections: any
	},
	Remote: {
		Enabled: boolean
		BaseHost: string
		FrontendRoot: string
		FrontendBundlesURL: string
	},
	Frontend: {
		Port: number,
		Host: string,
		AdminEmail?: string,
		Secure: boolean,
		Enabled: boolean,
		Tagline: string,
		DiscordURL?: string,
		DiscourseURL?: string,
		Import: {
			Enabled: boolean,
			LimitedTagTypes: TagTypeNum[],
			LoginNeeded: boolean,
			MaxPerUser?: number
		},
		Suggestions: boolean,
		InProgressSongsList?: string,
		SupportedMedias?: string[],
		AddRepoModalInMenu: boolean,
		DefaultCollections?: string[],
		Library?: {
			KaraLineDisplay?: KaraLineDisplayElement[];
			KaraLineSort?: KaraSortElement[];
		};
	},
	Hardsub: {
		Enabled: boolean
		Url?: string
		Encoding?: {
			Container?: VideoContainer,
			Video?: {
				Codec?: VideoCodec,
				ColorSpace?: VideoColorSpace,
				Framerate?: number, // Experimental
				MaxResolution?: {
					Height: number,
					Width: number
				}
			},
			Audio?: {
				Codec?: AudioCodec,
				Bitrate?: string,
			}
			AdditionalParameters?: string
		}
	},
	Users: {
		Enabled: boolean,
		BannerBan: string[]
	},
	Stats: {
		Enabled: boolean,
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
			bundledPostgresBinary?: boolean,
			connection?: 'tcp' | 'socket',
			socket?: string,
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
