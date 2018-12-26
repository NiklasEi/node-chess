class Game {
    constructor(id) {
        this.id = id;
        this.currentTurn = "w";
        this.chess = new require('chess.js').Chess();
    };

    set firstStatus(status) {
        this.firstSocket.emit("set status", status);
    }

    set secondStatus(status) {
        this.secondSocket.emit("set status", status);
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
        console.log("Got move: ", move);
        let moveReturn = this.chess.move(move);
        let valid = !!moveReturn;
        console.log("valid? ", valid);
        this.propagateState();
        if (valid) {
            this.switchTurns();
        }
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
        if (!this.firstSocket) {
            this.firstSocket = socket;
            this.firstStatus = "Waiting for second player...";
            this.firstPlayer = id;
        } else if (!this.secondSocket) {
            this.secondSocket = socket;
            this.secondPlayer = id;
            this.start();
        } else if (id === this.firstPlayer) {
            this.firstSocket = socket;
            this.firstSocket.emit("move", this.chess.fen());
        } else if(id === this.secondPlayer) {
            this.secondSocket = socket;
            this.secondSocket.emit("move", this.chess.fen());
        } else {
            socket.emit("set status", "This game is full!");
        }
    }

    propagateState() {
        this.firstSocket.emit("move", this.chess.fen());
        if (this.secondSocket) this.secondSocket.emit("move", this.chess.fen());
    }

    start() {
        this.firstSocket.on("submit move", this.submitFirstMove.bind(this));
        this.secondSocket.on("submit move", this.submitSecondMove.bind(this));

        this.firstSocket.on('disconnect', function(){
            this.secondStatus = "The other player lost connection";
        });

        this.secondSocket.on('disconnect', function(){
            this.firstStatus = "The other player lost connection";
        });

        this.firstSocket.emit("board", "start");
        this.firstStatus = "Your turn";

        this.secondSocket.emit("board", "flip");
        this.secondSocket.emit("board", "start");
        this.secondStatus = "Others turn";
    }
}

module.exports = Game;