import {promises as fs} from 'fs';
import {resolve} from 'path';

import { getConfig } from '../lib/utils/config';
import { gitConfig, gitDiff, gitPull } from '../lib/utils/git';
import { computeFileChanges } from '../lib/utils/patch';
import { getState } from '../utils/state';

export async function getLatestGitCommit(): Promise<string> {
	const commit = await fs.readFile(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir, '.git/refs/heads/master'), 'utf-8');
	return commit.replace('\n', '');
}

export async function updateGit() {
	const repo = getConfig().System.Repositories[0];
	await gitPull(resolve(getState().dataPath, repo.BaseDir));
}

export async function getGitDiff(commit: string, fullFiles = false): Promise<string|object> {
	if (!commit.match(/[0-9a-f]{40}/)) throw {code: 400, msg: 'Not a git commit'};
	const diff = await gitDiff(commit, 'HEAD', resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
	if (!fullFiles) return diff;
	// We've been asked for the full files. The fun begins.
	const changes = computeFileChanges(diff);
	for (const i in changes) {
		const path = resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir, changes[i].path);
		if (changes[i].type === 'new') changes[i].contents = await fs.readFile(path, 'utf-8');
	}
}

export async function initGitRepos() {
	gitConfig(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
}