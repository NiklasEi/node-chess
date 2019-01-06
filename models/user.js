let bookshelf = require('../bookshelf');

let User = bookshelf.Model.extend({
    tableName: 'user',
});

module.exports = User;