import merge from 'lodash.merge';
import {State} from '../types/state';

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
	}
};

export function getState() {
	return {...state};
}

export function setState(part: object) {
	state = merge(state, part);
	return getState();
}
