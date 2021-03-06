exports.up = function(knex, Promise) {
    return knex.schema.createTable('user', function(t) {
        t.integer('id').unsigned().primary();
        t.string('name').notNull();
        t.string('idHash').notNull();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('user');
};