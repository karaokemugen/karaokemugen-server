import { JWTTokenWithRoles } from '../lib/types/user.js';
import { RepositoryWithManifest } from '../types/config.js';

export const sentryDSN = 'https://df475c5a360e4e028798b51cdb38795c@o399537.ingest.sentry.io/5258229';

export const userAgent = 'KaraokeMugenServer';

export const adminToken: JWTTokenWithRoles = {
	username: 'admin',
	roles: { admin: true },
	iat: new Date().getTime().toString(),
	passwordLastModifiedAt: new Date().getTime().toString()
};

export const systemRepo: RepositoryWithManifest = {
	Name: 'System',
	Online: false,
	Enabled: true,
	MaintainerMode: false,
	BaseDir: null,
	Path: { Medias: null },
	System: true,
	FullArchiveURL: null,
	SourceArchiveURL: null,
	LatestCommit: null,
	Manifest: null,
	OnUpdateTrigger: null,
}