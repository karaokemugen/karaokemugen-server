export function up(knex) {
	return knex.schema.createTable('test', t => {
		t.increments('id').unsigned().primary();
	});
}

export function down(knex) {
	return knex.schema.dropTable('test');
}