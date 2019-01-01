const knex = require('knex')(require('../knexfile'));

module.exports = {
    createGame ({ gameId }) {
        console.log(`Add game ${gameId}`);
        return knex('games').insert({
            gameId
        })
    }
};