var express = require('express');
var setSession = require('express-session');
var bodyParser = require("body-parser");
var uuid = require('node-uuid');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');

/****************************************
			Database Structures
****************************************/
var Schema = mongoose.Schema;

/**** Yes No Response Question - Response Table ****
* lecture - the Lecture ID
* studentid - the UUID that of the student that sent the response
* tag_title - the title of the YNRQ that was sent
* section - the section in the lecture that the YNRQ is in
* response - the value of the response that was sent in (1 - yes,0 - no,-1 - unknown)
*******************************************************/
var student_YNRQ_schema = new Schema({
	lecture: String,
	studentid: String,
	tag_title: String,
	section: String,
	response: Number,
	courseid: String
},{collection: 'yesno_response'});
var student_YNRQ_DB = mongoose.model('yesno_response', student_YNRQ_schema);


/**** Lecture ID To Name - Table ****
* lectureID - the Lecture ID
* lecture_title - the title of the lecture
****************************************/
var Lecture_ID_Name_schema = new Schema({
	lectureID: String,
	lecture_title: String,
	courseid: String
},{collection: 'lecture_id_to_name'});
var Lecture_ID_Name = mongoose.model('lecture_id_to_name', Lecture_ID_Name_schema);


/**** Multiple Choice Response Question - Response Table ****
* lecture - the Lecture ID
* studentid - the UUID that of the student that sent the response
* multi_title - the title of the MCRQ that was sent
* response - the value of the response that was sent in (Answer is in the from of a "Q" followed by the number of the question)
****************************************************************/
var student_multiple_choice_response_schema = new Schema({
	lecture: String,
	studentid: String,
	multi_title: String,
	response: String,
	courseid: String
},{collection: 'multiple_choice_response'});
var student_multiple_choice_ResponseDB = mongoose.model('multiple_choice_response', student_multiple_choice_response_schema);


/**** Multiple Choice Response Question - Question Stats Table ****
* title - title of the MCRQ
* lecture - the Lecture ID of the MCRQ
* status - true, if the answer is open. false, if the answer is closed.
* answer - The correct answer to the question
**********************************************************************/
var multiple_choice_lecture_status_schema = new Schema({
	title: String,
	lecture: String,
	status: Boolean,
	answer: Number,
	courseid: String
},{collection: 'multiple_choice_status'});
var multiple_choice_lecture_statusDB = mongoose.model('multiple_choice_status', multiple_choice_lecture_status_schema);


/**** User - Table ****
* userid - a UUID unique to the the student id
* sid - the students/instructor ID number
* hashedPassword - the students password that was Hashed by the bcrypt plugin
* isInstructor - if the User is an Instructor or not
**************************/
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

/**** UserToCourse - Table ****
* userid - the user in the usertable
* courseid - the course they are asscoated with
**************************/
var usertocourseSchema = new Schema({
	userid: String,
	courseid: String
}, {collection: 'usersToCourses'});
var UserToCourseDB = mongoose.model('usertocourse', usertocourseSchema);


/****************************************
			Course Tables
****************************************/
var CourseSchema = new Schema({
	courseid: {type: String, 
			  unique: true,
			  index: true},
	coursename: String,
	coursedesc: String
}, {collection: 'courses'});
var CourseDB = mongoose.model('course', CourseSchema);



/****************************************
			Extra
****************************************/


//has the Instructor set to a random value, use uuid to make the guess of the string harder
//the change is so if the user found a way to change the isInstructor session variable to
//a value that woule register as true in the followin statement, then they would be able to easly
//be able to break in
// if(request.session.isInstructor) // easly breakable if anyone has access to session data
//the following is a bit harder, they would have to have access to the server variable data
var instructorKey = uuid.v4();
function isAnInstructor(session)
{
	if(session.isInstructor === instructorKey)
		return true;
	return false;
}




/****************************************
			Server Setup
****************************************/

//setup server for saving the response data
mongoose.connect('localhost/Response_System');

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
var sessionMiddleware = setSession({
	genid: function(request) {
		return uuid.v4();
	},
	resave: false,			 // save only when changed
	saveUninitialized: false,  // save even when no data
	// this is used when signing the session cookie
	// cookie: { secure: true }, // encrypted cookies only
	cookie: {log: 1},
	secret: 'apollo slackware prepositional expectations'
});

//use the session data that is above
app.use(sessionMiddleware);

//make the session data avaiable to socket.io
io.use(function(socket, next){
	sessionMiddleware(socket.request, socket.request.res, next);
});

CourseDB.find().exec(function(error, results){
	//dont set anything up if nothing in the table, or error in the db
	if(error || results.length <= 0){
		console.log("Error Trying to set up courses. DB Error: " + error + ", results.length: " + results.length);
		console.log("uuid for first course:", uuid.v4());
		return;
	}
	//for each course Load it up
	results.forEach(function(course){
		LoadCourse(course);
	});
		
});


