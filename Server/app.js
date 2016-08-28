var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var uuid = require('node-uuid');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//has the Instructor set to a random value, use uuid to make the guess of the string harder
//the change is so if the user found a way to change the isInstructor session variable to
//a value that woule register as true in the followin statement, then they would be able to easly
//be able to break in
// if(request.session.isInstructor) // easly breakable if access to session data
//the following is a bit harder, they would have to have access to the server variable data
var instructorKey = uuid.v4();
function isAnInstructor(session)
{
    if(session.isInstructor === instructorKey)
        return true;
    return false;
}

//setup server for saving the response data
mongoose.connect('localhost:27018/tagging');
var Schema = mongoose.Schema;

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

    //redirect to lecture note for now, may change later. intent in to send user to a welcome page
    response.redirect('/lecture_notes')
});

app.post('/login', function(request, response){
    //get the sid and password
    var sid = request.body.sid;
    var password = request.body.password;

    //check if they can login and send the to the loggedin screen
    login(request.session, sid, password, function(){
        response.redirect('/loggedin');
    }, function(error){
        renderPage(request.session, response, 'loginPage', 'Login - CSCI 1040u', {error: error});
    });
});

app.get('/logout', function(request, response){
    //delete the userid sid and isInstructor for the session data, redirect to the main page
    var session = request.session;
    delete session.userid;
    delete session.isInstructor;
    delete session.sid;
    response.redirect('/');
    console.log('User Logged Out');
});

app.post('/register', function(request, response){
    //get the sid and password for the request
    var sid = request.body.sid;
    var password = request.body.password;

    //if the password and sid are empty the redirect to the regster page
    if(sid === "" || password === "")
    {
        renderPage(request.session, response, 'registerPage', 'Register - CSCI 1040u', {error: "Please Fill the Student ID and Password"});
        return;
    }

    //possible add in a match of sid to a database of sids

    //register the sid and password and redirect to login on success
    register(request.session, sid, password, function(){
        response.redirect('/loggedin'); 
    }, function(error){
        renderPage(request.session, response, 'registerPage', 'Register - CSCI 1040u', {error: error});
    });
});

app.post('/registerInstructor', function(request, response){
    //get the sid and password for the request
    var sid = request.body.username;
    var password = request.body.password;

    //if the password and sid are empty the redirect to the regster page
    if(sid === "" || password === "")
    {
        response.redirect('/registerInstructorForm');
        return;
    }

    //register the sid and password and redirect to login on success
    registerInstructor(request.session, sid, password, function(){
        response.redirect('/loggedin'); 
    }, function(){
        response.redirect('/registerInstructorForm'); 
    });
});

app.get('/registerInstructorForm', function(request, response){
    //render the register page
    response.render('instructorRegister');
});

app.get('/', function(request, response){
    // //load the login page
    if(request.session.userid)
        response.redirect('/loggedin');
    else
        response.redirect('/login');// response.render('login');
});

app.get('/login', function(request, response){
    //load the login page
    renderPage(request.session, response, 'loginPage', 'Login - CSCI 1040u');
});

app.get('/register', function(request, response){
    //load the register page
    renderPage(request.session, response, 'registerPage', 'Register - CSCI 1040u');
});

app.get('/lecture_notes', function(request, response){
    //load the lecture_notes page
    renderPage(request.session, response, 'lecturenotesPage', 'Lecture Notes - CSCI 1040u');
});

function renderPage(session, response, page, title, params)
{
    //if params is empty then make it an empty object,
    var addParams = params || {};
    //set up the default parameters for the render function
    var pageParams = {title:title, loggedin: (session.userid)?true:false, isInstructor: isAnInstructor(session)};

    //for each object in the params object add that object to the parameters of the render function
    Object.keys(addParams).forEach(function(item){
        pageParams[item] = params[item];
    });

    //render the page with its parameters
    response.render(page, pageParams);  
}

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

