import { resolve } from 'node:path';

import express, { Express } from 'express';
import fs from 'fs/promises';
import { runCommand } from 'nuxi';

import { handler } from '../../kmexplorer/.output/server/index.mjs';
import { getConfig } from './lib/utils/config.js';
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

export async function updateWebmanifest() {
	const conf = getConfig();
	const pathWebmanifest = resolve(getState().appPath, 'kmexplorer/.output/public/manifest.webmanifest');
	const webmanifest = await fs.readFile(pathWebmanifest, 'utf-8');
	const webmanifestJson = JSON.parse(webmanifest);
	webmanifestJson.name = conf.Frontend.Host;
	webmanifestJson.short_name = conf.Frontend.Host;
	fs.writeFile(pathWebmanifest, JSON.stringify(webmanifestJson), 'utf-8');
}