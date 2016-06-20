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


app.get('/', function(req, res){
	res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', function(request, response) {
	var username = request.body.username;
	response.render('chat', {username: username});
});

io.on('connection', function(socket){
	socket.emit('set id', "User"+ userid++);

  	socket.on('chat message', function(msg){
    	io.emit('chat message', msg);
  	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});