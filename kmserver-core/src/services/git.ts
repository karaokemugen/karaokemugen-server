import execa from 'execa';
import {promises as fs} from 'fs';
import {resolve} from 'path';

import { getConfig } from '../lib/utils/config';
import { computeFileChanges } from '../lib/utils/patch';
import { getState } from '../utils/state';

async function gitDiff(commit1: string, commit2: string, gitDir: string): Promise<string> {
	const res = await execa(getState().binPath.git, [
		'diff',
		'-p',
		'--minimal',
		'--no-renames',
		'-U0',
		`${commit1}..${commit2}`,
	], {
		encoding: 'utf8',
		cwd: gitDir
	});
	return res.stdout;
}

async function gitPull(gitDir: string): Promise<string> {
	const res = await execa(getState().binPath.git, ['pull'], {
		encoding: 'utf8',
		cwd: gitDir
	});
	return res.stdout;
}

async function gitConfig(gitDir: string) {
	await execa(getState().binPath.git, ['config', 'diff.renameLimit', '20000'], {
		encoding: 'utf8',
		cwd: gitDir
	});
}

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
	return changes;
}

export async function initGitRepos() {
	
	gitConfig(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
}