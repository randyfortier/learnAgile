console.log("Run");

var socket = io();
var userid = "";

$(document).ready(function()
{
	if(!username)
		userid = "error";
	else
		userid = username;	
	console.log(userid);

	$('form').submit(function(){
		socket.emit('chat message',  userid + ": " + $('#m').val());
		$('#m').val('');
		return false;
	});

	socket.on('chat message', function(msg){
		$('#messages').append($('<li>').text(msg));
	});

});
console.log("Finish");


