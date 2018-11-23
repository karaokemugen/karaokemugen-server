import { uuidRegexp } from './constants';
import testJSON from 'is-valid-json';
import { check } from '../_utils/validators';
import { detectFileType } from '../_utils/files';
import KMApp from '../_utils/KMApp';
import { removeInstance, getInstance, upsertInstance } from '../_dao/proxy';

const instanceConstraints = {
	'config.appInstanceID': {presence: true, format: uuidRegexp},
	config: {presence: {allowEmpty: false}}
};

export async function spawnInstance(instance, dataFiles) {
	if (!testJSON(instance)) throw 'Syntax error in JSON data';
	const validationErrors = check(instance, instanceConstraints);
	if (validationErrors) throw `Payload is not valid: ${JSON.stringify(validationErrors)}`;
	if (!dataFiles || dataFiles.length !== 2) throw 'Databases missing';
	for (const file of dataFiles) {
		const fileType = await detectFileType(file.path);
		if (fileType !== 'sqlite') throw 'One of the files is not a SQLite database';
	}
	// Checks complete
	// Moving files in place
	const app = new KMApp(instance.config.appInstanceID);
	let info = await app.setup(dataFiles, instance.config);
	info.id = instance.config.appInstanceID;
	info.app = app;
	upsertInstance(info);
	return info;
}

export async function killInstance(id) {
	const instance = getInstance(id);
	if (!instance) throw 'Instance unknown';
	await instance.app.stop();
	removeInstance(id);
}