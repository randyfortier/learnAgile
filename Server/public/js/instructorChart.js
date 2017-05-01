var socket = io();

//set up the canvas, its id and its size
var ChartHTML = $('<canvas id="student_chart" style="text-align:center; height: 400px; width: 400px" height="400" width="400"></canvas>');

//add item to show when the chart is ready, and add the chart to the screen
$('#speaker-controls').append('<div id="loading-text" style="text-align:center">Loading</div>');

var IsInstuctor;


/**************************
	   YNRQ Variables
***************************/

//name of the tag tiles, and the color assigned to each tag
var YNRQ_color = {};
var YNRQ_titles = [];
var YNRQ_section;

//speed that the timer ticks
var timerSpeed = 1000;
var chart_timer = null;

//variable for the radarChart and its data
var radarChart = null;
var radar_chart_data = {};


/**************************
	   MCRQ Variables
***************************/

//varables for the MCRQ
var multi_title = '';
var multi_len = 0;

//bar chart variables
var barData = null;
var barChart = null;
var barChartOptions = {
	responsive: false,
	animation: false,
	scales: {
		yAxes:[{
			ticks: {
				min : 0,
				max : 100,
				maxTicksLimit: 4,
				stepSize: 25
			}
		}]
	}
}


/****************************************
		Loading Functionality
*****************************************/

//code to repeatily look for the iframe that contians the current lecture
//wait untill the iframes load
function findLecture()
{
	//get iframe of current slide
	var lecture = $('#current-slide').children();

	//if no iframe, look agian in another 1 second
	if(lecture.length === 0)
	{
		//continue searching for the lecture
		findLecture_timer = setTimeout(findLecture, 1000);
		return;
	}
	else
	{
		//found lecture, load the data of the lecture
		load_Lecture(lecture[0]);
	}
}

//inital look for the currect_slide iframe
var findLecture_timer = setTimeout(findLecture, 2000);

//setup the info for the current_leccture slide,
//handles:
//	have the current lecture send the binary YNRQs, 
//	get the lecture id
//	send up conneciton to receive the chart data via socket.io
function load_Lecture(lecture)
{
	//send postmessage to curent_slide iframe to have them send binary tag data
	lecture.contentWindow.postMessage(JSON.stringify({
		name: "current"
	}), '*');
}


function setup_socketio(data)
{
	//setup connection with server
	data.title = $($('#current-slide').children()[0]).contents().find('title').text();
	socket.emit('lecture_server_setup', data);
	
	//setup the lecture for the instructor, not a client
	socket.on('lecture_client_setup', function(isInstuctor){
		IsInstuctor = isInstuctor;
		if(isInstuctor)
		{
			//send the loading text to show that the slide is ready
			$('#loading-text').text("Ready");
			$('#speaker-controls').append(ChartHTML);
			$('#speaker-controls').append('<button style="display:none" id="close_question">Close Question</button>');
			$('#close_question').click(Button_click);

			ParseYNRQs(YNRQ_titles, YNRQ_section);

			socket.on('YNRQ_chart_data', function(chart_data){
				//when the chart data comes in, parse it, and save the data
				updateTagChartData(chart_data);
			});
		}
	});
}


//listen for a message that contains the xml YNRQs,
window.addEventListener('message',function(event){
	//parse the message data
	var data = JSON.parse( event.data );
	//if the YNRQs field exists
	if(data.YNRQuestion){
		HideButton();
		stopTimer();
		//send the YNRQs to be updated
		ParseYNRQs(data.YNRQuestion.YNRQs, data.YNRQuestion.section);
	}
	else if (data.MultipleChoice)
	{
		HideButton();
		stopTimer();
		//show the bar chart and get the values for the server
		ActivateBarChart(data.MultipleChoice.title, data.MultipleChoice.length);
	}
	else if(data.courseID && data.lectureID)
	{
		//setup the socket.io functionality with the courseID and the lecrtureID
		setup_socketio(data);
	}
});



/***************************************
		YNRQ Functionality
****************************************/

