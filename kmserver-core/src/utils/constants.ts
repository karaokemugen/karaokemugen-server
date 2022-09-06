import { JWTTokenWithRoles } from '../lib/types/user';

export const sentryDSN = 'https://df475c5a360e4e028798b51cdb38795c@o399537.ingest.sentry.io/5258229';

export const userAgent = 'KaraokeMugenServer';

export const adminToken: JWTTokenWithRoles = {
	username: 'admin',
	roles: { admin: true },
	iat: new Date().getTime().toString(),
	passwordLastModifiedAt: new Date().getTime().toString()
};