function LoadCourse(course)
{

	var courseName = course.coursename.replace(/ /g, "").toLowerCase();
	var courseFullName = course.coursename;
	var courseID = course.courseid;
	var courseDes = course.coursedesc;

	console.log(courseName, courseFullName , courseID);
	/***************************************
			Page Render Functionality
	****************************************/


	/**
	* Renders the page with the parameters that are sent to he params variable.
	* Included in the parameters that are sent through, title, is logged in and is an instructor
	* logic are added. this removes the need to add them in each funciton that renders a page.
	*   Params - can be left blank 
	*/
	function renderPage(session, response, page, title, params)
	{
		//if params is empty then make it an empty object,
		var addParams = params || {};
		//set up the default parameters for the render function
		var pageParams = {title:title, loggedin: (session)?((session.userid)?true:false):false, isInstructor: (session)?(isAnInstructor(session)):false, coursename: courseFullName, description: courseDes, courselocationname: courseName};

		//for each object in the params object add that object to the parameters of the render function
		Object.keys(addParams).forEach(function(item){
			pageParams[item] = params[item];
		});

		//render the page with its parameters
		response.render(page, pageParams);  
	}

	/****************************************
			check Logged in
	****************************************/
	function CheckLoggedin(session)
	{
		//if not course already there, make it empty and return null
		if(!session.course){
			session.course = {};
			return null;
		}

		//if there is a course with the id and there is a userid, return the session data
		//else return null
		if(session.course[courseID]){
			if(session.course[courseID].userid){
				return session.course[courseID];
			}
			else
			{
				return null;
			}
		}
		else 
		{
			return null;
		}
	}



	/****************************************
			Sign In Funcitonality
	****************************************/

	//show that your are logged in, can be changed to redirect another site
	app.get('/'+courseName+'/loggedin', function(request, response){
		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;

		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}

		//redirect to lecture note for now, may change later. intent in to send user to a welcome page
		response.redirect('/'+courseName+'/lecture_notes')
	});

	//logs out the user adn gets rid of session values
	app.get('/'+courseName+'/logout', function(request, response){
		if(!CheckSession(request.session, response))
			return;
		//delete the userid sid and isInstructor for the session data, redirect to the main page
		var session = request.session;

		delete session.course[courseID];
		session.log = 1;
		response.redirect('/'+courseName);
	});

	//renders login page
	app.get('/'+courseName+'/login', function(request, response){

		var session = CheckLoggedin(request.session);
		if(session)
			response.redirect('/'+courseName+'/loggedin');
		else
			renderPage(session, response, 'loginPage', 'Login - ' + courseFullName);
	});

	//login funcitonality
	app.post('/'+courseName+'/login', function(request, response){
		//get the sid and password
		var sid = request.body.sid;
		var password = request.body.password;

		//check if they can login and send the to the loggedin screen
		login(request.session, sid, password, function(){
			response.redirect('/'+courseName+'/loggedin');
		}, function(error){
			renderPage(request.session, response, 'loginPage', 'Login - ' + courseFullName, {error: error});
		});
	});

	//check db to see if login is good
	function login(session, sid, password, onSuccess, onFail)
	{
		//check of there is user with the sid that was submitted
		UserDB.find({sid: sid}).limit(1).exec(function(error, results){
			if(error)
			{
				//if there is an error with the db
				console.log("Login Error: " + error, "sid: "+sid +" password:"+ password);
				onFail("Unable to process you request");
				return;
			}

			if((results.length > 0) && (bcrypt.compareSync(password, results[0].hashedPassword)))
			{
				//check if in this course
				UserToCourseDB.find({userid: results[0].userid, courseid: courseID}).limit(1).exec(function(error, inCourse){

					if(error)
					{
						//if there is an error with the db
						console.log("Login Error: " + error, "sid: "+sid +" password:"+ password);
						onFail("Unable to process you request");
						return;
					}
					if(inCourse.length > 0)
					{

						console.log('Successfully Logged in User, ' + sid);
						//successful login, contiune with the login
						setLoggedinSessionValues(session, results[0].userid, results[0].isInstructor, results[0].sid);
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
			else
			{
				//incorect password call the on fall method
				console.log("Login Attempt: " + sid /*+ " Password: " + password*/);
				onFail("Invalid Student ID or Password");
			}
		});
	}


	/****************************************
			Session Login Values
	****************************************/

	function setLoggedinSessionValues(session, userid, isInstructor, sid)
	{
		//creat course if it is not there
		if(!session.course)
			session.course = {};
		//empty out the course at courseID
		session.course[courseID] = {};

		//set the variable
		//userid
		//isInstrcutor
		//sid
		//log - used to see if a user has logged in before
		//courseid
		session.course[courseID].userid = userid;
		if(isInstructor === true)
			session.course[courseID].isInstructor = instructorKey;
		else
			session.course[courseID].isInstructor = isInstructor;
		session.course[courseID].sid = sid;
		session.log = 2;
		session.course[courseID].courseid = courseID;
	}

	/**
	*A check to see if user can access a given page
	*/
	function CheckSession(session, response)
	{
		//bug was found when the navgating to a page when not signed in. nothing appear on screen
		//didn't want the have the bug.
		//the cookie.log dissappears when login is called
		//use session.log = 1 to mean after logged out, you can't go to pages like lecture report

		if((session.cookie.log === 1) || (session.log === 1)){
			response.redirect('/' + courseName);
			return false;
		}
		return true;
	}


	/****************************************
			Register Funcitonality
	****************************************/

	app.get('/'+courseName+'/register_XDAPRTONGTY_InstructorForm', function(request, response){
		//render the register page
		var session = CheckLoggedin(request.session);
		if(session)
			response.redirect('/'+courseName+'/loggedin');
		else
			response.render('instructorRegister');
	});

	app.get('/'+courseName+'/register', function(request, response){
		//load the register page
		var session = CheckLoggedin(request.session);
		if(session)
			response.redirect('/'+courseName+'/loggedin');
		else
			renderPage(request.session, response, 'registerPage', 'Register - ' + courseFullName);
	});

	//proccesses register request
	app.post('/'+courseName+'/register', function(request, response){
		var session = CheckLoggedin(request.session);
		if(session){
			response.redirect('/'+courseName+'/loggedin');
			return;
		}
		//get the sid and password for the request
		var sid = request.body.sid;
		var password = request.body.password;

		//if the password and sid are empty the redirect to the regster page
		if(sid === "" || password === "")
		{
			renderPage(request.session, response, 'registerPage', 'Register - ' + courseFullName, {error: "Please Fill the Student ID and Password"});
			return;
		}

		//possible add in a match of sid to a database of sids

		//register the sid and password and redirect to login on success
		register(request.session, sid, password, function(){
			response.redirect('/'+courseName+'/loggedin'); 
		}, function(error){
			renderPage(request.session, response, 'registerPage', 'Register - ' + courseFullName, {error: error});
		});
	});

	//note: added XDAPRTONGTY in the or register for added security of registering a instructor
	app.post('/'+courseName+'/register_XDAPRTONGTY_Instructor', function(request, response){
		var session = CheckLoggedin(request.session);
		if(session){
			response.redirect('/'+courseName+'/loggedin');
			return;
		}

		//get the sid and password for the request
		var sid = request.body.username;
		var password = request.body.password;

		//if the password and sid are empty the redirect to the regster page
		if(sid === "" || password === "")
		{
			response.redirect('/'+courseName+'/register_XDAPRTONGTY_InstructorForm');
			return;
		}

		//register the sid and password and redirect to login on success
		registerInstructor(request.session, sid, password, function(){
			response.redirect('/'+courseName+'/loggedin'); 
		}, function(){
			response.redirect('/'+courseName+'/register_XDAPRTONGTY_InstructorForm'); 
		});
	});

	//added a new user to the db
	function register(session, sid, password, onSuccess, onFail, isInstructor)
	{
		UserDB.find({sid: sid}).limit(1).exec(function(error, results){
			if(error)
			{
				//if an error occured with the table of db
				console.log("register Error: " + error, "sid: "+sid +" password:"+ password);
				onFail("Unable to Access the database");
				return;
			}
			if(results.length > 0)
			{
				if(bcrypt.compareSync(password, results[0].hashedPassword))
				{
					UserToCourseDB.find({userid: results[0].userid, courseid: courseID}).limit(1).exec(function(error, inCourse){
						if(error)
						{
							//if an error occured with the table of db
							console.log("register Error: " + error, "sid: "+sid +" password:"+ password);
							onFail("Unable to Access the database");
							return;
						}
						if(inCourse.length <= 0)
						{

							saveNewResponse(UserToCourseDB, {userid: results[0].userid ,courseid: courseID});
							setLoggedinSessionValues(session, results[0].userid, isInstructor, sid)
							onSuccess();
						}
						else
						{
							//if there is already a user with the sid regestered
							onFail("Error: User Aleady exists	");
							console.log('Failed To register User, User Aleady Exists');
						}

					});
				}
				else
				{
					//if there is already a user with the sid regestered
					onFail("Error: User Aleady exists	");
					console.log('Failed To register User, User Aleady Exists');
				}
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
						setLoggedinSessionValues(session, userid, userdata.isInstructor, sid)
						onSuccess();
					}
				});

				saveNewResponse(UserToCourseDB, {userid: userid ,courseid: courseID});
				
			}
		});
	}

	//when registering a instructor
	function registerInstructor(session, sid, password, onSuccess, onFail)
	{
		//send the isInstrctor to true
		register(session, sid, password, onSuccess, onFail, true);
	}



	/****************************************
		Render Lecture Notes Funcitonality
	****************************************/

	app.get('/'+courseName+'/lecture_notes', function(request, response){
		var session = CheckLoggedin(request.session);

		//location of the lecture directory
		var lectureFolder =  __dirname + "/public/" + courseName + "/lectures/";
		
		//pull all the files on the lecture directory
		fs.readdir(lectureFolder, function(error, files) {
			if(!error)
			{
				var Lectures = [];

				//sort the files
				files.sort();

				files.forEach(function(item){
					var name = item;
					//add to the lecture only if it is a html file
					if(name.endsWith(".html")){
						//for the name remove the ".html"
						name = name.replace(".html", "");
						Lectures.push({location:  item, name: name});
					}
				});

				//load the lecture_notes page
				renderPage(session, response, 'lecturenotesPage', 'Lecture Notes - ' + courseFullName, {Lectures: Lectures});
			}
			else
			{
				response.send("<h1>Error, contact Admin About Lack of Lecture Notes Page</h1>");
			}
		});
		
	});


	/****************************************
				Main page
	****************************************/
	app.get('/'+courseName, function(request, response){
		//location of a main page
		var main_file = __dirname + "/public/" + courseName + "/home.html"
		
		//if there is a main page, load it, else redirect to login
		fs.stat(main_file, function(error, stats){
			if(stats)
			{
				//load main page
				response.sendFile(main_file);
			}
			else
			{
				//redirect to login page
				response.redirect('/'+courseName+'/login');
			}
		});
	});


	/******** Report Functionality ********/

	/***************************************
				Course Summary
	****************************************/

	app.get('/'+courseName+'/course_summary', function(request, response){

		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;
		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}
		//render the Course Overview page
		if(isAnInstructor(session))
			renderPage(session, response, 'coursesummaryPage', 'Course Summary - ' + courseFullName);
		else
			//if not a instructor then send them to the main page
			response.redirect('/'+courseName);
	});

	app.post('/'+courseName+'/course_summary', function(request, response){
		var session = CheckLoggedin(request.session);
		if(!session)
		{
		   	return;
		}
		//if the user isn't an instructor the don't allow them to see a page
		if(isAnInstructor(session))
		{
			// retrive all the data in the database
			student_YNRQ_DB.find({courseid: courseID}).exec(function(error, results){

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
					
					//get all the students that are in this course
					UserToCourseDB.find({courseid: courseID}).exec(function(error, students){

						//create an or statment that includes all the students pulled in the UserToCourse Table
						//NOTE: this will pull the instructors too, but and and statment is added to filiter them out
						var OrStatement = [];
						students.forEach(function (student){
							OrStatement.push({ userid: student.userid })
						});
						var query = {$and:  [{ isInstructor:false, $or : OrStatement }] };

						//query the user table for the sid of the students
						UserDB.find(query).select({userid: 1, sid: 1}).exec(function(error, results){
							if(results.length > 0)
							{
								//rename each userid to be its sid equivalent
								results.forEach(function(item){
									_renameProperty(studStats, item.userid, item.sid);
								});

								//matches lecture name with lecture id for there to be a right naming on webpage
								Lecture_ID_Name.find({courseid: courseID}).exec(function(error, results){
									if(results.length > 0)
									{
										//rename each lectureID to lecture title
										results.forEach(function(item){
											_renameProperty(lecStats, item.lectureID, item.lecture_title);
										});
										//send the results to the Instructor
										response.send({studStats: studStats, lecStats: lecStats});		
									}
								});
							}
						});

					});
				}
			});
		}
	});



	/***************************************
				Course Report
	****************************************/

	app.get('/'+courseName+'/course_report', function(request, response){
		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;
		//easy access to the session variable
		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}
		if(isAnInstructor(session)){
			//if instructor the retrive the sid for the query data.
			var sid = request.query.sid;

			//find the userid for the sid that was given
			UserDB.find({sid: sid}).limit(1).select({userid: 1}).exec(function(error, results){
				if(error)
				{
					//if error with database register console ther DB error and render the page with an error message
					console.log("Course Report, Instructor, find userid for sid, Error: " + error);
					renderPage(session, response, 'course_report', "Course Report - " + courseFullName, {error: "Error searching for the Userid in the UserDB Table"});
					return;
				}
				if(results.length > 0)
				{
					UserToCourseDB.find({userid:results[0].userid, courseid: courseID}).limit(1).exec(function(error, studInCourse){
						if(error)
						{
							//if error with database register console ther DB error and render the page with an error message
							console.log("Course Report, Instructor, find userid for sid, Error: " + error);
							renderPage(session, response, 'course_report', "Course Report - " + courseFullName, {error: "Error searching for the Userid in the UserDB Table"});
							return;
						}

						if(studInCourse.length > 0)
						{
							//render the course_report
							course_report(session, response, results[0].userid, sid)
						}
						else
						{
							//when no student is found, render page with errror message
							renderPage(session, response, 'course_report', "Course Report - " + courseFullName, {error: "Unable to find Student"});
						}
					});
				}
				else
				{
					//when no student is found, render page with errror message
					renderPage(session, response, 'course_report', "Course Report - " + courseFullName, {error: "Unable to find Student"});
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

	app.get('/'+courseName+'/course_report_list', function(request, response){
		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;
		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}
		//run only if the instructor request the page
		if(isAnInstructor(session)){
			//get all the students that are in this course
			UserToCourseDB.find({courseid: courseID}).exec(function(error, students){

				//create an or statment that includes all the students pulled in the UserToCourse Table
				//NOTE: this will pull the instructors too, but and and statment is added to filiter them out
				var OrStatement = [];
				students.forEach(function (student){
					OrStatement.push({ userid: student.userid })
				});
				var query = {$and:  [{ isInstructor:false, $or : OrStatement }] };

				//get all user that are students, retrive only the id's
				UserDB.find(query).select({sid:1}).exec(function(error, results){
					if(error)
					{
						//if error with database register console ther DB error and render the page with an error message
						console.log("Course Report List, Instructor, find the list of userid's, Error: " + error);
						renderPage(session, response, 'course_report', "Course Report - " + courseFullName, {error: "Error searching for the Userid in the UserDB Table"});
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

						students.sort();

						//render the course list page and send the student names there
						renderPage(session, response, 'course_report_list', 'Course Report - List of Students - ' + courseFullName,  {students: students});
					}
					else
						//when not responses in the database, send error message
						renderPage(session, response, 'course_report_list', 'Course Report - List of Students - ' + courseFullName,  {error: "Unable to find the users in the Database."});
				});
			});
		}
		else
			//send the user back to the main page
			response.redirect('/' + courseName);
	});

	function course_report(session, response, studentid, sid)
	{
		//search for all response's for the user
		student_YNRQ_DB.find({courseid: courseID}).exec(function(error, results){
			if(error)
			{
				//if error with database register console ther DB error and render the page with an error message
				console.log("Course Report, error geting reponses from the student_binary_responseDB database, Error: " + error);
				renderPage(session, response, 'course_report', (sid)?"Course Report - " + sid + " - " + courseFullName:"Course Report - " + courseFullName , {error: "Unable to access the database."});
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
				// ----U		- 1 response
				// ----D		- 0 response
				// ----UNK	  - -1 response
				// ----length   - the total number of responses (U+D+UNK)
				results.forEach(function(item){
					updateReportData(allStats, item.lecture, item);
					//if the item's studentid matches the userid given then do a seperate calc for the student
					if(item.studentid === studentid)
						updateReportData(studStats, item.lecture, item);
				});

				Lecture_ID_Name.find({courseid: courseID}).exec(function(error, results){
					if(results.length > 0)
					{
						//rename each lectureID to lecture title
						results.forEach(function(item){
							_renameProperty(studStats, item.lectureID, item.lecture_title);

							_renameProperty(allStats, item.lectureID, item.lecture_title);
						});
						//render the course report with student stats and all student stats
						renderPage(session, response, 'course_report', (sid)?"Course Report - " + sid + " - " + courseFullName:"Course Report - " + courseFullName , {studentid: sid, student: studStats, avgstudents: allStats});
					}
				});	
			}
			else
				//when not responses in the database, send error message
				renderPage(session, response, 'course_report', (sid)?"Course Report - " + sid + " - " + courseFullName:"Course Report - " + courseFullName , {error: "Unable to get responses from the database."});

		});
	}



	/***************************************
				Lecture Summary
	****************************************/

	app.get('/'+courseName+'/lecture_summary', function(request, response){
		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;
		//easy access to the session data
		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}
		//run only if the user is the instructor
		if(isAnInstructor(session)){
			//get the lecture that is wanted to be looked at
			var lecture_title = request.query.lecture;

			Lecture_ID_Name.find({lecture_title: lecture_title, courseid: courseID}).select({lectureID: 1}).exec(function(error, results){
				if(results.length > 0)
				{
					var lecture = results[0].lectureID;
					//get all the response that are for that lecture
					student_YNRQ_DB.find({lecture: lecture, courseid: courseID}).exec(function(error, results){
						if(error)
						{
							//if error accessing DB, console error, and render error message page
							console.log("Lecture Summary, Instructor, error accessing the student_binary_responseDB database, Error: " + error);
							renderPage(session, response, 'lecture_summary', 'Lecture Summary - ' + lecture + " - " + courseFullName,  {error:"Unable to access database."});
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
							// ---U		- 1 response
							// ---D		- 0 response
							// ---UNK	  - -1 response
							// ---length   - the total number of responses (U+D+UNK)
							results.forEach(function(item){
								lectureOverviewReport(secStats, item.section, item);
								lectureOverviewReport(studStats, item.studentid, item);
							});
							
							//get all the students that are in this course
							UserToCourseDB.find({courseid: courseID}).exec(function(error, students){

								//create an or statment that includes all the students pulled in the UserToCourse Table
								//NOTE: this will pull the instructors too, but and and statment is added to filiter them out
								var OrStatement = [];
								students.forEach(function (student){
									OrStatement.push({ userid: student.userid })
								});
								var query = {$and:  [{ isInstructor:false, $or : OrStatement }] };

								//get all the students in the userDb
								UserDB.find(query).select({userid: 1, sid: 1}).exec(function(error, results){
									if(error)
									{
										//if error accessing DB, console error, and render error message page
										console.log("Lecture Summary, Instructor, error accessing the UserDB database, Error: " + error);
										renderPage(session, response, 'lecture_summary', 'Lecture Summary - ' + lecture + " - " + courseFullName,  {error:"Unable to access database."});
										return;
									}
									if(results.length > 0)
									{
										//replace all userid with the equivalent sid
										results.forEach(function(item){
											_renameProperty(studStats, item.userid, item.sid);
										});
										
										//render the results
										renderPage(session, response, 'lecture_summary', 'Lecture Summary - ' + lecture + " - " + courseFullName,  {sections: secStats, students: studStats , lecture: lecture_title});
									}
									else
									{
										//when not responses in the database, send error message
										renderPage(session, response, 'lecture_summary', 'Lecture Summary - ' + lecture + " - " + courseFullName,  {error:"Unable to get users from the database."});
									}
								});
							});
						}
						else
						{
							//when not responses in the database, send error message
							renderPage(session, response, 'lecture_summary', 'Lecture Summary - ' + lecture + " - " + courseFullName,  {error:"Unable to get responses from the database."});
						}
					});
				}
			});

		}
		else
			//send the user back to the main page
			response.redirect('/' + courseName);
	});

	app.get('/'+courseName+'/lecture_summary_list', function(request, response){
		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;
		//check session
		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}
		//run only if the user is an instructor
		if(isAnInstructor(session)){
			Lecture_ID_Name.find({courseid: courseID}).exec(function(error, results){
				if(error)
				{
					//if error accessing DB, console error, and render error message page
					console.log("Lecture Summary list, Instructor, error accessing the student_binary_responseDB database, Error: " + error);
					renderPage(session, response, 'lecture_summary_list', 'Lecture Summary - List of Lectures' + " - " + courseFullName,  {error:"Unable to access database."});
					return;
				}

				if(results.length > 0)
				{
					var lectures = [];

					//create a list with just the lecture_titles
					results.forEach(function(item){
						lectures.push(item.lecture_title);
					});

					lectures.sort();
					renderPage(session, response, 'lecture_summary_list', 'Lecture Summary - List of Lectures' + " - " + courseFullName,  {lectures: lectures});
				}
				else
				{
					renderPage(session, response, 'lecture_summary_list', 'Lecture Summary - List of Lectures' + " - " + courseFullName,  {error:"Unable to get Lecture for database."});
				}
			});
		}
		else
			//send the user to the main page
			response.redirect('/');
	});



	/***************************************
				Lecture Report
	****************************************/

	app.get('/'+courseName+'/lecture_report', function(request, response){
		//check to be sure there is a session
		if(!CheckSession(request.session, response))
			return;
		//get the lecture from the request
		var session = CheckLoggedin(request.session);
		if(!session)
		{
			response.redirect('/' + courseName);
		   	return;
		}
		var lecture = request.query.lecture;
		
		if(isAnInstructor(session)){
			sid = request.query.sid;
			//find the userid for the sid that was given
			UserDB.find({sid: sid}).limit(1).select({userid: 1}).exec(function(error, results){
				if(error)
				{
					//if error accessing DB, console error, and render error message page
					console.log("Lecture Report, Instructor, error accessing the UserDB database, Error: " + error);
					renderPage(session, response, 'lecture_report', 'Lecture Report' + " - " + courseFullName,  {error:"Unable to access database."});
					return;
				}

				if(results.length > 0)
				{
					UserToCourseDB.find({userid:results[0].userid, courseid: courseID}).limit(1).exec(function(error, studInCourse){
						if(error)
						{
							//if error accessing DB, console error, and render error message page
							console.log("Lecture Report, Instructor, error accessing the UserDB database, Error: " + error);
							renderPage(session, response, 'lecture_report', 'Lecture Report' + " - " + courseFullName,  {error:"Unable to access database."});
							return;
						}

						if(studInCourse.length > 0)
						{
							//render the course_report
							lecture_report(session, response, lecture, sid, results[0].userid);
						}
						else
							//no sid in the database, render page with error message
							renderPage(session, response, 'lecture_report', 'Lecture Report' + " - " + courseFullName,  {error:"Unable to find Student ID in the database"});
					});
				}
				else
					//no sid in the database, render page with error message
					renderPage(session, response, 'lecture_report', 'Lecture Report' + " - " + courseFullName,  {error:"Unable to find Student ID in the database"});
			}); 
		}
		else{
			lecture_report(session, response, lecture, session.sid, session.userid);
		}
	});

	function lecture_report(session, response, lecture_title, sid, student)
	{
		Lecture_ID_Name.find({lecture_title: lecture_title, courseid: courseID}).select({lectureID: 1}).exec(function(error, results){
			if(results.length > 0)
			{
				var lecture = results[0].lectureID;
				//search for all response's for the user
				student_YNRQ_DB.find({lecture:lecture, courseid: courseID}).exec(function(error, results){
					if(error)
					{
						//if error accessing DB, console error, and render error message page
						console.log("Lecture Report, error accessing the student_binary_responseDB database, Error: " + error);
						renderPage(rsession, response, 'lecture_report', 'Lecture Report' + " - " + courseFullName,  {error:"Unable to access database."});
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
						renderPage(session, response, 'lecture_report', 'Lecture Report - ' + lecture + " - " + courseFullName, {stud_lec: {lecture: lecture_title, student: sid}, student_stats: studStats, all_stats: allStats});
					}
					else
					{
						//no result, render page with error message
						renderPage(session, response, 'lecture_report', 'Lecture Report' + " - " + courseFullName,  {error:"Unable to get responses for the database database."});
					}
				});
			}
		});
	}
}




/***************************************
		Build JSON Data Structure
****************************************/

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


/***************************************
		DB Insert Functionality
****************************************/

function searchDBForResponse(DB, searchQuery, newResponse, status)
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
					if(status)
						status(false);
				}
				if(status)
					status(newResponse);
			});
		}
		else//if there isn't already an item, add the item to the database
		{
			saveNewResponse(DB, newResponse, status);
		}
	});
}

