/*
* Icon's used are for the web here are the links to the direct soruces
* https://image.spreadshirtmedia.com/image-server/v1/designs/11296257,width=178,height=178,version=1320836481/Smiley-Einstein-Icon-3c.png
* https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-heart-128.png
*
*/

var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var uuid = require('node-uuid');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');


//setup server for saving the response data
mongoose.connect('localhost:27017/tagging');
var Schema = mongoose.Schema;


//array for users that are connected
var Users = [];//NOTE: to be replaced by mongoDB table
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


function cleanDB()
{
    UserDB.remove({}, function(err) { 
        console.log('collection removed') 
    });
}


app.get('/lecture', function(request, response){
    //if there is a get request for lecture, redirect to home screen
     //if there is no id in the session data go back to the the login screen
    var session = request.session;
    if(!session.userid)
    {
        response.redirect('/');
        return;
    }

    //have the calls specific lecture slide, add the current lecture slide uuid.v4 number to the session data
    session.lecture = '35e202f2-4b5d-43b3-be1e-926c299c10a7';

    response.sendFile(__dirname + '/views/Lecture.html');
});

app.post('/login', function(request, response){
    var sid = request.body.username;
    var password = request.body.password;
    console.log(sid + ", " + password);

    login(request.session, sid, password, function(){
        response.redirect('/lecture');
    });
});

app.post('/register', function(request, response){
    var sid = request.body.username;
    var password = request.body.password;

    if(sid === "" || password === "")
    {
        response.redirect('/registerform');
        return;
    }

    register(request.session, sid, password, function(){
        response.redirect('/lecture'); 
    });
});

app.get('/registerform', function(request, response){
    response.render('register');
});

app.get('/', function(request, response){
    //check if there already is a userid in the session data
    // checkForID(request.session);
    // cleanDB();
    if(request.session.userid){
        response.redirect('/lecture');
        return;
    }
    //load the login page
    response.render('login');
});

//mongodb login functionality

var userSchema = new Schema({
    userid: {type: String, 
              unique: true,
              index: true},
    sid: {type: String,
        unique: true},
    hashedPassword: String,
    isInstructor: Boolean
}, {collection: 'users'});
var UserDB = mongoose.model('user', userSchema);


function register(session, sid, password, onSuccess, isInstructor) /* fname, lname, */
{
    
    var userid = uuid.v4();
    var hash = bcrypt.hashSync(password);
    console.log(hash);
    var userdata = {
        userid: userid,
        sid: sid,
        hashedPassword: hash,
        isInstructor: isInstructor || false
    };

    var newUser = new UserDB(userdata);

    newUser.save(function(error){
        if(error)
        {
            console.log("Error in Registering, data: " +  userdata);
        }
        else
        {
            console.log("User Added: " + userdata);
            session.userid = userid;
            session.isInstructor = userdata.isInstructor;
            onSuccess();
        }
    });
}

function login(session, sid, password, onSuccess)
{
    UserDB.find({sid: sid}).limit(1).then(function(results){
        if((results.length > 0) && (bcrypt.compareSync(password, results[0].hashedPassword)))
        {
            //successful login, contiune with the login
            session.userid = results[0].userid;
            session.isInstructor = results[0].isInstructor;
        }
        else
        {
            //incorect password
            console.log("Login Attempt: " + sid /*+ " Password: " + password*/);
        }
        onSuccess();
    });
}

function registerInstructor(session, sid, password, onSuccess)
{
    register(session, sid, password, onSuccess, true);
}

//Socket.IO Functionality

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

// //send the tag data the students
// function sendTag(session, tag_data)
// {
//     io.to(session.lecture).emit('student_tag_data', tag_data);
// }

//you lose the tag if you reload the page or load the page after the tag sent
//save the tag data and if the tag is alive send that tag data to the currently 
//loading user
// function isTagAvaiable(session)
// {
//     //if alive send tag data
//     if(LiveTag[session.lecture])
//     {
//         sendTag(session, LiveTag[session.lecture]);
//     }
// }

function removeProperty(object, oldname, newname)
{
    if(object.hasOwnProperty(oldname)){
        object[newname] = object[oldname];
        delete object[oldname];
    }
}

// function removeTag(lecture)
// {
//     delete LiveTag[lecture];
//     io.to(lecture).emit('remove_tag');
// }


//schema for the response from student on the tags
var student_binary_tag_response_schema = new Schema({
    lecture: String,
    studentid: String,
    tag_title: String,
    response: Number
},{collection: 'response'});
var student_binary_ResponseDB = mongoose.model('student_response', student_binary_tag_response_schema);




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

    //setup the functionality of the lecture 
    socket.emit('setup', session.isInstructor);

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
        
        // //recieve tag data
        // socket.on('instructor_tag_data', function(tag_data){
        //     //set the current tag data base on the lecture id
        //     LiveTag[lecture] = tag_data;
        //     sendTag(session, tag_data);
        // });

        // //remove the student's tag
        // socket.on('remove_tag', function(){
        //     removeTag(lecture);
        // });

        //used to get the real time data for the student
        socket.on('get_chart_data', function(request){
            //set a query to look for all data what matches
            // the right lecture, slide number and tag title
            var query = {
                lecture : lecture,
                tag_title : request.tag_title
            };

            //search for the results
            student_binary_ResponseDB.find(query).select({response: 1}).then(function(results){
                //for each returned data piece, sort it into 3 catagories, -1, 0, 1
                // console.log(results);
                var chart_data = {};
                for (var cnt = 0; cnt < results.length; cnt++)
                    chart_data[results[cnt].response] = (chart_data[results[cnt].response] + 1) || 1;
                
                //change the progrety so they repersent the data better
                removeProperty(chart_data, '1', 'understand');
                removeProperty(chart_data, '0', 'dont');
                removeProperty(chart_data, '-1', 'unknown');
                
                //send the data to the instructor
                socket.emit('chart_update', chart_data);
                
            });
        });
    }
    else
    {
        //holds the functionality that is unique to the student

        //check if there is a tag aviable, so to send the tag date to the student
        // isTagAvaiable(session);

        //when the student sends a response to the server, update/add that data to the code
        socket.on('student_response', function(response_data){
            console.log(response_data);
            // return;

            //add to the database
            var title = response_data.title;

            //setup database item
            var newResponse = {
                lecture: lecture,
                studentid: session.userid,
                tag_title: title,
                response: response_data.response
            };
            //setup search item
            var searchQuery = {
                lecture: lecture,
                studentid: session.userid, 
                tag_title: title
            };

            //search to see if there is already an item with the correct id's
            student_binary_ResponseDB.find(searchQuery).limit(1).then(function(results){
                    //if there is already an item update it
                    if(results.length > 0)
                    {
                        //update the current response
                        student_binary_ResponseDB.update(searchQuery, newResponse, {multi: false}, function(error, numAffected){
                            if(error)
                            {
                                console.log("Error in updating " + session.userid + "'s account, response was " + response + ", lecture was " + lecture + ", slide number was " + slide_index);
                            }
                        });
                    }
                    else//if there isn't already an item, add the item to the database
                    {
                        //add a new result
                        var newStudentTag = new student_binary_ResponseDB(newResponse);
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

        // if(session.isInstructor)
        //     removeTag(lecture);

        //check if the user is to be removed
        removeUser(search);
    });
});

//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});