//update the chart info with the YNRQs that where received by the post message
function ParseYNRQs(YNRQs, section)
{
	//make sure that when there are no YNRQs that nothing updates
	if(!YNRQs || !section)
	{
		YNRQ_section = null;
		YNRQ_titles = null;
		
		//clean chart
		CleanCharts();
		return;
	}

	//only show the chart user is an instructor
	if(IsInstuctor)
	{
	 	//set the current chat data to be a template for data to be inputed
		radar_chart_data = {
			labels: YNRQs.slice(),//["Yes","No","unknown"],
			datasets: [{}]
		};

		//set the seciton and and title of the YNRQ
		YNRQ_section = section;
		YNRQ_titles = YNRQs.slice();

		setupRadarData(YNRQs, section)

		//update the tag data
		updateAllYNRQChartData(section);

		chart_timer = setTimeout(function(){YNRQ_Timer();}, timerSpeed/4);
	}
	else
	{
		YNRQ_section = section;

		YNRQ_titles = YNRQs.slice();
	}
}

//timer for constantly updating the graph graph
function YNRQ_Timer()
{
	//a try statement so if there is a problem with the data, the timer doesn't stop
	try
	{
		if(YNRQ_titles && YNRQ_section && IsInstuctor){
			//update the char data, the display the chart
			updateAllYNRQChartData(YNRQ_section);
			updateRadarChart();
		}
	}
	catch(err)
	{
		//if there is an error, show it
		console.log(err)
	}
	//start the timer over, waiting a set amount of time
	chart_timer = setTimeout(function(){YNRQ_Timer();}, timerSpeed);
}


/***************************************
		Radar Chart Functionality
****************************************/

function setupRadarData(YNRQs, section)
{
	//extra
 	var rgb;
	if(!YNRQ_color[section])
		YNRQ_color[section] = randRGB();
	rgb = YNRQ_color[section];

	//reset the chart dat and set the chart data, label, and other field
	radar_chart_data.datasets[0] = {};
	radar_chart_data.datasets[0].data = YNRQs.slice();
	radar_chart_data.datasets[0].data.forEach(function(item){ item = 0;});
	radar_chart_data.datasets[0].pointBorderColor = "#fff";
	radar_chart_data.datasets[0].pointHoverBackgroundColor = "#fff";
	radar_chart_data.datasets[0].label = 'YNRQ Status - ' + section;
	
	//set the color for chart data
	radar_chart_data.datasets[0].backgroundColor = RGBA(rgb, '0.2');
	radar_chart_data.datasets[0].borderColor = RGBA(rgb, '1');
	radar_chart_data.datasets[0].pointBackgroundColor = RGBA(rgb, '1');
	radar_chart_data.datasets[0].pointHoverBorderColor = RGBA(rgb, '1');
}

function updateAllYNRQChartData(section)
{
	//send a message to the server to get the YNRQ data for the chart
	socket.emit('get_YNRQ_chart_data', {section: section, tags: YNRQ_titles});
}


function updateTagChartData(chart_data)
{
	//insert into the YNRQ_data the data for the server
	Object.keys(chart_data).forEach(function(item){
		var data = chart_data[item];
		var index = data.index;

		var YNRQ_val = (data.U/(data.U+data.D));

		radar_chart_data.datasets[0].data[index] = YNRQ_val;
	});
}

//updates the radat chart with the data in the "data" variable
function updateRadarChart()
{
	//clear the previous chart
	CleanCharts();

	//if ther is property's in the chart data, do nothing
	if(Object.keys(radar_chart_data).length === 0)
		return;

	//generate the chart onto the html, based on the mock data
	radarChart = new Chart(ChartHTML, {
		type: 'radar',
		data: radar_chart_data,
		options: {
			responsive: false,//stops the animation, so the update looks better
			animation: false,
			scale: {
				ticks: {
					maxTicksLimit: 4,
					stepSize: 0.25,
					max : 1,
					min : 0
					// fontSize: 20				
				}
			}
		}
	});
}


/***************************************
		Timer Functionality
****************************************/

function stopTimer()
{
	clearTimeout(chart_timer);
}



/***************************************
		MCRQ Functionality
****************************************/

