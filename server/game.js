class Game {
    constructor(id) {
        this.id = id;
        this.started = false;
        this.chess = new require('chess.js').Chess();
    };

    set firstStatus(status) {
        this.firstSocket.emit("display status", status);
    }

    set secondStatus(status) {
        this.secondSocket.emit("display status", status);
    }

    submitFirstMove(move) {
        if (move.piece.charAt(0) !== "w") {
            this.firstSocket.emit("move", this.chess.fen());
            return;
        }
        this.submitMove(move);
    }

    submitSecondMove(move) {
        if (move.piece.charAt(0) !== "b") {
            this.secondSocket.emit("move", this.chess.fen());
            return;
        }
        this.submitMove(move);
    }

    submitMove(move) {
        this.chess.move(move);
        this.broadcast("move", this.chess.fen());
        this.checkGameStatus();
    }

    checkGameStatus() {
        if (this.chess.in_checkmate()) {
            this.broadcast("state", "checkmate " + this.chess.turn());
        } else if (this.chess.in_check()) {
            this.broadcast("state", "check " + this.chess.turn());
        } else if (this.chess.in_threefold_repetition()) {
            // ToDo: player can claim draw
            this.broadcast("state", "draw");
        } else {
            if (this.chess.in_draw()) {
                if (this.chess.insufficient_material()) {
                    this.broadcast("state", "draw");
                } else {
                    // 50 moves rule
                    this.broadcast("state", "draw");
                }
            } else if (this.chess.in_stalemate()) {
                this.broadcast("state", "draw");
            } else {
                this.broadcast("state", "none " + this.chess.turn());
            }
        }
    }

    broadcast(channel, msg) {
        if (this.firstSocket) this.firstSocket.emit(channel, msg);
        if (this.secondSocket) this.secondSocket.emit(channel, msg);
    }

    join(socket, id) {
        console.log("joining player ", id, " with socket ", socket.id, " in game ", this.id);
        console.log("first player: ", this.firstPlayer);
        if (!this.firstSocket) {
            this.firstSocket = socket;
            this.firstStatus = "Waiting for second player...";
            this.firstPlayer = id;
        } else if (!this.secondSocket && id !== this.firstPlayer) {
            console.log("is second player");
            this.secondSocket = socket;
            this.secondPlayer = id;
            this.start();
        } else if (id === this.firstPlayer) {
            console.log("relog first player");
            this.firstSocket = socket;
            if (this.started) {
                this.connectFirstPlayer();
            } else {
                this.firstStatus = "Waiting for second player...";
            }
        } else if(id === this.secondPlayer) {
            console.log("relog second player");
            this.secondSocket = socket;
            if (this.started) this.connectSecondPlayer();
        } else {
            socket.emit("display status", "This game is full!");
        }
    }

    connectFirstPlayer() {
        this.firstSocket.on("submit move", this.submitFirstMove.bind(this));
        this.firstSocket.on('disconnect', function(){
            this.secondStatus = "The other player lost connection";
        });
        this.firstSocket.emit("board", "orientation white");
        this.firstSocket.emit("move", this.chess.fen());
        if (this.chess.game_over()) {
            // ToDo: joined finished game
            // can be anything: draw, mate...
        }
    }

    connectSecondPlayer() {
        this.secondSocket.on("submit move", this.submitSecondMove.bind(this));
        this.secondSocket.on('disconnect', function(){
            this.firstStatus = "The other player lost connection";
        });
        this.secondSocket.emit("board", "orientation black");
        this.secondSocket.emit("move", this.chess.fen());
    }

    start() {
        this.connectFirstPlayer();
        this.connectSecondPlayer();
        this.started = true;
    }
}

module.exports = Game;