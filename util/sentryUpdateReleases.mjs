import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import SentryCli from '@sentry/cli';

const { version } = JSON.parse(await fs.readFile(resolve(findWorkspaceRoot(), 'package.json'), 'utf-8'));

const sentry = new SentryCli(null, {
	authToken: process.env.SENTRYTOKEN,
	org: 'karaoke-mugen'
});

await sentry.releases.new(version, { projects: ['km-server'] });
await sentry.releases.uploadSourceMaps(version, {
	rewrite: false,
	include: [resolve(findWorkspaceRoot(), 'kmserver-core/dist')],
	projects: ['km-server']
});
await sentry.releases.setCommits(version, {
	repo: 'Karaoke Mugen / Code / Karaoke Mugen Server',
	commit: process.env.CI_COMMIT_SHA,
});

if (process.env.CI_COMMIT_TAG) {
	await sentry.releases.newDeploy(version, {
		env: 'release',
	});
}
