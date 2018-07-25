import {getConfig} from '../_utils/config';
import {Pool} from 'pg';
import deburr from 'lodash.deburr';
import langs from 'langs';

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
				await client.query(query.sql, param);
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
	await connectDB();
}

export async function connectDB() {
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


export function buildClauses(filter,source) {
	return deburr(filter)
		.toLowerCase()
		.replace('\'', '')
		.replace(',', '')
		.split(' ')
		.filter(s => !('' === s))
		.map(word => {
			let extraClauses = '';
			return `lower(unaccent(ak.misc)) LIKE '%${word}%' OR
			lower(unaccent(ak.title)) LIKE '%${word}%' OR
			lower(unaccent(ak.author)) LIKE '%${word}%' OR
			lower(unaccent(ak.serie)) LIKE '%${word}%' OR
			lower(unaccent(ak.serie_altname::varchar)) LIKE '%${word}%' OR
			lower(unaccent(ak.singer)) LIKE '%${word}%' OR
			lower(unaccent(ak.songwriter)) LIKE '%${word}%' OR
			lower(unaccent(ak.creator)) LIKE '%${word}%' OR
			lower(unaccent(ak.language)) LIKE '%${word}%'
			${extraClauses}`;
		}
		);
}

export function langSelector(lang) {
	const userLocale = langs.where('1',lang || getConfig().EngineDefaultLocale);
	return {main: `'${userLocale['2B']}'`, fallback: '\'eng\''};
}