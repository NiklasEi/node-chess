const Match = require("../models/match");

module.exports = {
    createMatch (game) {
        console.log("Add game: ", JSON.stringify(game));
        return Match.forge(game).save();
    }
};