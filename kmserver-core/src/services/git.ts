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
	const latestCommit = await getLatestGitCommit();
	const diff = await gitDiff(commit, latestCommit, resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
	return diff;
}

export async function initGitRepos() {
	gitConfig(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
}