var socket = io();//'http://sci54.science.uoit.ca:3000');

//set up the canvas, its id and its size
var ChartHTML = $('<canvas id="student_chart" style="text-align:center; height: 400px; width: 400px" height="400" width="400"></canvas>');

var IsInstuctor;

//name of the tag tiles, and the color assigned to each tag
var tag_color = {};
var tag_titles = [];
var tag_section;

//speed that the timer ticks
var timerSpeed = 1000;
var timer = null;

//variable for the radarChart and its data
var radarChart = null;
var radar_chart_data = {};

//debug purpose
var cnt = 0;

//add item to show when the chart is ready, and add the chart to the screen
$('#speaker-controls').append('<div id="loading-text" style="text-align:center">Loading</div>');


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
//	have the current lecture send the binary tags, 
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

			ParseTags(tag_titles, tag_section);

			socket.on('YNRQ_chart_data', function(chart_data){
				//when the chart data comes in, parse it, and save the data
				updateTagChartData(chart_data);
			});
		}
	});
}


//listen for a message that contains the xml tags,
window.addEventListener('message',function(event){
	//parse the message data
	var data = JSON.parse( event.data );
	//if the Tags field exists
	if(data.YNRQuestion){
		HideButton();
		stopTimer();
		//send the tags to be updated
		ParseTags(data.YNRQuestion.YNRQs, data.YNRQuestion.section);
	}
	else if (data.MultipleChoice)
	{
		HideButton();
		stopTimer();
		ActivateBarChart(data.MultipleChoice.title, data.MultipleChoice.length);
	}
	else if(data.courseID && data.lectureID)
	{
		setup_socketio(data);
	}
	
});



//update the chart info with the tags that where received by the post message
function ParseTags(tags, section)
{
	//make sure that when there are no tags that nothing updates
	if(!tags || !section)
	{
		tag_section = null;
		tag_titles = null;
		//clean chart
		
		CleanCharts();
		return;
	}

	if(IsInstuctor)
	{
	 	//set the current chat data to be a template for data to be inputed
		radar_chart_data = {
			labels: tags.slice(),//["Yes","No","unknown"],
			datasets: [{}]
		};

		tag_section = section;
		tag_titles = tags.slice();

		setupRadarData(tags, section)

		//update the tag data
		updateAllTagChartData(section);

		timer = setTimeout(function(){Timer();}, timerSpeed/4);
	}
	else
	{
		tag_section = section;

		tag_titles = tags.slice();
	}
}

function setupRadarData(tags, section)
{
	//extra
 	var rgb;
	if(!tag_color[section])
		tag_color[section] = randRGB();
	rgb = tag_color[section];

	//reset the chart dat and set the chart data, label, and other field
	radar_chart_data.datasets[0] = {};
	radar_chart_data.datasets[0].data = tags.slice();
	radar_chart_data.datasets[0].data.forEach(function(item){ item = 0;});
	radar_chart_data.datasets[0].pointBorderColor = "#fff";
	radar_chart_data.datasets[0].pointHoverBackgroundColor = "#fff";
	radar_chart_data.datasets[0].label = 'Tag Status - ' + section;
	
	//set the color for chart data
	radar_chart_data.datasets[0].backgroundColor = RGBA(rgb, '0.2');
	radar_chart_data.datasets[0].borderColor = RGBA(rgb, '1');
	radar_chart_data.datasets[0].pointBackgroundColor = RGBA(rgb, '1');
	radar_chart_data.datasets[0].pointHoverBorderColor = RGBA(rgb, '1');
}

function updateAllTagChartData(section)
{
	socket.emit('get_YNRQ_chart_data', {section: section, tags: tag_titles});
}

function updateTagChartData(chart_data)
{
	Object.keys(chart_data).forEach(function(item){
		var data = chart_data[item];
		var index = data.index;

		var tag_val = (data.U/(data.U+data.D));

		radar_chart_data.datasets[0].data[index] = tag_val;
	});
}

//updates the pie chart with the data in the "data" variable
function updateRadarChart()
{
	//if there isn't a pieChart, don't destroy it
	// if(radarChart !== null)
	//	 if it is not destroyed each time, an error occurs where
	//	 *mutliple graphs are on top of each other, and when moving
	//	 *the mouse over the graph old data will be shown along with new data
		
	//	 radarChart.destroy();
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

function stopTimer()
{
	clearTimeout(timer);
}

//timer for constantly updating the graph graph
function Timer()
{
	//a try statement so if there is a problem with the data, the timer doesn't stop
	try
	{
		if(tag_titles && tag_section && IsInstuctor){
			//update the char data, the display the chart
			updateAllTagChartData(tag_section);
			updateRadarChart();
		}
	}
	catch(err)
	{
		//if there is an error, show it
		console.log(err)
	}
	//start the timer over, waiting a set amount of time
	timer = setTimeout(function(){Timer();}, timerSpeed);
}


function CleanCharts()
{
	if(radarChart !== null)
		radarChart.destroy();
	if(barChart !== null)
		barChart.destroy();
}


//timer for constantly updating the graph graph
function Timer2()
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
	timer = setTimeout(function(){Timer2();}, timerSpeed);
}

var barData = null
var multi_title = '';
var multi_len = 0;
var barChart = null;
var options = {
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

function ActivateBarChart(title, length)
{
	//make sure that when there are no tags that nothing updates
	if(!title || length === 0)
	{
		console.log("called1")
		
		multi_title = '';
		multi_len = 0;
		//clean chart
		CleanCharts();
		return;
	}

	if(IsInstuctor)
	{
		BarChartDataSetup(length);

		getBarChartDataFromServer(title);   
		renderBarChart();
		ShowButton();
		timer = setTimeout(function(){Timer2();}, timerSpeed/4);
	}

	multi_title = title;
	multi_len = length;
}

function getBarChartDataFromServer(title)
{
	socket.emit('get_chart_multiple_choice_data', {title: title});
}

socket.on('chart_multiple_choice_update', function(chart_data){
	updateBarChartData(chart_data);
});


function BarChartDataSetup(length)
{
	var data = {};
	data.labels = [];
	data.datasets = [];


	data.datasets.push({
		
		borderWidth : 1,
		borderColor : [],
		backgroundColor : [],
		data : []
	});


	
	for(var cnt = 0; cnt < length; cnt++){
		data.labels.push('Answer '+ (cnt + 1));
		data.datasets[0].data.push(0);
		var color = randRGB();
		data.datasets[0].borderColor.push(RGBA(color, 1));
		data.datasets[0].backgroundColor.push(RGBA(color, 0.2));

	}

	barData = data;
}

function updateBarChartData(chart_data)
{
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

	barData.datasets[0].label = '% of Responses';

	options.title = {
		display: true,
		text: "# of Responses Vs. # Active Users: " + activeUsers + ' vs. '+ chart_data.length
	}
}

function chartFormat(score, length)
{
	return ((length === 0) ? 0 :(score/length) * 100);
}

function renderBarChart()
{
	CleanCharts();
	barChart = new Chart(ChartHTML, {
		type: 'bar',
		data: barData,
		options: options
	});
}


function HideButton()
{
	$('#close_question').css('display', 'none');
}

function ShowButton()
{
	$('#close_question').css('display', '');
}

function Button_click()
{
	socket.emit('close_multiple_choice_question', multi_title);
}
