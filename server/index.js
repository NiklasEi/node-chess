const express = require('express');
const app = express();
const path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
const Game = require('./game.js');
const store = require('./store');
const bodyParser = require('body-parser');
const chessServerToken = process.env.CHESS_SERVER_TOKEN;
const crypto = require("crypto");

// parse application/json
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, '..', 'client')));
app.use("/assets", express.static(path.join(__dirname, '..', 'assets')));
app.get('/match/:gameid', function (req, res) {
    res.send(req.params)
});

/*
   API
*/

// newMatch
app.post('/:chessServerToken/newMatch', (req, res) => {
    if(req.params.chessServerToken !== chessServerToken) {
        console.log("Wrong token (newMatch)");
        res.status(401);
        res.send('No permission');
        return;
    }
    store
        .createMatch({
            playerOne: getHash(req.body.first_player),
            playerTwo: getHash(req.body.second_player)
        }).then(game => {
            res.status(200);
            res.send(game);
        });
});

// getMatch
app.post('/:chessServerToken/getRunningMatches', (req, res) => {
    if(req.params.chessServerToken !== chessServerToken) {
        console.log("Wrong token (getRunningMatches)");
        res.status(401);
        res.send('No permission');
        return;
    }
    store
        .getRunningMatches({
            player: req.body.first_player ? req.body.first_player : req.body.second_player
        }).then(matches => {
        res.status(200);
        res.send(game);
    });
});

let games = {};
io.on('connection', function(socket){
    socket.on("join", function (form) {
        console.log("Join: ", form);
        if (!form.game) {
            console.log("no game specified");
            return;
        }
        if (!games[form.game]) {
            console.log("grab game from db: ", form);
            require("../models/match").query("where", "id", "=", form.game).fetch().then(match => {
                games[form.game] = new Game(match);
                joinGame(socket, form.game, form.player);
            });
        } else {
            joinGame(socket, form.game, form.player);
        }
    });

    socket.on("getGames", function (player, callback) {
        store
            .getRunningMatches({
                player: player
            }).then(matches => callback(matches));
    });

    console.log('a user connected');
    console.log("url: " + socket.handshake.url);
});

function joinGame(socket, gameID, playerID) {
    console.log("Joining...");
    let game = games[gameID];
    if (game) game.join(socket, playerID);
}

http.listen(3000, function(){
    console.log('listening on *:3000');
    console.log('Current token: ', chessServerToken);
});

function getHash(id) {
    return crypto.createHash('sha256')
        .update(id.toString())
        .digest('hex');
}