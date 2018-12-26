const express = require('express');
const app = express();
const path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
const Game = require('./game.js');

const games = {};

app.use("/", express.static(path.join(__dirname, '..', 'client')));
app.use("/assets", express.static(path.join(__dirname, '..', 'assets')));

let game;
io.on('connection', function(socket){
    socket.on("create", function (id) {
        console.log("create", id);
        let game = new Game(id);
        games[id] = game;
    });
    socket.on("join", function (form) {
        console.log("Join: ", form);
        if (!games[form.game]) return;
        console.log("Joining...");
        games[form.game].join(socket, form.player);
    });
    console.log('a user connected');
    console.log("url: " + socket.handshake.url);
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});