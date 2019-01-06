const express = require('express');
const app = express();
const path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
const Game = require('./game.js');
const store = require('./store');
const bodyParser = require('body-parser');
const chessServerToken = process.env.CHESS_SERVER_TOKEN;

// parse application/json
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, '..', 'client')));
app.use("/assets", express.static(path.join(__dirname, '..', 'assets')));
app.get('/match/:gameid', function (req, res) {
    res.send(req.params)
});

app.post('/:chessServerToken/newMatch', (req, res) => {
    if(req.params.chessServerToken !== chessServerToken) {
        res.status(401);
        res.send('No permission');
        return;
    }
    store
        .createMatch({
            playerOne: req.body.first_player,
            playerTwo: req.body.second_player
        }).then(game => {
            res.status(200);
            res.send(game);
        });
});

const games = {};
let game;
io.on('connection', function(socket){
    socket.on("join", function (form) {
        console.log("Join: ", form);
        if (!games[form.game]) {
            console.log("create", form.game);
            let game = new Game(form.game);
            games[form.game] = game;
        }
        console.log("Joining...");
        games[form.game].join(socket, form.player);
    });
    console.log('a user connected');
    console.log("url: " + socket.handshake.url);
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});