exports.up = function(knex, Promise) {
    return knex.schema.createTable('games', function(t) {
        t.increments('id').unsigned().primary();
        t.timestamps(false, true);
        t.dateTime('finishedAt').nullable().defaultTo(null);
        t.boolean('visible').defaultTo(false);
        t.string('playerOne').nullable();
        t.string('playerTwo').nullable();
        t.string('fen').defaultTo("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('games');
};