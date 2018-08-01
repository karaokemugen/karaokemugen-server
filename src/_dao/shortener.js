import {db} from './database';
const sql = require('./sqls/shortener');

export async function selectInstance(ip) {
	const res = await db().query(sql.getInstance,[ip]);
	return res.rows;
}

export async function updateInstance(data) {
	return await db().query(sql.updateInstance,[
		data.date,
		data.remote_ip,
		data.local_ip,
		data.local_port,
		data.instance_id
	]);
}

export async function insertInstance(data) {
	return await db().query(sql.insertInstance,[
		data.date,
		data.remote_ip,
		data.local_ip,
		data.local_port,
		data.instance_id
	]);
}