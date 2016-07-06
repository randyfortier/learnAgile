var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var uuid = require('node-uuid');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

//setup server for saving the response data
mongoose.connect('localhost:27017/tagging');
var Schema = mongoose.Schema;

//schema for the response from student on the tags
var student_response_schema = new Schema({
    lecture: String,
    studentid: String,
    tag_title: String,
    slide_index: String,
    response: Number
},{collection: 'response'});
var studentDB = mongoose.model('student_response', student_response_schema);

//array for users that are connected
var Users = []
var LiveTag = {};

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


//taken from randy's example
var sessionMiddleware = session({
    genid: function(request) {
        return uuid.v4();
    },
    resave: false,             // save only when changed
    saveUninitialized: false,  // save even when no data
    // this is used when signing the session cookie
    //cookie: { secure: true; }, // encrypted cookies only
    secret: 'apollo slackware prepositional expectations'
});

//use the session data that is above
app.use(sessionMiddleware);

//check if the users already has a session, if so then do nothing, else 
//give them a unique code
function checkForID(session)
{
    if(!session.userid)
    {
        session.userid = uuid.v4();
    }
}

app.get('/lecture', function(request, response){
    //if there is no id in the session data go back to the the login screen
    response.redirect('/');
});


app.get('/', function(request, response){
    //check if there already is a userid in the session data
    checkForID(request.session);

    //load the login page
    response.render('login');
});


app.post('/lecture', function(request, response){
    //if there is no id in the session data go back to the the login screen
    var session = request.session;
    if(!session.userid)
    {
        response.redirect('/');
        return;
    }

    session.isInstructor = (request.body.isStudent === "true")? false: true;

    //have the calls specific lecture slide, add the current lecture slide uuid.v4 number to the session data
    session.lecture = '35e202f2-4b5d-43b3-be1e-926c299c10a7';

    //check if the request is for a instructor or student
    if(!session.isInstructor)
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


//this is used to give socket.io access to the session data,
//i don't know if this is the best practice, but it works, if it isn't 
//the best practice, i will change it to the best practice.
io.use(function(socket, next){
    sessionMiddleware(socket.request, socket.request.res, next);
});

//check if the user is in the Users array if not then add them
function addToUsers(session, search)
{
    //find if the users already exists
    var user = Users.find(search);

    //if users doesn't exist in the array already, add them
    if(!user){
        Users.push({id: session.userid, count: 1});
        return Users[Users.length - 1];
    }
    else //else increase the number connection they have
    {
        user.count++;
        return user;
    }
}

//remove a user from the Users array, use the "search" function to find and remove them
function removeUser(search)
{
    //find the user, and decrease the number of connection they have
    user = Users.find(search);
    user.count--;
    //if this is the last connection for that user, then remove them from the list
    if(user.count === 0)
        Users.splice(Users.indexOf(Users.find(search)), 1);
}

//send the tag data the students
function sendTag(session, tag_data)
{
    io.to(session.lecture).emit('student_tag_data', tag_data);
}

//you lose the tag if you reload the page or load the page after the tag sent
//save the tag data and if the tag is alive send that tag data to the currently 
//loading user
function isTagAvaiable(session)
{
    //if alive send tag data
    if(LiveTag[session.lecture])
    {
        sendTag(session, LiveTag[session.lecture]);
    }
}

function removeProperty(object, oldname, newname)
{
    if(object.hasOwnProperty(oldname)){
        object[newname] = object[oldname];
        delete object[oldname];
    }
}

function removeTag(lecture)
{
    delete LiveTag[lecture];
    io.to(lecture).emit('remove_tag');
}


//setup teacher controlling slide 
io.on('connection', function(socket){
    var session = socket.request.session;
    var lecture = session.lecture;
    //if there is no userid then don't allow any functionality
    if(!session.userid)
        return;
    
    //function for searching for the connected user in the Users array
    var search = function (index){
        return index.id === session.userid;
    };

    //add to Users
    addToUsers(session, search);

    //send user to right room
    // in this room it is easier to send a message to all students
    socket.join(lecture);/*can have a function call back for any error*/

    //use this so the functionality of the instructor is only accessable to the instructor
    /*NOTE: used isInstructor because if it was the oppsite the else statement would be for
    * the instructor and if there was no isStudent in the session data it would treat the user
    * an instructor.
    */
    if(session.isInstructor)
    {
        //hold the functionality of the instructor head
        //if the instructor move there slide, the send a siginal to the student to have
        //there slide move
        socket.on('instructor-moveslide', function(indexies){
            io.to(session.lecture).emit('student-moveslide', indexies);
        });
        
        //recieve tag data
        socket.on('instructor_tag_data', function(tag_data){
            LiveTag[session.lecture];
            sendTag(session, tag_data);
        });

        //remove the student's tag
        socket.on('remove_tag', function(){
            removeTag(lecture);
        });

        //used to get the real time data for the student
        socket.on('get_chart_data', function(request){
            //set a query to look for all data what matches
            // the right lecture, slide number and tag title
            var query = {
                lecture : lecture,
                slide_index : request.slide_index,
                tag_title : request.tag_title
            };

            //search for the results
            studentDB.find(query).select({response: 1}).then(function(results){
                //for each returned data piece, sort it into 3 catagories, -1, 0, 1
                var chart_data = {};
                for (var cnt = 0; cnt < results.length; cnt++)
                    chart_data[results[cnt].response] = (chart_data[results[cnt].response] + 1) || 1;
                
                //change the progrety so they repersent the data better
                removeProperty(chart_data, '1', 'understand')
                removeProperty(chart_data, '0', 'dont')
                removeProperty(chart_data, '-1', 'unknown')
                
                //send the data to the instructor
                socket.emit('chart_update', chart_data);
                //step 11, spit out the data to the Console
                console.log(chart_data);
            });
        });
    }
    else
    {
        //holds the functionality that is unique to the student

        //check if there is a tag aviable, so to send the tag date to the student
        isTagAvaiable(session);

        //when the student sends a response to the server, update/add that data to the code
        socket.on('student_response', function(response_data){
            //add to the database
            var title = response_data.title;
            var slide_index = response_data.index;
            
            //setup database item
            var newResponse = {
                lecture: lecture,
                studentid: session.userid,
                tag_title: title,
                slide_index: slide_index,
                response: response_data.response
            };
            //setup search item
            var searchQuery = {
                lecture: lecture,
                studentid: session.userid, 
                tag_title: title, 
                slide_index: slide_index
            };

            //search to see if there is already an item with the correct id's
            studentDB.find(searchQuery).limit(1).then(function(results){
                    //if there is already an item update it
                    if(results.length > 0)
                    {
                        //update the current response
                        studentDB.update(searchQuery, newResponse, {multi: false}, function(error, numAffected){
                            if(error)
                            {
                                console.log("Error in updating " + session.userid + "'s account, response was " + response + ", lecture was " + lecture + ", slide number was " + slide_index);
                            }
                        });
                    }
                    else//if there isn't already an item, add the item to the database
                    {
                        //add a new result
                        var newStudentTag = new studentDB(newResponse);
                        newStudentTag.save(function(error){
                            if(error)
                            {
                                console.log("Error in adding " + session.userid + "'s account, response was " + response + ", lecture was " + lecture + ", slide number was " + slide_index);
                            }
                        });
                    }
                });
        });
    }

    //when disconnecting for the server, check if the user can be removed
    socket.on('disconnect', function(){
        //remove the user for the room
        socket.leave(session.lecture);

        if(session.isInstructor)
            removeTag(lecture);

        //check if the user is to be removed
        removeUser(search);
    });
});

//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});