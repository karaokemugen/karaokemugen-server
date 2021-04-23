import {db} from '../lib/dao/database';
import sql = require('./sqls/settings');

export async function selectSettings() {
	const res = await db().query(sql.selectSettings);
	return res.rows;
}

export async function upsertSetting(setting: string, value: any) {
	return await db().query(sql.upsertSetting, [
		setting,
		value
	]);
}