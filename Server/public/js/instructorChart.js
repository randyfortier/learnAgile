var socket = io('http://localhost:3000');

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


//add item to show when the chart is ready, and add the chart to the screen
$('#speaker-controls').append('<div id="loading-text" style="text-align:center">Loading</div>');
$('#speaker-controls').append(ChartHTML);


//code to repeatily look for the iframe that contians the current lecture
function findLecture()
{
	//get iframe of current slide
	var lecture = $('#current-slide').children();

	//if no iframe, look agian in another 1 second
	if(lecture.length === 0)
	{
		//continue searching for the lecture
		temp = setTimeout(findLecture, 1000);
		return;
	}
	else
	{
		//found lecture, load the data of the lecture
		load_Lecture(lecture[0]);
	}
}

//inital look for the currect_slide iframe
var temp = setTimeout(findLecture, 4000);


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
    
    //send the loading text to show that the slide is ready
    $('#loading-text').text("Ready");
	
	//send the user the lecture id
	socket.emit('lecture_server_setup', $(lecture).contents().find('title').text());
	
	//setup the lecture for the instructor, not a client
	socket.on('lecture_client_setup', function(isInstuctor){
		IsInstuctor = isInstuctor;
	    if(isInstuctor)
	    {
	        socket.on('chart_update', function(chart_data){
	            //when the chart data comes in, parse it, and save the data
	            updateTagChartData(chart_data);
	        });

	        //start timer to refresh the chart
			Timer();
	    }
	});
}


//2 post messages are send, which are identical, to the addEventListener.
//use onlyOnce, to stop the second message not be used.
var onlyOne = true;

//listen for a message that contains the xml tags,
window.addEventListener('message',function(event){
	//parse the message data
	var data = JSON.parse( event.data );
	//if the Tags field exists
	if(data.Tags){
		//have the first message only be caught
		if(onlyOne)
			//send the tags to be updated
			ParseTags(data.Tags.tags, data.Tags.section);
		onlyOne = !onlyOne;
	}
});



//update the chart info with the tags that where received by the post message
function ParseTags(tags, section)
{
	//make sure that when there are no tags that nothing updates
	if(!tags || !section)
	{
		tag_section = section;
	    tag_titles = tags;
		//clean chart
		if(radarChart !== null)
			radarChart.destroy();
		return;
	}

	if(IsInstuctor)
	{
	 	//set the current chat data to be a template for data to be inputed
	    radar_chart_data = {
	        labels: ["Yes","No","unknown"],
	        datasets: tags.slice()
	    };
	    tag_section = section;

	    tag_titles = tags.slice();

	    //update the tag data
	    updateAllTagChartData(section);
	}
}


function updateAllTagChartData(section)
{
    //for each title, send a request for it's tag data
    tag_titles.forEach(function(title, index){
        socket.emit('get_chart_data', {
                tag_title : title,
                section: section,
                index: index
            });
    });
}

function updateTagChartData(chart_data)
{
    //set the data in the chart.js format
    var data = [(chart_data.data.understand)?chart_data.data.understand:0, 
                (chart_data.data.dont)?chart_data.data.dont:0, 
                (chart_data.data.unknown)?chart_data.data.unknown:0];
    //set the color of the chart data, if no colour is assigned the generate a new color
    var rgb;
    if(!tag_color[chart_data.tag_title])
        tag_color[chart_data.tag_title] = randRGB();
    rgb = tag_color[chart_data.tag_title];

    //reset the chart dat and set the chart data, label, and other field
    radar_chart_data.datasets[chart_data.index] = {};
    radar_chart_data.datasets[chart_data.index].data = data;
    radar_chart_data.datasets[chart_data.index].pointBorderColor = "#fff";
    radar_chart_data.datasets[chart_data.index].pointHoverBackgroundColor = "#fff";
    radar_chart_data.datasets[chart_data.index].label = chart_data.tag_title;
    
    //set the color for chart data
    radar_chart_data.datasets[chart_data.index].backgroundColor = RGBA(rgb, '0.2');
    radar_chart_data.datasets[chart_data.index].borderColor = RGBA(rgb, '1');
    radar_chart_data.datasets[chart_data.index].pointBackgroundColor = RGBA(rgb, '1');
    radar_chart_data.datasets[chart_data.index].pointHoverBorderColor = RGBA(rgb, '1');
}

//updates the pie chart with the data in the "data" variable
function updateRadarChart()
{
    //if there isn't a pieChart, don't destroy it
    if(radarChart !== null)
        /*if it is not destroyed each time, an error occurs where
        *mutliple graphs are on top of each other, and when moving
        *the mouse over the graph old data will be shown along with new data
        */
        radarChart.destroy();

    //if ther is property's in the chart data, do nothing
    if(Object.keys(radar_chart_data).length === 0)
        return;

    //generate the chart onto the html, based on the mock data
    radarChart = new Chart(ChartHTML, {
        type: 'radar',
        data: radar_chart_data,
        options: {
            responsive: false,//stops the animation, so the update looks better
            animation: false
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

//timer for constantly updating the graph graph
function Timer()
{
    //a try statement so if there is a problem with the data, the timer doesn't stop
    try
    {
    	console.log(tag_titles, tag_section);
    	if(tag_titles && tag_section){
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

