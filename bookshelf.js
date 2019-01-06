let knex = require('knex')(require('./knexfile'));
knex.migrate.latest();

let bookshelf = require('bookshelf')(knex);

module.exports = bookshelf;