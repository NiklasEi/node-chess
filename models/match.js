let bookshelf = require('../bookshelf');

let Match = bookshelf.Model.extend({
    tableName: 'matches',
    idAttribute: 'id'
});

module.exports = Match;