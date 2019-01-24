class Game {
    constructor(match, io) {
        console.log("New game from db: ", match);
        this.io = io;
        this.id = match.id;
        this.firstPlayer = match.playerOne;
        this.secondPlayer = match.playerTwo;
        this.started = !(match.updated_at === match.created_at);
        this.chess = new require('chess.js').Chess(match.fen);
    };

    set firstStatus(status) {
        this.io.sockets.in("w" + this.id).emit("display status", status);
    }

    set secondStatus(status) {
        this.io.sockets.in("b" + this.id).emit("display status", status);
    }

    submitFirstMove(move) {
        if (move.piece.charAt(0) !== "w") {
            this.io.sockets.in("w" + this.id).emit("move", this.chess.fen());
            return;
        }
        this.submitMove(move);
    }

    submitSecondMove(move) {
        if (move.piece.charAt(0) !== "b") {
            this.io.sockets.in("b" + this.id).emit("move", this.chess.fen());
            return;
        }
        this.submitMove(move);
    }

    submitMove(move) {
        const validMove = !!this.chess.move(move);
        if (validMove) this.broadcast("move", this.chess.fen()); // send valid move to all
        else this.io.sockets.in(move.piece.charAt(0) + this.id).emit("move", this.chess.fen()); // only send to group of player that moved
        if(validMove) require('./store').updateMatch(this.id, {fen: this.chess.fen()}).then();
        // ToDo: implement callback "move received" otherwise schedule resend
        this.checkGameStatus();
    }

    checkGameStatus() {
        if (this.chess.in_checkmate()) {
            require('./store').updateMatch(this.id, {finishedAt: new Date()}).then();
            this.broadcast("state", "checkmate " + this.chess.turn());
        } else if (this.chess.in_check()) {
            require('./store').updateMatch(this.id, {finishedAt: new Date()}).then();
            this.broadcast("state", "check " + this.chess.turn());
        } else if (this.chess.in_threefold_repetition()) {
            // ToDo: player can claim draw
            this.broadcast("state", "draw");
        } else {
            if (this.chess.in_draw()) {
                require('./store').updateMatch(this.id, {finishedAt: new Date()}).then();
                if (this.chess.insufficient_material()) {
                    this.broadcast("state", "draw");
                } else {
                    // 50 moves rule
                    this.broadcast("state", "draw");
                }
            } else if (this.chess.in_stalemate()) {
                require('./store').updateMatch(this.id, {finishedAt: new Date()}).then();
                this.broadcast("state", "draw");
            } else {
                this.broadcast("state", "none " + this.chess.turn());
            }
        }
    }

    broadcast(channel, msg) {
        this.io.sockets.in(this.id).emit(channel, msg);
    }

    join(socket, id) {
        console.log("joining player ", id, " with socket ", socket.id, " in game ", this.id);
        console.log("first player: ", this.firstPlayer);
        if (id === this.firstPlayer) {
            console.log("login first player");
            socket.join("w" + this.id);
            socket.emit("board", "orientation white");
            if (!this.started) {
                this.firstStatus = "Waiting for other player...";
            }
        } else if(id === this.secondPlayer) {
            console.log("login second player");
            socket.join("b" + this.id);
            socket.emit("board", "orientation black");
            if (!this.started) {
                this.secondStatus = "Waiting for other player...";
            }
        } else {
            // ToDo: don't allow, if game is not public
            socket.emit("display status", "Watching...");
            return;
        }
        if(!this.started) {
            if(this.io.sockets.in("w" + this.id).clients((error, clients) => {
                    if (error) throw error;
                    return clients.length >= 1;
                }) && this.io.sockets.in("b" + this.id).clients((error, clients) => {
                    if (error) throw error;
                    return clients.length >= 1;
                })) {
                this.broadcast("move", this.chess.fen());
                this.started = true;
                this.checkGameStatus();
            }
        } else {
            socket.emit("move", this.chess.fen());
            this.checkGameStatus();
        }
    }
}

module.exports = Game;