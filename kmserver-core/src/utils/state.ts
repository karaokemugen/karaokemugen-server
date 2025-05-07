import findWorkspaceRoot from 'find-yarn-workspace-root';
import { readFileSync } from 'fs';
import { merge } from 'lodash';
import { resolve } from 'path';

import { State } from '../types/state.js';

const pjson = JSON.parse(readFileSync(resolve(findWorkspaceRoot(), 'kmserver-core/package.json'), 'utf-8'));

// Internal settings
let state: State = {
	os: process.platform,
	// DBReady has no use yet on KMServer
	DBReady: true,
	opt: {
		generateDB: false,
		reset: false,
		strict: false,
		noMedia: false,
		profiling: false,
		sql: false,
		validate: false,
		debug: false,
		staticServe: false
	},
	version: {
		number: pjson.version,
		name: pjson.name,
		sha: ''
	}
};

export function getState() {
	return {...state};
}

export function setState(part: object) {
	state = merge(state, part);
	return getState();
}
