import {load} from 'js-yaml';
import {readFileSync} from 'fs';
import Postgrator from 'postgrator';
import { Client } from 'pg';

const defaultDB = {
	username: 'karaokemugen_server',
	password: 'musubi',
	host: 'localhost',
	port: 5432,
	database: 'karaokemugen_server'
};

async function migrate() {
	const ymlConfig = readFileSync('../app/config.yml', 'utf-8');
	const conf: any = load(ymlConfig);
	const dbConfig = {
		/*host: conf.System.Database.host,
		user: conf.System.Database.username,
		port: conf.System.Database.port,
		password: conf.System.Database.password,
		database: conf.System.Database.database*/
		...defaultDB,
		...(conf.System.Database || {}),
		user: conf.System.Database?.username || defaultDB.username
	};
	const client = new Client(dbConfig)
	await client.connect()
	const migrator = new Postgrator({
		migrationPattern: 'migrations/*.sql',
		driver: 'pg',
		database: dbConfig.database,
		execQuery: (query) => client.query(query),
		validateChecksums: false,
});
	const migrations = await migrator.migrate();
	migrations.length > 0
		? console.log(`Executed ${migrations.length} migrations`)
		: console.log('No migrations to execute');
	await client.end();
}

migrate().catch(err => console.log(err));
