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

//added to erase the database when needed
function cleanDB()
{
    UserDB.remove({}, function(err) { 
        console.log('collection removed') 
    });
    student_binary_ResponseDB.remove({}, function(err) { 
        console.log('collection removed') 
    });
}

//show that your are logged in, can be changed to redirect another site
app.get('/loggedin', function(request, response){
    if(!request.session.userid){
        response.redirect('/');
    }
    response.render('loggedin', {username: request.session.sid});
});

app.post('/login', function(request, response){
    //get the sid and password
    var sid = request.body.username;
    var password = request.body.password;

    //check if they can login and send the to the loggedin screen
    login(request.session, sid, password, function(){
        response.redirect('/loggedin');
    }, function(){
        response.redirect('/'); 
    });
});

app.post('/register', function(request, response){
    //get the sid and password for the request
    var sid = request.body.username;
    var password = request.body.password;

    //if the password and sid are empty the redirect to the regster page
    if(sid === "" || password === "")
    {
        response.redirect('/registerform');
        return;
    }

    //possible add in a match of sid to a database of sids

    //register the sid and password and redirect to login on success
    register(request.session, sid, password, function(){
        response.redirect('/loggedin'); 
    }, function(){
        response.redirect('/registerform'); 
    });
});

app.get('/registerform', function(request, response){
    //render the register page
    response.render('register');
});

app.get('/', function(request, response){
    // //load the login page
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


function register(session, sid, password, onSuccess, onFail, isInstructor) /* fname, lname, */
{
    UserDB.find({sid: sid}).limit(1).then(function(results){
        if(results.length > 0)
        {
            //if there is already a user with the sid regestered
            onFail();
        }
        else
        {
            //generate a uuid for the user and has the password
            var userid = uuid.v4();
            var hash = bcrypt.hashSync(password);

            //setup the record for saving the new user
            var userdata = {
                userid: userid,
                sid: sid,
                hashedPassword: hash,
                isInstructor: isInstructor || false
            };           

            //declare a new user and save the user
            var newUser = new UserDB(userdata);
            newUser.save(function(error){
                if(error)
                {
                    //if the ere is a error, log it and call the onFail method
                    console.log("Error in Registering, data: " +  userdata);
                    onFail();
                }
                else
                {
                    //if succefully added, log the username
                    console.log("User Added: " + userdata);

                    //set user the session variables and call onSuccess()
                    session.userid = userid;
                    session.isInstructor = userdata.isInstructor;
                    session.sid = sid;
                    onSuccess();
                }
            });
        }
    });
}

function login(session, sid, password, onSuccess, onFail)
{
    //check of there is user with the sid that was submitted
    UserDB.find({sid: sid}).limit(1).then(function(results){
        if((results.length > 0) && (bcrypt.compareSync(password, results[0].hashedPassword)))
        {
            //successful login, contiune with the login
            session.userid = results[0].userid;
            session.isInstructor = results[0].isInstructor;
            session.sid = results[0].sid;
            onSuccess();
        }
        else
        {
            //incorect password call the on fall method
            console.log("Login Attempt: " + sid /*+ " Password: " + password*/);
            onFail();
        }
    });
}

//when registering a instructor
function registerInstructor(session, sid, password, onSuccess, onFail)
{
    //sed the isInstrctor to true
    register(session, sid, password, onSuccess, onFail, true);
}

//Socket.IO Functionality

//this is used to give socket.io access to the session data,
//i don't know if this is the best practice, but it works, if it isn't 
//the best practice, i will change it to the best practice.
io.use(function(socket, next){
    sessionMiddleware(socket.request, socket.request.res, next);
});

//change the name of a property in an object
function renameProperty(object, oldname, newname)
{
    //change the property only if it exits
    if(object.hasOwnProperty(oldname)){
        //the the value to the newname and remove the old name
        object[newname] = object[oldname];
        delete object[oldname];
    }
}

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
    //if there is no userid then don't allow any functionality
    if(!session.userid)
        return;
    //set up the server connection, by having the lecture id sent to the server
    socket.on('server_setup', function(lecture){
        //send user to right room
        // in this room it is easier to send a message to all students
        socket.join(lecture);/*can have a function call back for any error*/

        //setup the functionality of the lecture 
        socket.emit('client_setup', session.isInstructor);

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
                    var chart_data = {};
                    for (var cnt = 0; cnt < results.length; cnt++)
                        chart_data[results[cnt].response] = (chart_data[results[cnt].response] + 1) || 1;
                    
                    //change the progrety so they repersent the data better
                    renameProperty(chart_data, '1', 'understand');
                    renameProperty(chart_data, '0', 'dont');
                    renameProperty(chart_data, '-1', 'unknown');
                    
                    //wrap the chart data in the request that was send
                    request.data = chart_data;
                    //send the data to the instructor
                    socket.emit('chart_update', request);
                    
                });
            });
        }
        else
        {
            //holds the functionality that is unique to the student

            //when the student sends a response to the server, update/add that data to the code
            socket.on('student_response', function(response_data){
                
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
                        // update the current response
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
            
            //called when the user check for the status of there current tag
            socket.on('check_binary_tag_status', function(title){
                //set up the database query
                var searchQuery = {
                    lecture: lecture,
                    studentid: session.userid,
                    tag_title: title
                };
                //check if ther exsits a response for a tag from the specific user
                student_binary_ResponseDB.find(searchQuery).select({response: 1}).limit(1).then(function(results){
                    //if there is a response, return that response
                    if(results.length > 0)
                    {
                        socket.emit('binary_tag_status', {title: title, response: results[0].response})
                    }
                    else//if there is no response then insert one and send the result of unknown response to the user
                    {
                        //add unknown response to the searchQuery to turn it into a database record to be inserted
                        searchQuery.response = -1;//Unknown Response
                        //create the new record and save the record
                        var newStudentTag = new student_binary_ResponseDB(searchQuery);
                        newStudentTag.save(function(error){
                            if(error){ // if there was an error then return what print out the user, the lecture and the title of the tag
                                console.log("Error adding Default response for user: " + session.userid + ", lecture: " + lecture + ", title: " + title);
                            }
                        });
                        //send the unknown response to the user
                        socket.emit('binary_tag_status', {title: title, response: searchQuery.response})
                    }
                });        
            });
        }

        //when disconnecting for the server, check if the user can be removed
        socket.on('disconnect', function(){
            //remove the user for the room
            socket.leave(session.lecture);
        });
    });
});

//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});