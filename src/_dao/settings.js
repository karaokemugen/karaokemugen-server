import {db} from './database';
const sql = require('./sqls/settings');

export async function selectSettings() {
	return await db().query(sql.selectSettings);
}

export async function upsertSetting(setting, value) {
	return await db().query(sql.upsertSetting, [
		setting,
		value
	]);
}