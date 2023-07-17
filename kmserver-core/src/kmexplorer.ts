import { resolve } from 'node:path';

import express, { Express } from 'express';
import { runCommand } from 'nuxi';

import { handler } from '../../kmexplorer/.output/server/index.mjs';
import { getState } from './utils/state.js';

export async function buildKMExplorer() {
	await runCommand('build', ['rootDir', resolve(getState().appPath, 'kmexplorer')]);
}

export async function startKMExplorer(app: Express) {
	if (process.env.NODE_ENV === 'development') {
		return;
	}
	app.use('/', express.static(resolve(getState().appPath, 'kmexplorer/.output/public')));
	app.use(handler);
}
