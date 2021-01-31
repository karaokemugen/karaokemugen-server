import {safeLoad} from 'js-yaml';
import {readFileSync} from 'fs';
import Postgrator from 'postgrator';

async function migrate() {
	const ymlConfig = readFileSync('../app/config.yml', 'utf-8');
	const conf: any = safeLoad(ymlConfig);
	const migrator = new Postgrator({
		migrationPattern: 'migrations/*.sql',
		host: conf.System.Database.host,
		driver: 'pg',
		username: conf.System.Database.username,
		password: conf.System.Database.password,
		port: conf.System.Database.port,
		database: conf.System.Database.database,
		validateChecksums: false,
});
	const migrations = await migrator.migrate();
	migrations.length > 0
		? console.log(`Executed ${migrations.length} migrations`)
		: console.log('No migrations to execute');
}

migrate().catch(err => console.log(err));
