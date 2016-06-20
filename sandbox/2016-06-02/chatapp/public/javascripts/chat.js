console.log("Test run");
var socket = io();
var userid = $('#username').val;

$('form').submit(function(){
	socket.emit('chat message',  userid + ": " + $('#m').val());
	$('#m').val('');
	return false;
});

socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
});