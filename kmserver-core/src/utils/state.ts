import merge from 'lodash.merge';
import {State} from '../types/state';
import pjson from '../../package.json';

// Internal settings
let state: State = {
	os: process.platform,
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
