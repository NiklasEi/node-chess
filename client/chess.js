let socket = io();
let board;

$(document).ready(function () {
    board = ChessBoard('board', {
        pieceTheme: '/assets/img/chesspieces/wikipedia/{piece}.png',
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: false,
        onDrop: onDrop
    });

    $('#create').submit(function(){
        socket.emit('create', $('#create').find('input').val());
        $('#create').find('input').val('');
        return false;
    });

    $('#join').submit(function(){
        data = {
            game: $('#game').val(),
            player: $('#player').val()
        };
        socket.emit('join', data);
        return false;
    });

    let gameParam = getUrlParameter("game");
    let playerParam = getUrlParameter("player");
    if(gameParam && playerParam) {
        data = {
            game: gameParam,
            player: playerParam
        };
        socket.emit('join', data);
    }
});

socket.on('move', function(msg){
    board.position(msg);
});

socket.on('display status', function (status) {
    console.log("Status: ", status);
    $('#status').text(status);
});

socket.on('board', function (func) {
    if (func.indexOf(" ") !== -1) {
        board[func.split(" ")[0]](func.split(" ")[1]);
        return;
    }
    board[func]();
});

let onDrop = function(source, target, piece, newPos, oldPos, orientation) {
    moveObj = {
        from: source,
        to: target,
        piece: piece
    };
    socket.emit('submit move', moveObj);
};

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
