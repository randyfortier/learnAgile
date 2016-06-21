var express = require('express');
var session = require('express-session');
var uuid = require('node-uuid');
var bodyParser = require("body-parser");
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('port', process.env.PORT || 3000)

app.use(express.static('public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');


//login screen, has a simple input screen
app.get('/', function(request, response){
	response.render('login');
});


//loaded the chat window with the username inputed
app.post('/chat', function(request, response) {
	var username = request.body.username;
	response.render('chat', {username: username});
});

//relays messages for each user to all users
io.on('connection', function(socket){
  	socket.on('chat message', function(msg){
    	io.emit('chat message', msg);
  	});
});


//opens a connection, used this because of Socket.io
http.listen(app.get('port'), function(){
	console.log('listening on *:3000');
});