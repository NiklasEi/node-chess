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
        socket.emit('create', $('#create input').val());
        $('#create input').val('');
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
});

socket.on('move', function(msg){
    board.position(msg);
});

socket.on('set status', function (status) {
    console.log("Status: ", status);
    $('#status').text(status);
});

socket.on('board', function (func) {
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
