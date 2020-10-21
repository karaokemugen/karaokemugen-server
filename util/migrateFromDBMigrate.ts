import {unlinkSync, readFileSync, writeFileSync} from 'fs';
import {safeLoad, safeDump} from 'js-yaml';
import {Client} from 'pg';

async function migrateFromDBMigrate() {
	// Read config

	let jsonConfig: string;
	try {
		jsonConfig = readFileSync('app/database.json', 'utf-8');
	} catch(err) {
		// Nothing to do, quit
		return;
	}
	const oldConfig = JSON.parse(jsonConfig);
	const dbConfig = {
		username: oldConfig.prod.user,
		password: oldConfig.prod.password,
		port: oldConfig.prod.port || 5432,
		host: oldConfig.prod.host,
		database: oldConfig.prod.database
	};
	const ymlConfig = readFileSync('app/config.yml', 'utf-8');
	const newConfig: any = safeLoad(ymlConfig);
	newConfig.System.Database = dbConfig;
	writeFileSync('app/config.yml', safeDump(newConfig), 'utf-8');

	const migrations = [];
	const oldMigrations = readFileSync('util/migrationsBeforePostgrator.csv', 'utf-8').split('\n');
	for (const migration of oldMigrations) {
		const mig = migration.split(' ');
		migrations.push({
			version: +mig[0],
			name: mig[1],
			md5: mig[2]
		});
	}
	// Connect DB
	const db = new Client({
		user: dbConfig.username,
		password: dbConfig.password,
		port: dbConfig.port,
		host: dbConfig.host,
		database: dbConfig.database
	});
	await db.connect();
	// Return early if migrations table does not exist
	let migrationsDone = [];
	const tables = await db.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\' AND tablename = \'migrations\'');
	if (tables.rows.length === 0) return;
	const lastMigration = await db.query('SELECT * FROM migrations ORDER BY id DESC LIMIT 1');
	if (lastMigration.rows.length === 0) {
		// Migration table empty for whatever reason.
		await db.query('DROP TABLE migrations;');
		unlinkSync('app/database.json');
		return;
	}
	const id = lastMigration.rows[0].name.replace('/', '').split('-')[0];
	migrationsDone = migrations.filter(m => m.version <= id);
	await db.query(`CREATE TABLE schemaversion (
		version BIGINT PRIMARY KEY,
		name TEXT,
		md5 TEXT,
		run_at TIMESTAMPTZ
	);
	`);
	for (const migration of migrationsDone) {
		db.query(`INSERT INTO schemaversion VALUES('${migration.version}', '${migration.name}', '${migration.md5}', '${new Date().toISOString()}')`);
	}
	await db.query('DROP TABLE migrations;');
	await db.end();
	unlinkSync('app/database.json');
}

migrateFromDBMigrate().catch(err => console.log(err));