function saveNewResponse(DB, value, status)
{
	//save the value to the binary response db reutrn 
	new DB(value).save(function(error){
		if(error){ // if there was an error then return what print out the user, the lecture and the title of the tag
			console.log("Error adding Default response for user: " + session.sid + ", lecture: " + lecture + ", value: " + JSON.stringify(value) + ", Error: " + error);
			if(status)
				status(false);
		}
		else
		{
			if(status)
				status(value);
		}
	});
}

function searchDBForResponseNoReplace(DB, searchQuery, newResponse, status)
{
	//search to see if there is already an item with the correct id's
	DB.find(searchQuery).limit(1).exec(function(error, results){
		//if there is already an item update it
		if(results.length > 0)
		{
			if(status)
				status(results[0]);
		}
		else//if there isn't already an item, add the item to the database
		{
			saveNewResponse(DB, newResponse, status);
		}
	});
}


/***************************************
		Socket.IO Functionality
****************************************/

io.on('connection', function(socket){
	
	//set up the server connection, by having the lecture id sent to the server
	socket.on('lecture_server_setup', function(lectureDetails){

		var lecture = lectureDetails.lectureID;
		var lecture_title = lectureDetails.title;
		var courseID = lectureDetails.courseID;
		var session = {};
		if(socket.request.session.course)
		{
			var session = socket.request.session.course[courseID];
			if(!session || !session.userid)
				return;
		}
		else
			return;

		//if the lecture title/ID isn't in the DB add it, this is to have the name and ID combo for the reports
		searchDBForResponse(Lecture_ID_Name, {lectureID: lecture, courseid: courseID}, {lectureID: lecture, lecture_title: lecture_title, courseid: courseID});

		//send user to right room
		// in this room it is easier to send a message to all students
		socket.join(lecture);/*can have a function call back for any error*/
	  
		//setup the functionality of the lecture 
		socket.emit('lecture_client_setup', isAnInstructor(session));

		if(isAnInstructor(session))
		{
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
					section : request.section,
					courseid: courseID
				};

				//search the database for each in the lecture and seciton
				student_YNRQ_DB.find(query).select({response: 1, tag_title: 1}).exec(function(error, results){
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
					multi_title: request.title,
					courseid: courseID
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
		else // is a student
		{
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
					response: response_data.response,
					courseid: courseID
				};
				//setup search item
				var searchQuery = {
					lecture: lecture,
					studentid: session.userid,
					section: response_data.section,
					tag_title: title,
					courseid: courseID
				};

				searchDBForResponse(student_YNRQ_DB, searchQuery, newResponse);
			});
		   
			//called when the user check for the status of there current tag
			socket.on('check_YNRQs_status', function(titles_section){
				
				var titles = titles_section.titles;

				//set up the database query
				var searchQuery = {
					lecture: lecture,
					studentid: session.userid,
					section: titles_section.section,
					courseid: courseID
				};

				//check if ther exists	 a response for a tag from the specific user
				student_YNRQ_DB.find(searchQuery).select({response: 1, tag_title: 1}).exec(function(err, results){
					if(results.length > 0)
					{
						//create object with the titles keys for the given responses
						var dbtags = {};
						results.forEach(function(tag){
							dbtags[tag.tag_title] = tag.response;
						});

						//for each YNRQ title send over, return their reponse value.
						//if not response yet set to -1 in db
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

								saveNewResponse(student_YNRQ_DB, searchQuery);
							}
						});
					}
					else
					{
						//if no YNRQ then set values for each YNRQ to -1
						var tag_responses = [];
						titles.forEach(function(tag){
						
							//create the new record and save the record
							tag_responses.push({title: tag, response: -1});
							searchQuery.tag_title = tag;
							searchQuery.response = -1;
							
							saveNewResponse(student_YNRQ_DB, searchQuery);
					   });
					}   
					//return the resposes of the YNRQs
					socket.emit('YNRQs_status', {tag_responses: tag_responses, section: titles_section.section});
				});		
			});

			//when the student sends a response to the server, update/add that data to the code
			socket.on('student_multiple_response', function(response_data){
				//add to the database
				var title = response_data.title;

				//setup database item
				var newResponse = {
					lecture: lecture,
					studentid: session.userid,
					multi_title: title,
					response: response_data.response,
					courseid: courseID
				};
				//setup search item
				var searchQuery = {
					lecture: lecture,
					studentid: session.userid,
					multi_title: title,
					courseid: courseID
				};
			
				searchDBForResponse(student_multiple_choice_ResponseDB, searchQuery, newResponse);
			});

			//called when the user check for the status of there current tag
			socket.on('check_multiple_choice_status', function(status_request){
				//set up the database query
				var searchQuery = {
					lecture: lecture,
					studentid: session.userid,
					multi_title: status_request.title,
					courseid: courseID
				};
			
				//check if ther exists	 a response for a tag from the specific user
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

		socket.on('check_multiple_choice_question', function(request){
			
			//set up search Queary with the title, the lecture id and the courseid
			var searchQuery = {
				title: request.title,
				lecture: lecture,
				courseid: courseID
			};


			//search to see if there is already an item with the correct id's
			multiple_choice_lecture_statusDB.find(searchQuery).limit(1).exec(function(error, results){
				//if there is already an item update it
				if(results.length > 0)
				{
					if(!results[0].status){
						SendMutipleChoiceResults(request.title);
					}
				}
				else
				{
					//if nothing in the table then set up default vale to 
					//status - true => true that the question is open
					//answer => anwser to the question
					searchQuery.status = true;
					searchQuery.answer = request.answer;
					saveNewResponse(multiple_choice_lecture_statusDB, searchQuery);
				}
			});
		});

		socket.on('close_multiple_choice_question', function(title){
			//setup the search query, with title, leactureid and courseid
			var searchQuery = {
				title: title,
				lecture: lecture,
				courseid: courseID
			};

			//new resonpse of the closed question
			var newResponse  = {
				title: title,
				lecture: lecture,
				status: false, // aka closed
				courseid: courseID
			};

			//search and save the closed question
			searchDBForResponse(multiple_choice_lecture_statusDB, searchQuery, newResponse);

			//send the resutls that the question is closed
			SendMutipleChoiceResults(title);
		});

		function SendMutipleChoiceResults(title)
		{
			// the right lecture, slide number and tag title
			var query = {
				lecture : lecture,
				multi_title: title,
				courseid: courseID
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
		}

		//when disconnecting for the server, check if the user can be removed
		socket.on('disconnect', function(){
			//remove the user for the room
			socket.leave(session.lecture);
		});
	});
});


