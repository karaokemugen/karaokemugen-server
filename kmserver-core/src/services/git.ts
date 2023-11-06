import { execa } from 'execa';
import {promises as fs} from 'fs';
import {resolve} from 'path';

import { getConfig } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import { computeFileChanges } from '../lib/utils/patch.js';
import sentry from '../utils/sentry.js';
import { getState } from '../utils/state.js';

const service = 'Git';

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
	try {
		const commit = await fs.readFile(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir, `.git/refs/heads/${getConfig().System.Repositories[0].Git?.Branch || 'master'}`), 'utf-8');
		return commit.replace('\n', '');
	} catch (err) {
		logger.error('Unable to get latest commit', {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('LATEST_COMMIT_ERROR');
	}
}

export async function updateGit() {
	try {
		const repo = getConfig().System.Repositories.find(r => r.Name !== 'Staging');
		await gitPull(resolve(getState().dataPath, repo.BaseDir));
	} catch (err) {
		logger.error('Unable to pull git repo', {service, obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function getGitDiff(commit: string, fullFiles = false): Promise<string | object> {
	try {
		if (!commit.match(/[0-9a-f]{40}/)) throw {code: 400, message: 'Not a git commit'};
		const diff = await gitDiff(commit, 'HEAD', resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
		if (!fullFiles) return diff;
		// We've been asked for the full files. The fun begins.
		const changes = computeFileChanges(diff);
		for (const i in changes) {
			if (Object.prototype.hasOwnProperty.call(changes, i)) {
				const path = resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir, changes[i].path);
				if (changes[i].type === 'new') changes[i].contents = await fs.readFile(path, 'utf-8');
			}
		}
		return changes;
	} catch (err) {
		logger.error(`Unable to get git diff for commit ${commit}`, {service});
		sentry.error(err);
		throw new ErrorKM('GIT_DIFF_ERROR');
	}
}

export async function initGitRepos() {
	gitConfig(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir));
}