//timer for constantly updating the graph graph
function MCRQ_Timer()
{
	//a try statement so if there is a problem with the data, the timer doesn't stop
	try
	{
		if(multi_title && multi_len !== 0 && IsInstuctor){
			//update the char data, the display the chart
			getBarChartDataFromServer(multi_title);
			renderBarChart();
		}
	}
	catch(err)
	{
		//if there is an error, show it
		console.log(err)
	}
	//start the timer over, waiting a set amount of time
	chart_timer = setTimeout(function(){MCRQ_Timer();}, timerSpeed);
}


function ActivateBarChart(title, length)
{
	//make sure that when there are no tags that nothing updates
	if(!title || length === 0)
	{
		multi_title = '';
		multi_len = 0;
		//clean chart
		CleanCharts();
		return;
	}

	//only run if you are instructor
	if(IsInstuctor)
	{

		//setup the bar chart and gett the data from the server
		BarChartDataSetup(length);
		getBarChartDataFromServer(title);   
		
		//show the chart and the button to close the question
		renderBarChart();
		ShowButton();
		
		//start the timer to update the bar chart
		chart_timer = setTimeout(function(){MCRQ_Timer();}, timerSpeed/4);
	}

	//set which mutiple choice question the progrma is on
	multi_title = title;
	multi_len = length;
}

function Button_click()
{
	//send the command to close the question
	socket.emit('close_multiple_choice_question', multi_title);
}


/***************************************
		Bar Chart Functionality
****************************************/

function getBarChartDataFromServer(title)
{
	//request from the server the current data on a specific mutiple choice question
	socket.emit('get_chart_multiple_choice_data', {title: title});
}

//listener for the return of the MCRQ chart data
socket.on('chart_multiple_choice_update', function(chart_data){
	updateBarChartData(chart_data);
});


function BarChartDataSetup(length)
{
	//setup the data, label and dataset variables
	var data = {};
	data.labels = [];
	data.datasets = [];


	//push the default values to the datset
	data.datasets.push({		
		borderWidth : 1,
		borderColor : [],
		backgroundColor : [],
		data : []
	});

	//set the colours for each bar
	for(var cnt = 0; cnt < length; cnt++){
		//push the label for the current question
		data.labels.push('Answer '+ (cnt + 1));
		data.datasets[0].data.push(0);
		//set colour to be random
		var color = randRGB();
		data.datasets[0].borderColor.push(RGBA(color, 1));
		data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
	}

	//set the bar data to be the template data we just created
	barData = data;
}

function updateBarChartData(chart_data)
{
	//clear the data and set up empty values
	barData.datasets[0].data = []
	for(var cnt = 0; cnt < multi_len; cnt++)
		barData.datasets[0].data.push(0);

	//get active users
	var activeUsers = chart_data.length - chart_data.inactive;

	//update chart with data for server
	Object.keys(chart_data.answers).forEach(function(item){
		var index = parseInt(item.replace('a_', ''));
		barData.datasets[0].data[index] = chartFormat(chart_data.answers[item], activeUsers);
	});

	//set the legend for the chart
	barData.datasets[0].label = '% of Responses';

	//set the title
	barChartOptions.title = {
		display: true,
		text: "# of Responses Vs. # Active Users: " + activeUsers + ' vs. '+ chart_data.length
	}
}

function renderBarChart()
{
	//clean away the previous chart and display the current Chart
	CleanCharts();
	barChart = new Chart(ChartHTML, {
		type: 'bar',
		data: barData,
		options: barChartOptions
	});
}



/****************************************
		Form Functionality
*****************************************/


function HideButton()
{
	$('#close_question').css('display', 'none');
}

function ShowButton()
{
	$('#close_question').css('display', '');
}


/****************************************
	  Chart Colour & Number Format
*****************************************/


function CleanCharts()
{
	//either of the charts are on the screen then delete them
	if(radarChart !== null)
		radarChart.destroy();
	if(barChart !== null)
		barChart.destroy();
}

function chartFormat(score, length)
{
	return ((length === 0) ? 0 :(score/length) * 100);
}

//return the format of chart.js rgba color
function RGBA(rgb, a)
{
	return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
}

//randomaly generate a color
function randRGB()
{
	return {r:rand(255), g:rand(255), b:rand(255)};
}

//random function that get the color from 0 to the max
function rand(max)
{
	return Math.floor(Math.random() * max);
}

