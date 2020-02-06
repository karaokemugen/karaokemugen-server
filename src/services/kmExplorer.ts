import {resolve} from 'path';
import execa from 'execa';
import { KMXOptions } from '../types/kmx';
import { getState } from '../utils/state';
import logger from '../lib/utils/logger';

export async function kmExplorerStart(opt: KMXOptions) {
	try {
		await execa('node', [
			'server.js',
			`--api=${opt.api}`,
			`--port=${opt.port}`,
			`--path=${opt.path}`
		], {
			cwd: resolve(getState().appPath, 'kmexplorer/')
		} );
	} catch(err) {
		logger.error(`[KMExplorer] Unable to launch KM Explorer : ${JSON.stringify(err, null, 2)}`);
	}
}
