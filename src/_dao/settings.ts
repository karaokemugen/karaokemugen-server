import {db} from './database';
const sql = require('./sqls/settings');

export async function selectSettings() {
	const res = await db().query(sql.selectSettings);
	return res.rows;
}

export async function upsertSetting(setting, value) {
	return await db().query(sql.upsertSetting, [
		setting,
		value
	]);
}