export function up(knex) {
	return Promise.all([
		knex.schema.createTable('kara', t => {
			t.increments('pk_id_kara').unsigned().primary();
			t.uuid('kid').unique();
			t.text('title');
			t.text('year');
			t.integer('songorder');
			t.text('mediafile').notNullable();
			t.text('subfile').notNullable();
			t.text('karafile').notNullable();
			t.integer('duration').unsigned().notNullable().defaultsTo(0);
			t.timestamps(true).notNullable();
		}),
		knex.schema.createTable('serie', t => {
			t.increments('pk_id_seri').unsigned().primary();
			t.text('name').notNullable();
			t.text('aliases').notNullable();
		})
	]);
}

export function down(knex) {
	return knex.schema.dropTable('test');
}