import {db} from '../lib/dao/database';
import { ShortURLData } from '../types/shortener';
import { DBInstance } from '../types/database/shortener';
const sql = require('./sqls/shortener');

export async function selectInstance(ip: string): Promise<DBInstance[]> {
	const res = await db().query(sql.getInstance,[ip]);
	return res.rows;
}

export async function upsertInstance(data: ShortURLData) {
	return await db().query(sql.upsertInstance, [
		data.date,
		data.remote_ip,
		data.local_ip,
		data.local_port,
		data.instance_id
	]);
}

export async function cleanupInstances(date: Date) {
	return await db().query(sql.cleanupInstances, [date]);
}