import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import express, { Express } from 'express';
import { runCommand } from 'nuxi';

import { handler } from '../../../kmexplorer/.output/server/index.mjs';
import { getState } from '../utils/state';

export async function buildKMExplorer() {
	await runCommand('build', ['rootDir', resolve(getState().appPath, 'kmexplorer')]);
}

export async function startKMExplorer(app: Express) {
	if (process.env.NODE_ENV === 'development') {
		return;
	}
	rmSync(resolve(getState().dataPath, '.output/'), { recursive: true, force: true });
	cpSync(resolve(getState().appPath, 'kmexplorer/.output/'), resolve(getState().dataPath, '.output/'), { recursive: true });
	app.use('/_nuxt', express.static(resolve(getState().dataPath, '.output/public/_nuxt')));
	app.use(handler);
}
