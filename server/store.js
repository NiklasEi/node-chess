const Match = require("../models/match");

module.exports = {
    createMatch: function createMatch (game) {
        console.log("Add game: ", JSON.stringify(game));
        return Match.forge(game).save();
    },
    getRunningMatches: function getRunningMatches (data) {
        return Match.query({where: {playerOne: data.player}, orWhere: {playerTwo: data.player}}).fetchAll();
    },
    updateMatch: function updateMatch(matchID, match) {
        match["updated_at"] = new Date().toISOString();
        return new Match({id: matchID}).save(match, {patch: true})
    }
};