/***************************************
		New Course Pages
****************************************/

function new_course_Auth(request, response)
{
	//get session and make sure course is initalized
	var session = request.session;
	if(!session.course){
		//send an access denied and exit
		response.send("Access Denied");
		return false;
	}

	//go through each course that the user is signed in on
	//all of the must be sighed in as Instructor to access the new_course page
	Object.keys(session.course).forEach(function(courseID){
		if(!session.course[courseID].isInstructor){
			response.send("Access Denied");
			return false;
		}
	});

	return true;
}

app.get('/new_course', function(request, response){

	//check if access is avaiable
	if(!new_course_Auth(request, response))
		return;
	
	//send newCourse page
	response.sendFile(__dirname + "/public/newCourse.html");
});

app.post('/new_course', function(request, response){

	//check if access is avaiable
	if(!new_course_Auth(request, response))
		return;

	//if empty information, the don't do anything
	if(request.body.name === "" || request.body.description === "")
	{
		response.send("<h1>Please Enter Course Information</h1>");
		return;
	}
	//create search query
	var searchQuery = {
		coursename : request.body.name
	};

	//create new response for db
	var newResponse = {
		coursename : request.body.name,
		coursedesc : request.body.description,
		courseid : uuid.v4()
	};

	//check if the table aready contains the course name
	searchDBForResponseNoReplace(CourseDB, searchQuery, newResponse, function(status){
		if(status)
		{

			if(newResponse.courseid !== status.courseid)
			{
				response.send("<h1>Course Already Exists</h1>");
				return;
			}
			//make directory, lecture directory and 
			var courseName = status.coursename.replace(/ /g, "").toLowerCase();
			var course_folder = __dirname + "/public/" + courseName;
			var lecture_folder = course_folder + "/lectures"; 

			//make the course directory
			fs.mkdir(course_folder, function(error){
				if(!error)
				{
					//make the lectures directory
					fs.mkdir(lecture_folder, function(error){
						if(!error)
						{
							//save that this instructor is an instructor for this new course
							saveNewResponse(UserToCourseDB, {userid: request.session.course[Object.keys(request.session.course)[0]].userid, courseid: status.courseid}, function(isInstructor){
								if(isInstructor)
								{
									//output what was inserted and a link ot the location.
									var resp = "";
									resp += "<h1>Added <a href='/"+ status.coursename.replace(/ /g, "").toLowerCase() +"/login'>" + newResponse.coursename + "</a> to the Course Table.</h1>";
									resp += "<ul>";
									resp += "<li>Course Name: " + status.coursename + "</li>";
									resp += "<li>Course Description: " + status.coursedesc + "</li>";
									resp += "<li>Course ID: " + status.courseid + "</li>";
									resp += "</ul>"

									//load the new course that was created
									LoadCourse(status);
									//send the data to the instructor
									
									response.send(resp);
								}
								else
								{
									response.send("<h1>Error Added You As An Instructor</h1>");
								}
							});
						}
						else
						{
							response.send("<h1>Error Making the Lecture Directory</h1>");
						}	
					});
				}
				else
				{
					response.send("<h1>Error Making the Course Directory</h1>");
				}

			})
		}
	});
});

app.get('/course_preview', function(request, response){

	//check if access is avaiable
	if(!new_course_Auth(request, response))
		return;

	//get and setup the values for the preview page
	var courseName = request.query.courseName.replace(/ /g, "");
	var courseFullName = request.query.courseName;
	var courseDes = request.query.courseDescription;

	//set up the default parameters for the render function
	var pageParams = {
		title: "Login" + " - " + courseFullName,
		loggedin: true,
		isInstructor: true,
		coursename: courseFullName,
		description: courseDes,
		courselocationname: courseName
	};

	//render the page with its parameters
	response.render('loginPage', pageParams);  
});


/***************************************
			Run Server
****************************************/

//listen for a connection
http.listen(app.get('port'), function(){
	console.log('Server started. Listening at *:' + app.get('port'));
});
