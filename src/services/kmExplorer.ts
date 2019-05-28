import { getConfig } from '../utils/config';
import {resolve} from 'path';
import execa from 'execa';

export async function kmExplorerStart(opt) {
	const conf = getConfig();
	await execa('node', [
		'server.js',
		`--api=${opt.api}`,
		`--port=${opt.port}`,
		`--path=${opt.path}`
	], {
		cwd: resolve(conf.appPath, 'kmexplorer/')
	} );
}
