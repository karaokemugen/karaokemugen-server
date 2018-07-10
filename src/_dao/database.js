import {getConfig} from '../_utils/config';
import knex from 'knex';
import {join} from 'path';
import logger from 'winston';

let database;

export function db() {
	return database;
}

export async function initDB() {
	connectDatabase();
	await migration();
}

export async function migration() {
	const mConfig = {
		directory: join(__dirname,'migrations'),
		tableName: 'migrations'
	};
	let version = await database.migrate.currentVersion(mConfig);
	logger.debug(`[DB] Database version : ${version}`);
	await database.migrate.latest(mConfig);
	version = await database.migrate.currentVersion(mConfig);
	logger.debug(`[DB] Migrated to version : ${version}`);

}

export function connectDatabase() {
	const conf = getConfig();
	const dbConfig = {
		client: 'pg',
		connection: {
			host: conf.DBHost,
			user: conf.DBUser,
			password: conf.DBPass,
			database: conf.DBBase
		},
		migrations: {
			tableName: 'migrations'
		}
	};
	try {
		database = knex(dbConfig);
	} catch(err) {
		console.log(err);
		throw err;
	}
}