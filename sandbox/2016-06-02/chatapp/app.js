var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');


//connect to the database
mongoose.connect('localhost:27017/messages');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
	user: String,
	message: String,
	sent: Date,
}, {collection: 'messages'});
var MessageDB = mongoose.model('message', messageSchema);

var userSchema = new Schema({
	username: {type: String,
				unique: true,
				index: true},
	password: String
}, {collection: 'Users'});
var User = mongoose.model('user', userSchema);


//be able to parse post data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set the port to 3000
app.set('port', process.env.PORT || 3000)

//static files for .css and .js files
app.use(express.static('public'));

//able to access the templates
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');


//login screen, has a simple input screen
app.get('/', function(request, response){
	response.render('login');
});

//loaded the chat window with the username inputed
app.post('/chat', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;

	//add username and password
	User.find({username: username}).then(function(results){
		//check results
		if(results > 0){
			//there is a user, check the password, if wrong password send error page
			if(results[0].password !== password)
			{
				//wrong password
				response.render('login', {error : "problem"});
				return;
			}
		}
		else
		{
			//there is no preexisting username, add name then renders the chat page
			var newUser = new User({username: username, password: password});
		}
		//renders the chat page for either when a new user of an existing user with a correct password
		response.render('chat', {username: username});
	});
});

//relays messages for each user to all users
io.on('connection', function(socket){

	console.log("logged in");
  	socket.on('chat message', function(user, msg){
  		//add message to database
  		var newMessage = new MessageDB({user: user, message: msg, sent: new Date()});
  		newMessage.save(function(error){
  			if(error)
  				console.log("Unable to Save Message from: " + user + ". Message: " + msg);
  		});
  		console.log(user + ": " + msg);
  		//emit the message recieved to all users that are connected
    	io.emit('all-message', user + ": " + msg);
  	});

  	//when first connected, send the last 50 messages to the user.
	MessageDB.find({}).sort({sent: -1}).limit(50).then(function(results){
		socket.emit('recent-messages', results);
	});

});


//opens a connection, used this because of Socket.io
http.listen(app.get('port'), function(){
	console.log('listening on *:3000');
});