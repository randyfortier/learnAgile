var socket = io();
var userid = "";

//scrolls the page down to the bottom to show the recent messages
function ScrollPage()
{
	$('html, body').animate({ scrollTop: $(document).height()}, 1000);
}

$(document).ready(function()
{
	//check for username if none, have username error
	if(!username)
		userid = "error";
	else
		userid = username;	
	
	//when the form is submitted, send the message to the server
	$('form').submit(function(){
		socket.emit('chat message',  userid, $('#m').val());
		$('#m').val('');
		return false;
	});

	//when receving anymessage from users, add to the list and scrool the page down
	socket.on('all-message', function(msg){
		$('#messages').append($('<li>').text(msg));
		ScrollPage();
	});

	//when first connection, update the current page with the last 50 messages.
	socket.on('recent-messages', function(recent){
		for(var messagecnt = 49; messagecnt >= 0; cnt--)
			$('#messages').append($('<li>').text(recent[messagecnt].user + ": " + recent[messagecnt].message));
		ScrollPage();
	});
});