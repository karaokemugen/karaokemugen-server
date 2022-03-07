// DO NOT RUN THIS ON PRODUCTION
// This is used for CI/CD to drop the database contents and start anew.
// DO NOT DO THIS AT HOME.

const configFile = 'app/database.json';
const {safeLoad} = require('js-yaml');
const {Pool} = require('pg');
const {readFileSync} = require('fs');

const config = readFileSync('app/config.yml', 'utf-8');
const conf = safeLoad(config);
const dbConfig = {
	host: conf.System.Database.host,
	user: conf.System.Database.username,
	port: conf.System.Database.port,
	password: conf.System.Database.password,
	database: conf.System.Database.database
};

async function main() {
	const client = new Pool(dbConfig);
	await client.connect();
	const res = await client.query(`
	select 'drop table if exists "' || tablename || '" cascade;' as command
  from pg_tables
 where schemaname = 'public';
 `);
	for (const row of res.rows) {
		console.log(row.command);
		await client.query(row.command);
	}
}

main().then(() => {
	console.log('Database wiped');
	process.exit(0);
}).catch(err => {
	console.log(err);
	process.exit(1);
});
