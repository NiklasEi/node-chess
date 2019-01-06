let bookshelf = require('../bookshelf');

let Match = bookshelf.Model.extend({
    tableName: 'matches',
});

module.exports = Match;