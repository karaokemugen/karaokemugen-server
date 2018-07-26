import {getConfig} from '../_utils/config';
import {Pool} from 'pg';
import deburr from 'lodash.deburr';
import langs from 'langs';
import logger from 'winston';

let database;

export function db() {
	return database;
}


export function buildClausesSeries(filter) {
	return deburr(filter)
		.toLowerCase()
		.replace('\'', '')
		.replace(',', '')
		.split(' ')
		.filter(s => !('' === s))
		.map(word => {
			return `lower(unaccent(s.name)) LIKE '%${word}%' OR
			lower(unaccent(s.altname)) LIKE '%${word}%' OR
			lower(unaccent(s.i18n::varchar)) LIKE '%${word}%'
			`;
		}
		);
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


export function buildTypeClauses(mode, value) {
	if (mode === 'recent') {
		let date = new Date();
		date.setMonth(date.getMonth()-1);
		return ` AND ak.created_at >= '${date.getFullYear()}-${(date.getMonth()+1)}-${date.getDate()}'`;
	}
	if (mode === 'tag') {
		return ` AND kt.fk_id_tag = ${value}
		AND kt.fk_id_kara = ak.kara_id`;
	}
	if (mode === 'serie') {
		return ` AND ak.serie_id = ${value}`;
	}
	return '';
}

export function buildClauses(filter) {
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