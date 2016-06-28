var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//be able to parse post data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set the port to 3000
app.set('port', process.env.PORT || 3000)

//static files for .css and .js files
app.use(express.static('public'));

// able to access the templates
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');


app.get('/', function(request, response){
    response.render('login');
});

app.post('/lecture', function(request, response){
    var isStudent = request.body.isStudent;
    if(isStudent === "true")
    {
        //return student version
        response.sendFile( __dirname + '/views/studentLecture.html');
    }
    else
    {
        //return teacher version
        response.sendFile( __dirname + '/views/instructorLecture.html');
    }
});

//setup teacher controlling slide 
io.on('connection', function(socket){
    socket.on('instructor-moveslide', function(indexies){
        io.emit('student-moveslide', indexies);
    });
});

//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});