import {getConfig} from '../_utils/config';
import {Pool} from 'pg';

let database;

export function db() {
	return database;
}

export async function transaction(queries) {
	const client = await database.connect();
	try {
		await client.query('BEGIN');
		for (const query of queries) {
			for (const param of query.params) {
				console.log('Ran query : '+query.sql+' with params '+param.join(','));await client.query(query.sql, param);
			}
		}
		await client.query('COMMIT');
	} catch (e) {
		console.log(e);
		await client.query('ROLLBACK');
	} finally {
		await client.release();
	}
}

export async function initDB() {
	await connectDatabase();
}

export async function connectDatabase() {
	const conf = getConfig();
	const dbConfig = {
		host: conf.Database.Host,
		user: conf.Database.User,
		password: conf.Database.Pass,
		database: conf.Database.Base
	};
	database = new Pool(dbConfig);
	try {
		await database.connect();
		database.on('error', (err, client) => {
			console.log(err);
			console.log(client);
		});
	} catch(err) {
		console.log(err);
		throw err;
	}
}


export async function closeDatabase() {
	return await database.end();
}