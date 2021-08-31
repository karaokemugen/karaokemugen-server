import {promises as fs} from 'fs';
import {resolve} from 'path';

import { getConfig } from '../lib/utils/config';
import { gitConfig, gitDiff, gitPull } from '../lib/utils/git';
import { getState } from '../utils/state';

export async function getLatestGitCommit(): Promise<string> {
	const commit = await fs.readFile(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir, '.git/refs/heads/master'), 'utf-8');
	return commit.replace('\n', '');
}

export async function updateGit() {
	const repo = getConfig().System.Repositories[0];
	await gitPull(resolve(getState().dataPath, repo.BaseDir));
}

export async function getGitDiff(commit: string): Promise<string> {
	if (!commit.match(/[0-9a-f]{40}/)) throw {code: 400, msg: 'Not a git commit'};
	return gitDiff(commit, 'HEAD', resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
}

export async function initGitRepos() {
	gitConfig(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
}