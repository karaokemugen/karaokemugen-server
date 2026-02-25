import { execa } from 'execa';
import { existsSync, promises as fs } from 'fs';
import { resolve } from 'path';

import { getConfig } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import { fileExists } from '../lib/utils/files.js';
import logger from '../lib/utils/logger.js';
import { computeFileChanges } from '../lib/utils/patch.js';
import sentry from '../utils/sentry.js';
import { getState } from '../utils/state.js';

const service = 'Git';

function isGit(path: string) {
	return fileExists(resolve(path, '.git'));
}

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

async function gitClone(destinationDir: string, gitUrl: string): Promise<string> {
	const res = await execa(getState().binPath.git, ['clone', '--depth', '1', gitUrl, destinationDir], {
		encoding: 'utf8',
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

export async function getLatestGitCommit(repoDir: string, branch = 'master'): Promise<string> {
	try {
		const commit = await fs.readFile(resolve(repoDir, `.git/refs/heads/${branch}`), 'utf-8');
		return commit.replace('\n', '');
	} catch (err) {
		logger.error('Unable to get latest commit', {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('LATEST_COMMIT_ERROR', 500, false);
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
	for (const repo of getConfig().System.Repositories) {
		const repoBaseDirAbsolute = resolve(getState().dataPath, repo.BaseDir);
		// Clone repo if not existent and init
		if (repo.Git?.URL) {
			if (!(await isGit(repoBaseDirAbsolute))) {
				const repoFiles = existsSync(repoBaseDirAbsolute)
					? await fs.readdir(repoBaseDirAbsolute, { recursive: true })
					: [];
				if (repoFiles.length > 4) {
					// Failsafe
					const errormessage = `The repository ${repoBaseDirAbsolute} is not a git repository but contains files or folders. Please empty the folder or clone the repository properly`;
					logger.error(errormessage, { service });
					throw errormessage;
				}
				logger.log(`The repository ${repoBaseDirAbsolute} is empty, attempting to clone from ${repo.Git.URL}`, {
					service,
				});
				if (existsSync(repoBaseDirAbsolute)) await fs.rm(repoBaseDirAbsolute, { recursive: true });
				await gitClone(repoBaseDirAbsolute, repo.Git.URL);
			}
			await gitConfig(repoBaseDirAbsolute);
		}
	}
}
