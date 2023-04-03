import {db} from '../lib/dao/database.js';
import * as sql from './sqls/settings.js';

export async function selectSettings() {
	const res = await db().query(sql.selectSettings);
	return res.rows;
}

export async function upsertSetting(setting: string, value: any) {
	return db().query(sql.upsertSetting, [
		setting,
		value
	]);
}
