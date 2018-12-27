class Game {
    constructor(id) {
        this.id = id;
        this.currentTurn = "w";
        this.started = false;
        this.over = false;
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
        let moveReturn = this.chess.move(move);
        let valid = !!moveReturn;
        this.broadcast("move", this.chess.fen());
        if (valid) {
            this.switchTurns();
        }
        this.checkGameStatus();
    }

    checkGameStatus() {
        if (this.chess.in_checkmate()) {
            this.broadcast("state", "checkmate " + this.currentTurn);
        } else if (this.chess.in_check()) {
            this.broadcast("state", "check " + this.currentTurn);
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
                this.broadcast("state", "none " + this.currentTurn);
            }
        }
    }

    broadcast(channel, msg) {
        if (this.firstSocket) this.firstSocket.emit(channel, msg);
        if (this.secondSocket) this.secondSocket.emit(channel, msg);
    }

    switchTurns() {
        switch(this.currentTurn) {
            case "w":
                this.secondStatus = "Your turn";
                this.firstStatus = "Others turn";
                this.currentTurn = "b";
                return;
            case "b":
                this.firstStatus = "Your turn";
                this.secondStatus = "Others turn";
                this.currentTurn = "w";
                return;
        }
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
        this.firstSocket.emit("move", this.chess.fen());
        this.firstSocket.emit("board", "orientation white");
        if (this.currentTurn === "w") {
            this.firstStatus = "Your turn";
        } else {
            this.firstStatus = "Others turn";
        }
        if (this.over) {

        }
    }

    connectSecondPlayer() {
        this.secondSocket.on("submit move", this.submitSecondMove.bind(this));
        this.secondSocket.on('disconnect', function(){
            this.firstStatus = "The other player lost connection";
        });
        this.secondSocket.emit("move", this.chess.fen());
        this.secondSocket.emit("board", "orientation black");
        if (this.currentTurn === "b") {
            this.secondStatus = "Your turn";
        } else {
            this.secondStatus = "Others turn";
        }
    }

    start() {
        this.connectFirstPlayer();
        this.connectSecondPlayer();
        this.started = true;
    }
}

module.exports = Game;