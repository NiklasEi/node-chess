let socket = io();
let board;
let currentPlayer = "w";
let currentPosition;
let gameOver = false;

let gameParam = getUrlParameter("game");
let playerParam = getUrlParameter("player");

const matchHtml = `
    <p id="heading">Loading...</p>
    <div id="board-container" class="hidden">
        <div class="status">
            <span class="white-status"></span>
            <img class="indicator" src="/assets/img/chesspieces/wikipedia/wP.png">
            <span class="black-status"></span>
        </div>
        <div id="board"></div>
    </div>
    <br>
    <button type="button" onclick="changeMatch()">Show match list</button>`;

const matchListHtml = `
    <div class="matches">
    </div>`;

const container = document.querySelector(`.container`);
let indicator;
let blackStatus;
let whiteStatus;
let boardContainer;

function reloadBoardElements() {
    indicator = document.querySelector(`.indicator`);
    blackStatus = document.querySelector(`.black-status`);
    whiteStatus = document.querySelector(`.white-status`);
    boardContainer = document.querySelector(`#board-container`);
}

let onDragStart = function(source, piece, position, orientation) {
    if (gameOver === true ||
        (piece.indexOf(board.orientation().charAt(0)) === -1) ||
        (currentPlayer !== board.orientation().charAt(0))) {
        return false;
    }
};

let onDrop = function(source, target, piece, newPos, oldPos, orientation) {
    const moveObj = {
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

function listMatches() {
    socket.emit('getGames', playerParam, function (matches) {
        console.log(matches);
        const html = matches.map(match => {
            const isFirstPlayer = match.playerOne === playerParam;
            const turn = isFirstPlayer === ("w" === match.fen.split(" ")[1]);
            const round = match.fen.split(" ")[5];
            return `
                <div data-gameid="${match.id}" onclick="clickGame(this);" class="match">
                    <p class="turn">Your turn? ${turn}</p>
                    <p class="round">Round: ${round}</p>
                </div>
            `
        }).join('');
        container.innerHTML = matchListHtml;
        document.querySelector(`.matches`).innerHTML = html;
    });
}

function changeMatch() {
    listMatches();
}

function clickGame(element) {
    const id = element.dataset.gameid;
    if(playerParam) {
        joinGame(id, playerParam);
    } else {
        $('#heading').text("Please use the telegram bot");
    }
}

function joinGame(gameID, player) {
    container.innerHTML = matchHtml;
    reloadBoardElements();
    board = ChessBoard('board', options);
    $(window).resize(board.resize);
    $('#heading').text("Connecting to server...");
    socket.emit('join', { player: player, game: gameID });
}

let width = document.body.clientWidth
    || document.documentElement.clientWidth
    || window.innerWidth;
if (width <= 608) {
    container.style.width = (width - 8) + "px";
}

$(document).ready(function () {
    if(playerParam) {
        $('#heading').text("Connecting to server...");
        let data = {
            player: playerParam
        };
        if (gameParam) {
            joinGame(gameParam, playerParam);
        } else {
            listMatches();
            socket.emit('join', data);
        }
    } else {
        $('#heading').text("Please use the telegram bot");
    }
});

socket.on('move', function(msg){
    if (!board) {
        console.log("server sending move without chosen game");
        return;
    }
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
