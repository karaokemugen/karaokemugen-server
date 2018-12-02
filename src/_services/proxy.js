import { uuidRegexp } from './constants';
import testJSON from 'is-valid-json';
import { check } from '../_utils/validators';
import { asyncWriteFile, detectFileType } from '../_utils/files';
import KMApp from '../_utils/KMApp';
import { removeInstance, getInstance, upsertInstance } from '../_dao/proxy';
import {resolve} from 'path';
import {getConfig} from '../_utils/config';
import {decodeFile} from 'uue';

const instanceConstraints = {
	'config.appInstanceID': {presence: true, format: uuidRegexp},
	config: {presence: {allowEmpty: false}},
	karaDB: {presence: {allowEmpty: false}},
	userDB: {presence: {allowEmpty: false}}
};

export async function spawnInstance(instance) {
	if (!testJSON(instance)) throw 'Syntax error in JSON data';
	const validationErrors = check(instance, instanceConstraints);
	if (validationErrors) throw `Payload is not valid: ${JSON.stringify(validationErrors)}`;
	const userDB = decodeFile(instance.userDB, 'userdata.sqlite3');
	const karaDB = decodeFile(instance.karaDB, 'karas.sqlite3');

	const conf = getConfig();
	const karaDBFile = resolve(conf.appPath, conf.Path.Temp, `karas-${instance.config.appInstanceID}.sqlite3`);
	const userDBFile = resolve(conf.appPath, conf.Path.Temp, `userdata-${instance.config.appInstanceID}.sqlite3`);
	await asyncWriteFile(karaDBFile, karaDB);
	await asyncWriteFile(userDBFile, userDB);
	const karaDBfileType = await detectFileType(karaDBFile);
	const userDBfileType = await detectFileType(userDBFile);
	if (karaDBfileType !== 'sqlite' || userDBfileType !== 'sqlite') throw `One of the databases is not a valid sqlite file : KaraDB is ${karaDBfileType} - UserDB is ${userDBfileType}`;
	// Checks complete
	// Moving files in place
	// If instance is already running, don't try to spawn a new KMApp
	const existingInstance = getInstance(instance.config.appInstanceID);
	if (existingInstance) return {
		id: instance.config.appInstanceID,
		room: existingInstance.room,
		port: existingInstance.port
	};
	const app = new KMApp(instance.config.appInstanceID);
	try {
		let info = await app.setup([
			userDBFile,
			karaDBFile,
		], instance.config);
		info.id = instance.config.appInstanceID;
		const res = {...info};
		info.app = app;
		app.start();
		upsertInstance(info);
		return res;
	} catch(err) {
		throw err;
	}

}

export async function killInstance(id) {
	const instance = getInstance(id);
	if (!instance) throw 'Instance unknown';
	await instance.app.stop();
	removeInstance(id);
}