let socket = io();
let board;
let currentPlayer = "w";
let currentPosition;
let gameOver = false;

/**/

const createGame = document.querySelector('.create-game');
createGame.addEventListener('submit', (e) => {
    e.preventDefault();
    const gameId = createGame.querySelector('.gameId').value;
    post('/createGame', { gameId })
});

function post (path, data) {
    return window.fetch(path, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
}

/**/

let onDragStart = function(source, piece, position, orientation) {
    if (gameOver === true ||
        (piece.indexOf(board.orientation().charAt(0)) === -1) ||
        (currentPlayer !== board.orientation().charAt(0))) {
        return false;
    }
};

let onDrop = function(source, target, piece, newPos, oldPos, orientation) {
    moveObj = {
        from: source,
        to: target,
        piece: piece
    };
    currentPosition = ChessBoard.objToFen(newPos);
    $('#heading').text("Waiting for server");
    socket.emit('submit move', moveObj);
};

let options = {
    pieceTheme: '/assets/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    dropOffBoard: 'trash',
    sparePieces: false,
    onDragStart: onDragStart,
    onDrop: onDrop
};

const container = document.querySelector(`.container`);
const indicator = document.querySelector(`.indicator`);
const blackStatus = document.querySelector(`.black-status`);
const whiteStatus = document.querySelector(`.white-status`);

let width = document.body.clientWidth
    || document.documentElement.clientWidth
    || window.innerWidth;
if (width <= 608) {
    container.style.width = (width - 8) + "px";
}

$(document).ready(function () {
    board = ChessBoard('board', options);
    $(window).resize(board.resize);
    let gameParam = getUrlParameter("game");
    let playerParam = getUrlParameter("player");
    if(gameParam && playerParam) {
        $('#status').text("Connecting to server");
        data = {
            game: gameParam,
            player: playerParam
        };
        socket.emit('join', data);
    } else {
        $('#status').text("No game specified");
    }
});

socket.on('move', function(msg){
    // msg is current FEN
    if (currentPosition !== msg.split(" ")[0]) {
        board.position(msg);
    }
    if (msg.split(" ")[1] !== currentPlayer) {
        currentPlayer = msg.split(" ")[1];
        indicator.src = options.pieceTheme.replace(`{piece}`, currentPlayer + "P");
    }
    if (board.orientation().charAt(0) === currentPlayer) {
        $('#heading').text("Your turn");
    } else {
        $('#heading').text("Others turn");
    }
});

socket.on('display status', function (status) {
    console.log("status update: ", status);
    $('#heading').text(status);
});

socket.on('state', function (status) {
    // reset other status
    if (currentPlayer === "w") {
        blackStatus.innerText = "";
    } else {
        whiteStatus.innerText = "";
    }
    // split on " " possible. second is w or b dep. on whether it is for the white player or the black
    // first word: none, check, checkmate, draw, 50-moves-draw, insufficient-draw (not enough pieces),
    //     stalemate, threefold-repetition
    const split = status.split(" ");
    switch (split[0].toLowerCase()) {
        case "draw", "stalemate", "insufficient-draw", "threefold-repetition":
            blackStatus.innerText = "Draw";
            whiteStatus.innerText = "Draw";
            return;
        case "check":
            if (split[1] === 'w') {
                whiteStatus.innerText = "Check";
            } else if (split[1] === 'b') {
                blackStatus.innerText = "Check";
            }
            return;
        case "checkmate":
            if (split[1] === 'w') {
                whiteStatus.innerText = "Checkmate";
            } else if (split[1] === 'b') {
                blackStatus.innerText = "Checkmate";
            }
            return;
        case "none":
            if (split[1] === 'w') {
                whiteStatus.innerText = "";
            } else if (split[1] === 'b') {
                blackStatus.innerText = "";
            }
            return;
    }
});

socket.on('board', function (func) {
    if (func.indexOf(" ") !== -1) {
        board[func.split(" ")[0]](func.split(" ")[1]);
        return;
    }
    board[func]();
});

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
