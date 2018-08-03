import {getConfig} from '../_utils/config';
import {Pool} from 'pg';
import langs from 'langs';
import logger from 'winston';

let database;

export function db() {
	return database;
}


export async function transaction(queries) {
	const client = await database.connect();
	try {
		await client.query('BEGIN');
		for (const query of queries) {
			if (Array.isArray(query.params)) {
				for (const param of query.params) {
					await client.query(query.sql, param);
				}
			} else {
				await client.query(query.sql);
			}
		}
		await client.query('COMMIT');
	} catch (e) {
		logger.error(`[DB] Transaction error : ${e}`);
		await client.query('ROLLBACK');
	} finally {
		await client.release();
	}
}

export async function initDB() {
	await connectDB();
}

export async function connectDB() {
	const conf = getConfig();
	const dbConfig = {
		host: conf.Database.host,
		user: conf.Database.user,
		password: conf.Database.password,
		database: conf.Database.database
	};
	database = new Pool(dbConfig);
	try {
		await database.connect();
		database.on('error', (err) => {
			console.log(err);
		});
	} catch(err) {
		console.log(err);
		throw err;
	}
}


export async function closeDB() {
	return await database.end();
}

export function langSelector(lang) {
	const userLocale = langs.where('1',lang || getConfig().EngineDefaultLocale);
	return {main: `'${userLocale['2B']}'`, fallback: '\'eng\''};
}