function register(session, sid, password, onSuccess, onFail, isInstructor)
{
    console.log('registering User');
    UserDB.find({sid: sid}).limit(1).exec(function(error, results){
        if(error)
        {
            console.log("register Error: " + error, "sid: "+sid +" password:"+ password);
            onFail("Unable to Access the database");
            return;
        }
        if(results.length > 0)
        {
            //if there is already a user with the sid regestered
            onFail("Error: User Aleady exsits");
            console.log('Failed To register User, User Aleady Exisits');
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
                    onFail("Unable to add Your Information");
                }
                else
                {
                    //if succefully added, log the username
                    console.log("User Added: " + userdata);

                    //set user the session variables and call onSuccess()
                    session.userid = userid;
                    if(userdata.isInstructor === true)
                        session.isInstructor = instructorKey;
                    else
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
    console.log('Logging In User');
    //check of there is user with the sid that was submitted
    UserDB.find({sid: sid}).limit(1).exec(function(error, results){
        if(error)
        {
            console.log("Login Error: " + error, "sid: "+sid +" password:"+ password);
            onFail("Unable to process you request");
            return;
        }
        if((results.length > 0) && (bcrypt.compareSync(password, results[0].hashedPassword)))
        {
            console.log('Successfully Logged in User, ' + sid);
            //successful login, contiune with the login
            session.userid = results[0].userid;
            if(results[0].isInstructor === true)
                session.isInstructor = instructorKey;
            else
                session.isInstructor = results[0].isInstructor;
            session.sid = results[0].sid;
            onSuccess();
        }
        else
        {
            //incorect password call the on fall method
            console.log("Login Attempt: " + sid /*+ " Password: " + password*/);
            onFail("Invalid Student ID or Password");
        }
    });
}

//when registering a instructor
function registerInstructor(session, sid, password, onSuccess, onFail)
{
    console.log('registering Instructor');
    //send the isInstrctor to true
    register(session, sid, password, onSuccess, onFail, true);
}

/******** Report Functionality ********/

app.get('/course_summary', function(request, response){
    //render the Course Overview page
    if(isAnInstructor(request.session))
        renderPage(request.session, response, 'coursesummaryPage', 'Course Summary - CSCI 1040u');
    else
        //if not a instructor then send them to the main page
        response.redirect('/');
});

app.post('/course_summary', function(request, response){
    //if the user isn't an instructor the don't allow them to see a page
    if(isAnInstructor(request.session))
    {
        // retrive all the data in the database
        student_binary_ResponseDB.find({}).exec(function(error, results){
            //if there is a response send the data
            if(results.length > 0){
                //variables for the student stats and the lecture stats
                var studStats = {};
                var lecStats = {};

                //update the student and lecture stats wth each results
                results.forEach(function(item){
                    updateCourseOverviewReportData(lecStats, item.lecture, item.tag_title, item.response);
                    updateCourseOverviewReportData(studStats, item.studentid, item.tag_title, item.response);     
                });
                
                //change the userid that are in the data above to be the sid's equivalent
                UserDB.find({isInstructor:false}).select({userid: 1, sid: 1}).exec(function(error, results){
                    if(results.length > 0)
                    {
                        //rename each userid to be its sid equivalent
                        results.forEach(function(item){
                            _renameProperty(studStats, item.userid, item.sid);
                        });
                        
                        //send the results to the Instructor
                        response.send({studStats: studStats, lecStats: lecStats});        
                    }
                });
            }
        });
        console.log('course_summary_report');
    }
});

app.get('/course_report', function(request, response){
    //easy access to the session variable
    var session = request.session;
    if(isAnInstructor(session)){
        //if instructor the retrive the sid for the query data.
        var sid = request.query.sid;

        //find the userid for the sid that was given
        UserDB.find({sid: sid}).limit(1).select({userid: 1}).exec(function(error, results){
            if(error)
            {
                //if error with database register console ther DB error and render the page with an error message
                console.log("Course Report, Instructor, find userid for sid, Error: " + error);
                renderPage(session, response, 'course_report', "Course Report", {error: "Error searching for the Userid in the UserDB Table"});
                return;
            }
            if(results.length > 0)
            {
                //render the course_report
                course_report(session, response, results[0].userid, sid)
            }
            else
            {
                //when no student is found, render page with errror message
                renderPage(session, response, 'course_report', "Course Report", {error: "Unable to find Student"});
            }
        }); 
    }
    else
    {
        if(session.userid)
            //render the course report from the userid in the data
            course_report(session, response, session.userid)
        else
            //send the user back to the main page if they are not logged in
            response.redirect('/');
    }
});

app.get('/course_report_list', function(request, response){
    console.log('course_report_list');
    //run only if the instructor request the page
    if(isAnInstructor(request.session)){
        //get all user that are students, retrive only the id's
        UserDB.find({isInstructor: false}).select({sid:1}).exec(function(error, results){
            if(error)
            {
                //if error with database register console ther DB error and render the page with an error message
                console.log("Course Report List, Instructor, find the list of userid's, Error: " + error);
                renderPage(session, response, 'course_report', "Course Report", {error: "Error searching for the Userid in the UserDB Table"});
                return;
            }
            if(results.length > 0)
            {
                //array of students
                var students = [];
                    
                //place all student's into the array
                results.forEach(function(item){
                    students.push(item.sid);
                });

                //render the course list page and send the student names there
                renderPage(request.session, response, 'course_report_list', 'Course Report - List of Students',  {students: students});
            }
            else
                //when not responses in the database, send error message
                renderPage(request.session, response, 'course_report_list', 'Course Report - List of Students',  {error: "Unable to find the users in the Database."});
        });
    }
    else
        //send the user back to the main page
        response.redirect('/');
});

function course_report(session, response, studentid, sid)
{
    //search for all response's for the user
    student_binary_ResponseDB.find().exec(function(error, results){
        if(error)
        {
            //if error with database register console ther DB error and render the page with an error message
            console.log("Course Report, error geting reponses from the student_binary_responseDB database, Error: " + error);
            renderPage(session, response, 'course_report', (sid)?"Course Report - " + sid:"Course Report" , {error: "Unable to access the database."});
            return;
        }
        if(results.length > 0){
            //set up object the student's stats and all students stats
            var allStats = {};
            var studStats = {};

            //for each db entry sort the data into the a set data structure
            // -lecture_name
            // --section_name
            // ---tag_name
            // ----U        - 1 response
            // ----D        - 0 response
            // ----UNK      - -1 response
            // ----length   - the total number of responses (U+D+UNK)
            results.forEach(function(item){
                updateReportData(allStats, item.lecture, item);
                //if the item's studentid matches the userid given then do a seperate calc for the student
                if(item.studentid === studentid)
                    updateReportData(studStats, item.lecture, item);
            });
            
            //render the course report with student stats and all student stats
            renderPage(session, response, 'course_report', (sid)?"Course Report - " + sid:"Course Report" , {studentid: sid, student: studStats, avgstudents: allStats});
        }
        else
            //when not responses in the database, send error message
            renderPage(session, response, 'course_report', (sid)?"Course Report - " + sid:"Course Report" , {error: "Unable to get responses from the database."});

    });
}

app.get('/lecture_summary', function(request, response){
    //easy access to the session data
    var session = request.session;

    //run only if the user is the instructor
    if(isAnInstructor(session)){
        //get the lecture that is wanted to be looked at
        var lecture = request.query.lecture;

        //get all the response that are for that lecture
        student_binary_ResponseDB.find({lecture: lecture}).exec(function(error, results){
            if(error)
            {
                //if error accessing DB, console error, and render error message page
                console.log("Lecture Summary, Instructor, error accessing the student_binary_responseDB database, Error: " + error);
                renderPage(request.session, response, 'lecture_summary', 'Lecture Summary - ' + lecture,  {error:"Unable to access database."});
                return;
            }
            if(results.length > 0)
            {
                //set up object for the section Stats and the student stats
                var secStats = {};
                var studStats = {};

                //for each db item, sort the data into the following structure
                // -section_name || student_id
                // --tag_name
                // ---U        - 1 response
                // ---D        - 0 response
                // ---UNK      - -1 response
                // ---length   - the total number of responses (U+D+UNK)
                results.forEach(function(item){
                    lectureOverviewReport(secStats, item.section, item);
                    lectureOverviewReport(studStats, item.studentid, item);
                });
                
                //get all the students in the userDb
                UserDB.find({isInstructor:false}).select({userid: 1, sid: 1}).exec(function(error, results){
                    if(error)
                    {
                        //if error accessing DB, console error, and render error message page
                        console.log("Lecture Summary, Instructor, error accessing the UserDB database, Error: " + error);
                        renderPage(request.session, response, 'lecture_summary', 'Lecture Summary - ' + lecture,  {error:"Unable to access database."});
                        return;
                    }
                    if(results.length > 0)
                    {
                        //replace all userid with the equivalent sid
                        results.forEach(function(item){
                            _renameProperty(studStats, item.userid, item.sid);
                        });
                        
                        //render the results
                        renderPage(request.session, response, 'lecture_summary', 'Lecture Summary - ' + lecture,  {sections: secStats, students: studStats , lecture: lecture});
                    }
                    else
                    {
                        //when not responses in the database, send error message
                        renderPage(request.session, response, 'lecture_summary', 'Lecture Summary - ' + lecture,  {error:"Unable to get users from the database."});
                    }
                });
            }
            else
            {
                //when not responses in the database, send error message
                renderPage(request.session, response, 'lecture_summary', 'Lecture Summary - ' + lecture,  {error:"Unable to get responses from the database."});
            }
        });
    }
    else
        //send the user back to the main page
        response.redirect('/');
});

app.get('/lecture_summary_list', function(request, response){
    console.log('lecture_summary_list');
    //run only if the user is an instructor
    if(isAnInstructor(request.session)){
        student_binary_ResponseDB.find().select({lecture: 1}).exec(function(error, results){
            if(error)
            {
                //if error accessing DB, console error, and render error message page
                console.log("Lecture Summary list, Instructor, error accessing the student_binary_responseDB database, Error: " + error);
                renderPage(request.session, response, 'lecture_summary_list', 'Lecture Summary - List of Lectures',  {error:"Unable to access database."});
                return;
            }

            if(results.length > 0)
            {
                var templectures = {};
                var lectures = [];

                results.forEach(function(item){
                    templectures[item.lecture] = 0;
                });

                Object.keys(templectures).forEach(function(item){
                    lectures.push(item);
                });

                renderPage(request.session, response, 'lecture_summary_list', 'Lecture Summary - List of Lectures',  {lectures: lectures});
            }
            else
            {
                renderPage(request.session, response, 'lecture_summary_list', 'Lecture Summary - List of Lectures',  {error:"Unable to get Lecture for database."});
            }
        });
    }
    else
        //send the user to the main page
        response.redirect('/');
});

app.get('/lecture_report', function(request, response){
    //get the lecture from the request
    var session = request.session;
    var lecture = request.query.lecture;
    
    if(isAnInstructor(request.session)){
        sid = request.query.sid;
        //find the userid for the sid that was given
        UserDB.find({sid: sid}).limit(1).select({userid: 1}).exec(function(error, results){
            if(error)
            {
                //if error accessing DB, console error, and render error message page
                console.log("Lecture Report, Instructor, error accessing the UserDB database, Error: " + error);
                renderPage(session, response, 'lecture_report', 'Lecture Report',  {error:"Unable to access database."});
                return;
            }
            // lecture_report(session, response, lecture, sid, );
            if(results.length > 0)
            {
                //render the course_report
                lecture_report(session, response, lecture, sid, results[0].userid);
            }
            else
                //no sid in the database, render page with error message
                renderPage(request.session, response, 'lecture_report', 'Lecture Report',  {error:"Unable to find Student ID in the database"});
        }); 
    }
    else{
        lecture_report(session, response, lecture, session.sid, session.userid);
    }
});

function lecture_report(session, response, lecture, sid, student)
{
    //search for all response's for the user
    student_binary_ResponseDB.find({lecture:lecture}).exec(function(error, results){
        if(error)
        {
            //if error accessing DB, console error, and render error message page
            console.log("Lecture Report, error accessing the student_binary_responseDB database, Error: " + error);
            renderPage(rsession, response, 'lecture_report', 'Lecture Report',  {error:"Unable to access database."});
            return;
        }
        if(results.length > 0)
        {
            var allStats = {};
            var studStats = {};

            //create a object where there exisits the name of each lecture slide
            results.forEach(function(item){
                lectureOverviewReport(allStats, item.section, item);
                if(item.studentid === student)
                    lectureOverviewReport(studStats, item.section, item);
            });

            //render the report page sending the lectrue to it
            renderPage(session, response, 'lecture_report', 'Lecture Report - ' + lecture, {stud_lec: {lecture: lecture, student: sid}, student_stats: studStats, all_stats: allStats});
        }
        else
        {
            //no result, render page with error message
            renderPage(session, response, 'lecture_report', 'Lecture Report',  {error:"Unable to get responses for the database database."});
        }
    });
}


//initalize in a {} 
// value:{}
//if the value doen't already exist 
function initVariable(variable, value)
{
    if(!variable[value])
        variable[value] = {};
    return variable[value];
}

//setup for the tag, if it doesn't already exist
//set it top be an open {} with the values
//understand - U
//don't understand - D
//unknown response - UNK
//length
function checkNsetupTag(stats, tag)
{
    if(!stats[tag]){
        stats[tag] = {};
        stats[tag].U = 0;
        stats[tag].D = 0;
        stats[tag].UNK = 0;
        stats[tag].length = 0;
    }
    return stats[tag];
}

//assigns updates the stats with the response value, at the position of tag_title
function addResponse(stats, tag_title, response)
{
    var sign = ""
    switch(response)
    {
        case 1:
            sign = "U";
            break;
        case 0:
            sign = "D";
            break;
        case -1:
            sign = "UNK";
            break;

    }
    var tag = stats[tag_title];
    tag[sign] = tag[sign] + 1;
    tag.length = tag.length + 1;
}

//creates the data structure for the Course Overview report
function updateCourseOverviewReportData(stats, type, tag_title, response)
{
    //create the variable locaiton for the type (student or lecture)
    var stype = initVariable(stats, type);

    //check and possible initailze the tag under the (student or lecture) variable
    checkNsetupTag(stype, tag_title);
    
    //update the data struct with the response
    addResponse(stype, tag_title, response);
}

//creates the data structure for the Lecture Overview Report and the Lecture Report
function lectureOverviewReport(stats, selectValue, item)
{
    //Initalize the vairble for storage of the response (section or studentID)
    var select = initVariable(stats, selectValue);

    //check and possible initailze the tag under the (section or studentID) variable
    checkNsetupTag(select, item.tag_title);
    
    //update the data struct with the response
    addResponse(select, item.tag_title, item.response);
}


function _updateReportData(stats, type, section, tag_title, response)
{
    //create the variable locaiton for the type (student or lecture)
    var secVar = initVariable(stats, type);
    
    //create the variable locaiton for the section
    var stype = initVariable(secVar, section);

    //check and possible initailze the tag under the section variable
    checkNsetupTag(stype, tag_title);

    //update the data struct with the response
    addResponse(stype, tag_title, response);
}

//wrapper Function 
function updateReportData(stats, type, item)
{
    _updateReportData(stats, type, item.section, item.tag_title, item.response);
}

//Socket.IO Functionality

//this is used to give socket.io access to the session data,
//i don't know if this is the best practice, but it works, if it isn't 
//the best practice, i will change it to the best practice.
io.use(function(socket, next){
    sessionMiddleware(socket.request, socket.request.res, next);
});


//change the name of a property in an object
function _renameProperty(object, oldname, newname)
{
    //change the property only if it exits
    if(object.hasOwnProperty(oldname)){
        //the the value to the newname and remove the old name
        object[newname] = object[oldname];
        delete object[oldname];
        return true;
    }
    return false;
}

//change the name of a property in an object
function renameProperty(object, oldname, newname)
{
    if(!_renameProperty(object, oldname, newname))
        object[newname] = 0;
}

//schema for the response from student on the tags
var student_binary_tag_response_schema = new Schema({
    lecture: String,
    studentid: String,
    tag_title: String,
    section: String,
    response: Number
},{collection: 'binary_response'});
var student_binary_ResponseDB = mongoose.model('binary_response', student_binary_tag_response_schema);

//schema for the response from student on the tags
var student_multiple_choice_response_schema = new Schema({
    lecture: String,
    studentid: String,
    multi_title: String,
    response: String
},{collection: 'multiple_response'});
var student_multiple_choice_ResponseDB = mongoose.model('multiple_response', student_multiple_choice_response_schema);

//schema for the response from student on the tags
var multiple_choice_lecture_status_schema = new Schema({
    lecture: String,
    title: String,
    status: Boolean
},{collection: 'multiple_choice_status'});
var multiple_choice_lecture_statusDB = mongoose.model('multiple_choice_status', multiple_choice_lecture_status_schema);


//setup teacher controlling slide 
io.on('connection', function(socket){
    var session = socket.request.session;
    //if there is no userid then don't allow any functionality
    if(!session.userid)
        return;

    //set up the server connection, by having the lecture id sent to the server
    socket.on('lecture_server_setup', function(lecture){
        //send user to right room
        // in this room it is easier to send a message to all students
        socket.join(lecture);/*can have a function call back for any error*/
      
        //setup the functionality of the lecture 
        socket.emit('lecture_client_setup', isAnInstructor(session));

        //use this so the functionality of the instructor is only accessable to the instructor
        /*NOTE: used isInstructor because if it was the oppsite the else statement would be for
        * the instructor and if there was no isStudent in the session data it would treat the user
        * an instructor.
        */
        if(isAnInstructor(session))
        {
            //hold the functionality of the instructor head
            //if the instructor move there slide, the send a siginal to the student to have
            //there slide move
            socket.on('instructor-moveslide', function(indexies){
                io.to(lecture).emit('student-moveslide', indexies);
            });

            //used to get the real time data for the student
            socket.on('get_YNRQ_chart_data', function(request){
                //set a query to look for all data what matches
                // the right lecture, slide number and tag title
                var query = {
                    lecture : lecture,
                    section : request.section
                };

                //search the database for each in the lecture and seciton
                student_binary_ResponseDB.find(query).select({response: 1, tag_title: 1}).exec(function(error, results){
                    //if there is a response emit to instructor
                    if(results.length > 0)
                    {

                        //setup object with each tag having U,D,UNK and length avaliable at tag_data[tag_title]
                        var tag_data = {};
                        request.tags.forEach(function(item, index){
                            checkNsetupTag(tag_data, item);
                            tag_data[item].index = index;
                        });

                        //for each result from the db, update that respective tag with the data
                        results.forEach(function(item){
                            if(tag_data[item.tag_title])
                                addResponse(tag_data, item.tag_title, item.response);
                        });
                        
                        //send to the user
                        socket.emit('YNRQ_chart_data', tag_data);
                    }
                });
            });


            //used to get the real time data for the student
            socket.on('get_chart_multiple_choice_data', function(request){
                //set a query to look for all data what matches
                // the right lecture, slide number and tag title
                var query = {
                    lecture : lecture,
                    multi_title: request.title
                };

                //search the database for each in the lecture and seciton
                student_multiple_choice_ResponseDB.find(query).select({response: 1}).exec(function(error, results){
                    //if there is a response emit to instructor
                    if(results.length > 0)
                    {

                        var answers = {};
                        var inActive = 0;
                        results.forEach(function(item){
                            if (item.response === 'a_-1')
                                inActive++;
                            else
                                answers[item.response] = answers[item.response] + 1 || 1;
                        });

                        //send to the user
                        socket.emit('chart_multiple_choice_update', {answers:answers, length: results.length, inactive: inActive});
                    }
                });
            });
        }
        else
        {
            //holds the functionality that is unique to the student

            //when the student sends a response to the server, update/add that data to the code
            socket.on('YNRQ_response', function(response_data){
                
                //add to the database
                var title = response_data.title;

                //setup database item
                var newResponse = {
                    lecture: lecture,
                    studentid: session.userid,
                    section: response_data.section,
                    tag_title: title,
                    response: response_data.response
                };
                //setup search item
                var searchQuery = {
                    lecture: lecture,
                    studentid: session.userid,
                    section: response_data.section,
                    tag_title: title
                };

               searchDBForResponse(student_binary_ResponseDB, searchQuery, newResponse);
            });
           
            //called when the user check for the status of there current tag
            socket.on('check_YNRQs_status', function(titles_section){
                
                var titles = titles_section.titles;

                //set up the database query
                var searchQuery = {
                    lecture: lecture,
                    studentid: session.userid,
                    section: titles_section.section
                };

                //check if ther exsits a response for a tag from the specific user
                student_binary_ResponseDB.find(searchQuery).select({response: 1, tag_title: 1}).exec(function(err, results){
                    if(results.length > 0)
                    {
                        var dbtags = {};
                        results.forEach(function(tag){
                            dbtags[tag.tag_title] = tag.response;
                        });

                        var tag_responses = [];
                        titles.forEach(function(tag){
                            if(dbtags.hasOwnProperty(tag))
                            {
                                tag_responses.push({title: tag, response: dbtags[tag]});
                            }
                            else
                            {
                                //create the new record and save the record
                                tag_responses.push({title: tag, response: -1});
                                searchQuery.tag_title = tag;
                                searchQuery.response = -1;

                                saveNewBinaryResponse(student_binary_ResponseDB, searchQuery);
                            }
                        });
                    }
                    else
                    {
                        var tag_responses = [];
                        titles.forEach(function(tag){
                        
                            //create the new record and save the record
                            tag_responses.push({title: tag, response: -1});
                            searchQuery.tag_title = tag;
                            searchQuery.response = -1;
                            
                            saveNewBinaryResponse(student_binary_ResponseDB, searchQuery);
                       });
                    }   

                    socket.emit('YNRQs_status', {tag_responses: tag_responses, section: titles_section.section});
                });        
            });

            function searchDBForResponse(DB, searchQuery, newResponse)
            {
                //search to see if there is already an item with the correct id's
                DB.find(searchQuery).limit(1).exec(function(error, results){
                    //if there is already an item update it
                    if(results.length > 0)
                    {
                        // update the current response
                        DB.update(searchQuery, newResponse, {multi: false}, function(error, numAffected){
                            if(error)
                            {
                                console.log("Error in updating " + session.sid + "'s account, response was " + response + ", lecture was " + lecture + ", slide number was " + slide_index);
                            }
                        });
                    }
                    else//if there isn't already an item, add the item to the database
                    {
                        saveNewResponse(DB, newResponse);
                    }
                });
            }

            function saveNewResponse(DB, value)
            {
                //save the value to the binary response db reutrn 
                new DB(value).save(function(error){
                    if(error){ // if there was an error then return what print out the user, the lecture and the title of the tag
                        console.log("Error adding Default response for user: " + session.sid + ", lecture: " + lecture + ", value: " + value + ", Error: " + error);
                    }
                });
            }

            //when the student sends a response to the server, update/add that data to the code
            socket.on('student_multiple_response', function(response_data){
                //add to the database
                var title = response_data.title;

                //setup database item
                var newResponse = {
                    lecture: lecture,
                    studentid: session.userid,
                    multi_title: title,
                    response: response_data.response
                };
                //setup search item
                var searchQuery = {
                    lecture: lecture,
                    studentid: session.userid,
                    multi_title: title
                };
            
                searchDBForResponse(student_multiple_choice_ResponseDB, searchQuery, newResponse);
            });

            //called when the user check for the status of there current tag
            socket.on('check_multiple_choice_status', function(status_request){            
                //set up the database query
                var searchQuery = {
                    lecture: lecture,
                    studentid: session.userid,
                    multi_title: status_request.title
                };
            
                //check if ther exsits a response for a tag from the specific user
               student_multiple_choice_ResponseDB.find(searchQuery).select({response: 1}).limit(1).exec(function(error, results){
                    //if there is a response, return that response
                    var response = 'a_-1';
                    if(results.length > 0)
                    {
                        response = results[0].response;
                    }
                    else//if there is no response then insert one and send the result of unknown response to the user
                    {
                        //add unknown response to the searchQuery to turn it into a database record to be inserted
                        searchQuery.response = response;//Unknown Response
                        //create the new record and save the record
                        saveNewResponse(student_multiple_choice_ResponseDB, searchQuery);
                    }

                    status_request.response = response;
                    socket.emit('multiple_choice_status', status_request);
                });        
            });
        }

        //when disconnecting for the server, check if the user can be removed
        socket.on('disconnect', function(){
            //remove the user for the room
            socket.leave(session.lecture);
        });

        function searchDBForResponse(DB, searchQuery, newResponse)
        {
            //search to see if there is already an item with the correct id's
            DB.find(searchQuery).limit(1).exec(function(error, results){
                //if there is already an item update it
                if(results.length > 0)
                {
                    // update the current response
                    DB.update(searchQuery, newResponse, {multi: false}, function(error, numAffected){
                        if(error)
                        {
                            console.log("Error in updating " + session.sid + "'s account, response was " + response + ", lecture was " + lecture);
                        }
                    });
                }
                else//if there isn't already an item, add the item to the database
                {
                    saveNewResponse(DB, newResponse);
                }
            });
        }

        function saveNewResponse(DB, value)
        {
            //save the value to the binary response db reutrn 
            new DB(value).save(function(error){
                if(error){ // if there was an error then return what print out the user, the lecture and the title of the tag
                    console.log("Error adding Default response for user: " + session.sid + ", lecture: " + lecture + ", value: " + value + ", Error: " + error);
                }
            });
        }

        socket.on('close_multiple_choice_question', function(title){
            var searchQuery = {
                title: title,
                lecture: lecture
            };

            var newResponse  = {
                title: title,
                lecture: lecture,
                status: false //aka closed
            };

            searchDBForResponse(multiple_choice_lecture_statusDB, searchQuery, newResponse);

            // io.to(lecture).emit('close_multiple_choice_question', title);
           //set a query to look for all data what matches
            // the right lecture, slide number and tag title
            var query = {
                lecture : lecture,
                multi_title: title
            };

            //search the database for each in the lecture and seciton
            student_multiple_choice_ResponseDB.find(query).select({response: 1}).exec(function(error, results){
                //if there is a response emit to instructor
                if(results.length > 0)
                {

                    var answers = {};
                    var inActive = 0;
                    results.forEach(function(item){
                        if (item.response === 'a_-1')
                            inActive++;
                        else
                            answers[item.response] = answers[item.response] + 1 || 1;
                    });

                    //send to the user
                    io.to(lecture).emit('close_multiple_choice_question', {title:title, answers:answers, length: results.length, inactive: inActive});
                }
            });

        });

    });
    // socket.on("mobile_debug", function(data){
    //     if(typeof data === "Object")
    //         console.log(session.sid + ': ', JSON.stringify(data));            
    //     else
    //         console.log(session.sid + ': ', data);
    // });

});

// // cleanDB();
// student_binary_ResponseDB.find({}).remove().exec(function(){
//     console.log("done");
// });
// student_binary_ResponseDB.find({section: 'Open data'})
//     .exec(function(error, results){
//         console.log(results);
//     });


//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});