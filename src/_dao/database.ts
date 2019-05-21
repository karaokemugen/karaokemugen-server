import {getConfig} from '../_utils/config';
import {Pool} from 'pg';
import langs from 'langs';
import logger from 'winston';
import deburr from 'lodash.deburr';
import { upsertInstance } from './stats';
import {from as copyFrom} from 'pg-copy-streams';
import {refreshYears, refreshKaras} from './kara';
import {refreshTags, refreshKaraTags} from './tag';
import {refreshKaraSeriesLang, refreshSeries, refreshKaraSeries} from './series';

let database;

export function db() {
	return database;
}

export async function refreshAll() {
	await Promise.all([
		refreshKaraSeries(),
		refreshKaraTags()
	]);
	await Promise.all([
		refreshKaraSeriesLang(),
		refreshSeries(),
		refreshKaras(),
		refreshYears(),
		refreshTags()
	]);
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

async function queryLog(...args) {
	logger.debug(`[SQL] ${JSON.stringify(args).replace(/\\n/g,'\n').replace(/\\t/g,'   ')}`);
	return database.query_orig(...args);
}

export async function connectDB() {
	const conf = getConfig();
	const dbConfig = {...conf.Database};
	database = new Pool(dbConfig);
	if (conf.optSql) {
		//If SQL logs are enabled, we're going to monkey-patch the query function.
		database.query_orig = database.query;
		database.query = queryLog;
	}
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

export async function copyFromData(table, data) {
	const client = await database.connect();
	let stream = client.query(copyFrom(`COPY ${table} FROM STDIN DELIMITER '|' NULL ''`));
	data = data.map(d => d.join('|')).join('\n');
	stream.write(data);
	stream.end();
	return new Promise((resolve, reject) => {
		stream.on('end', () => {
			client.release();
			resolve();
		});
		stream.on('error', err => {
			client.release();
			reject(err);
		});
	});
}

export function buildTypeClauses(mode, value) {
	if (mode === 'search') {
		let search = '';
		const criterias = value.split('!');
		for (const c of criterias) {
			// Splitting only after the first ":"
			const type = c.split(/:(.+)/)[0];
			let values;
			if (type === 's') {
    			values = c.split(/:(.+)/)[1].split(',').map((v) => `'%${v}%'`);
    			search = `${search} AND sid::varchar LIKE ${values}`;
			} else {
    			values = c.split(/:(.+)/)[1];
			}
			if (type === 'y') search = `${search} AND year IN (${values})`;
			if (type === 't') search = `${search} AND all_tags_id @> ARRAY[${values}]`;
		}
		return search;
	}
	if (mode === 'kid') return ` AND kid = '${value}'`;
	return '';
}

export function buildClauses(words) {
	const params = paramWords(words);
	let sql = [];
	for (const i in words.split(' ').filter(s => !('' === s))) {
		sql.push(`lower(unaccent(ak.tags)) LIKE :word${i} OR
		lower(unaccent(ak.title)) LIKE :word${i} OR
		lower(unaccent(ak.serie)) LIKE :word${i} OR
		lower(unaccent(ak.serie_altname::varchar)) LIKE :word${i} OR
		lower(unaccent(ak.serie_names)) LIKE :word${i}
		`);
	}
	return {
		sql: sql,
		params: params
	};
}
