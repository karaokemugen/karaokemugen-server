import {resolve} from 'path';
import execa from 'execa';
import { KMXOptions } from '../types/kmx';
import { getState } from '../utils/state';

export async function kmExplorerStart(opt: KMXOptions) {
	await execa('node', [
		'server.js',
		`--api=${opt.api}`,
		`--port=${opt.port}`,
		`--path=${opt.path}`
	], {
		cwd: resolve(getState().appPath, 'kmexplorer/')
	} );
}
