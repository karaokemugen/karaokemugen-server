import {getConfig} from '../_utils/config';
import {Pool} from 'pg';
import langs from 'langs';
import logger from 'winston';
import deburr from 'lodash.deburr';
import { upsertInstance } from './stats';

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
	// Inserting instance data for server
	await upsertInstance({
		version: 'Server',
		instance_id: getConfig().ServerID,
		config: {}
	});
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
		database.on('error', err => {
			logger.error(`[DB] ${err}`);
		});
	} catch(err) {
		logger.error(`[DB] Connection to database server failed : ${err}`);
		throw err;
	}
}

export function langSelector(lang) {
	const userLocale = langs.where('1',lang || getConfig().locale);
	return {main: `'${userLocale['2B']}'`, fallback: '\'eng\''};
}

export function paramWords(filter) {
	let params = {};
	const words = deburr(filter)
		.toLowerCase()
		.replace('\'', '')
		.replace(',', '')
		.split(' ')
		.filter(s => !('' === s))
		.map(word => {
			return `${word}`;
		});
	for (const i in words) {
		params[`word${i}`] = `%${words[i]}%`;
	}
	return params;
}
