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
    }, function(){
        response.redirect('/'); 
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
        response.redirect('/register');
        return;
    }

    //possible add in a match of sid to a database of sids

    //register the sid and password and redirect to login on success
    register(request.session, sid, password, function(){
        response.redirect('/loggedin'); 
    }, function(){
        response.redirect('/register');
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
        response.redirect('/loggedin'); // response.render('loggedin', {username: request.session.sid, isInstructor: request.session.isInstructor}); 
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
    var pageParams = {title:title, loggedin: (session.userid)?true:false, isInstructor: session.isInstructor};

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
    UserDB.find({sid: sid}).limit(1).then(function(results){
        if(results.length > 0)
        {
            //if there is already a user with the sid regestered
            onFail();
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
    console.log('Logging In User');
    //check of there is user with the sid that was submitted
    UserDB.find({sid: sid}).limit(1).then(function(results){
        if((results.length > 0) && (bcrypt.compareSync(password, results[0].hashedPassword)))
        {
            console.log('Successfully Logged in User, ' + sid);
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
    console.log('registering Instructor');
    //send the isInstrctor to true
    register(session, sid, password, onSuccess, onFail, true);
}

//Report Functionality

app.get('/course_overview', function(request, response){
    //render the Course Overview page
    if(request.session.isInstructor)
        renderPage(request.session, response, 'courseoverviewPage', 'Course Overview - CSCI 1040u');
    else
        //if not a instructor then send them to the main page
        response.redirect('/');
});

app.post('/course_overview', function(request, response){
    //if the user isn't an instructor the don't allow them to see a page
    if(request.session.isInstructor)
    {
        // retrive all the data in the database
        student_binary_ResponseDB.find({}).then(function(results){
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
                UserDB.find({isInstructor:false}).select({userid: 1, sid: 1}).then(function(results){
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
        console.log('course_overview_report');
    }
});

app.get('/course_report', function(request, response){
    //easy access to the session variable
    var session = request.session;
    if(session.isInstructor){
        //if instructor the retrive the sid for the query data.
        var sid = request.query.sid;

        //find the userid for the sid that was given
        UserDB.find({sid: sid}).limit(1).select({userid: 1}).then(function(results){
            if(results.length > 0)
            {
                //render the course_report
                course_report(session, response, results[0].userid, sid)
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
    if(request.session.isInstructor){
        //get all user that are students, retrive only the id's
        UserDB.find({isInstructor: false}).select({sid:1}).then(function(results){
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
        });
    }
    else
        //send the user back to the main page
        response.redirect('/');
});

function course_report(session, response, studentid, sid)
{
    //search for all response's for the user
    student_binary_ResponseDB.find()
    .then(function(results){
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
    });
}

app.get('/lecture_overview', function(request, response){
    //easy access to the session data
    var session = request.session;

    //run only if the user is the instructor
    if(session.isInstructor){
        //get the lecture that is wanted to be looked at
        var lecture = request.query.lecture;

        //get all the response that are for that lecture
        student_binary_ResponseDB.find({lecture: lecture})
        .then(function(results){
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
            UserDB.find({isInstructor:false}).select({userid: 1, sid: 1}).then(function(results){
                if(results.length > 0)
                {
                    //replace all userid with the equivalent sid
                    results.forEach(function(item){
                        _renameProperty(studStats, item.userid, item.sid);
                    });
                    
                    //render the results
                    renderPage(request.session, response, 'lecture_overview', 'Lecture Overview - ' + lecture,  {sections: secStats, students: studStats , lecture: lecture});
                }
            });
        });
    }
    else
        //send the user back to the main page
        response.redirect('/');
});

app.get('/lecture_overview_list', function(request, response){
    console.log('lecture_overview_list');
    //run only if the user is an instructor
    if(request.session.isInstructor){
        student_binary_ResponseDB.find().select({lecture: 1}).then(function(results){
            var templectures = {};
            var lectures = [];

            results.forEach(function(item){
                templectures[item.lecture] = 0;
            });

            Object.keys(templectures).forEach(function(item){
                lectures.push(item);
            });

            renderPage(request.session, response, 'lecture_overview_list', 'Lecture Overview - List of Lectures',  {lectures: lectures});
        });
    }
    else
        //send the user to the main page
        response.redirect('/');
});

//to be converted to newer version
//will be untoched untill next talk with randy over reporting format
app.get('/lectureReport', function(request, response){
    //get the lectrue from the request
    var lecture = 'AJAX, JSON, and XML - CSCI 3230u';
    var student = 'matt';

    // if(request.session.isInstructor)
    //     student = request.body.student;
    // else
    //     student = request.session.userid;
    
    UserDB.find({sid: student}).limit(1).select({userid:1}).then(function(results){
        if(results.length > 0)
        {
            var uid = results[0].userid;
            //search for all response's for the user
            student_binary_ResponseDB.find({lecture:lecture})
            .then(function(results){
                var allStats = {};
                var studStats = {};

                //create a object where there exisits the name of each lecture slide
                results.forEach(function(item){
                    lectureOverviewReport(allStats, item.section, item);
                    if(item.studentid === uid)
                        lectureOverviewReport(studStats, item.section, item);
                });
        
                //render the report page sending the lectrue to it
                response.render('LectureReport', {stud_lec: {lecture: lecture, student: student}, student_stats: studStats, all_stats: allStats, isInstructor: request.session.isInstructor});    
            });
        }
    });

});

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
var student_binary_ResponseDB = mongoose.model('student_response', student_binary_tag_response_schema);

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
        socket.emit('lecture_client_setup', session.isInstructor);

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
                io.to(lecture).emit('student-moveslide', indexies);
            });

            //used to get the real time data for the student
            socket.on('get_chart_tag_data', function(request){
                //set a query to look for all data what matches
                // the right lecture, slide number and tag title
                var query = {
                    lecture : lecture,
                    section : request.section
                };

                student_binary_ResponseDB.find(query).select({response: 1, tag_title: 1}).then(function(results){
                    if(results.length > 0)
                    {
                        var tag_data = {};
                        request.tags.forEach(function(item, index){
                            checkNsetupTag(tag_data, item);
                            tag_data[item].index = index;
                        });

                        results.forEach(function(item){                        
                            if(tag_data[item.tag_title])
                                addResponse(tag_data, item.tag_title, item.response);
                        });
                        
                        socket.emit('chart_tag_update', tag_data);
                    }
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
                        saveNewResponse(newResponse);
                    }
                });
            });
           
            //called when the user check for the status of there current tag
            socket.on('check_binary_tags_status', function(titles_section){
                
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

                                saveNewResponse(searchQuery);
                            }
                        });

                        socket.emit('binary_tags_status', {tag_responses: tag_responses, section: titles_section.section});
                    }
                    else
                    {
                        var tag_responses = [];
                        titles.forEach(function(tag){
                        
                            //create the new record and save the record
                            tag_responses.push({title: tag, response: -1});
                            searchQuery.tag_title = tag;
                            searchQuery.response = -1;
                            
                            saveNewResponse(searchQuery);
                       });

                        socket.emit('binary_tags_status', {tag_responses: tag_responses, section: titles_section.section});
                    }   
                });        
            });

            function saveNewResponse(value)
            {
                //save the value to the binary response db reutrn 
                new student_binary_ResponseDB(value).save(function(error){
                    if(error){ // if there was an error then return what print out the user, the lecture and the title of the tag
                        console.log("Error adding Default response for user: " + session.userid + ", lecture: " + lecture + ", title: " + title);
                    }
                });
            }
        }

        //when disconnecting for the server, check if the user can be removed
        socket.on('disconnect', function(){
            //remove the user for the room
            socket.leave(session.lecture);
        });
    });

    // socket.on('mobile_debug', function(data){
    //     console.log(session.sid + ": " + data);
    // });
});

// // cleanDB();
// student_binary_ResponseDB.find({}).remove().exec(function(){
//     console.log("done");
// });
// student_binary_ResponseDB.find({tag_title: 'Difficult'})
//     .then(function(results){
//         console.log(results);
//     });


//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});