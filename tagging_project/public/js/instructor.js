var socket = io();

//set up the canvas, its id and its size
var pieChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');
var SendRemoveTagButton = $('<div id="send_remove_tag">Send Tag</div>');
var send = true;

//three variable to repersent the number of people that understand the content, down understand the content, and the amount of unanswerd tags
var understand = 300;
var dontunderstand = 50;
var unknown = 100;

//speed that the timer ticks
var timerSpeed = 1000;

//variable for the data and the chart
var data = null;
var pieChart = null;

//generate the chart onto the html, based on the mock data
var pieChart = null;
var isTagAlive = false;

var currentTitle = "";

Reveal.addEventListener( 'slidechanged', function( event ) {
    //easy access to the current slide
    var slide = event.currentSlide;

    //sends a siginal to the server to change the students slides
    socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

    //move the chart to the current slide and move the chart to the top left corner
    moveChart(slide, slide.offsetTop + 50);

    //move the button that send the tag data to the student
    moveButton(slide);

    //if the is a tag that was live then clear it
    if(isTagAlive)
    	removeTagButton_click();
});

Reveal.addEventListener('ready', function(event){
	//easy access to the current slide
    var slide = event.currentSlide;

    //this move is for when on the first slide, beacuse slide change isn't called on the first slide
	moveChart(slide, slide.offsetTop + 50);
});

//updates the pie chart with the data in the "data" variable
function updatePieChart(data)
{
	//if data is empty then don't do anything
	if(data.length === 0)
		return;
	//if there isn't a pieChart, don't destroy it
	if(pieChart !== null)
		/*if it is not destroyed each time, an error occurs where
		*mutliple graphs are on top of each other, and when moving
		*the mouse over the graph old data will be shown along with new data
		*/
		pieChart.destroy();

	//the first 3 data points are for the names of the three pieces of the pie
	data = {
	    labels: [
	        "understand", 
	        "Don't Understand", 
	        "Unknown"
	    ],
	    datasets: [
	        {
	        	//the last 3 data points are for the amounts of each piece of the pie
	            data: [(data.understand)?data.understand:0, 
	            (data.dont)?data.dont:0, 
	            (data.unknown)?data.unknown:0],
	            backgroundColor: [
	                "#FF6384",
	                "#36A2EB",
	                "#FFCE56"
	            ],
	            hoverBackgroundColor: [
	                "#FF6384",
	                "#36A2EB",
	                "#FFCE56"
	            ]
	    	}]
	};

	//generate the chart onto the html, based on the mock data
	pieChart = new Chart(pieChartHTML, {
		type: 'pie',
		data: data,
		options: {
	       	responsive: false,
	       	animation: false
	   	}
	});
}

//move the chart from one slide to the next, independent from which was the last slide
function moveChart(slide, top = 0)
{
	//remove the prevoius chart, if one exists
	$('#student_chart').remove();

	if ($(slide).find('.feedback').length === 0)
		return;

	//move the chart up of down based on the "top" variable, it is negetive beacuse the number set throught is the offset that the current slide is from its parent, which is where the top of the slide starts
	pieChartHTML.css('top', -top);

	//add the chart to the current slide
	$(slide).prepend(pieChartHTML);
}

//move the button from one slide to the next, independent from which was the last slide
function moveButton(slide)
{
	//remove old send_tag button
	$('#send_remove_tag').remove();
	
    //check for xml data
    var rawxml = $(slide).find('.feedback');
    
    //use !== 0 beacuse find returns a empty array
    //if !0 then there is a tag there
    if(rawxml.length !== 0)
    {
        //NOTE: have script be type='text/xml', also parseXML didn't work and gave error
        //add the buuton to the screen and update the onclick method with the tag data and index of slide
        $(slide).prepend(SendRemoveTagButton);
    }
}

function on_click()
{
	if(send)
		sendTagButton_click();
	else
		removeTagButton_click();
}


//send a signal to the server to remove the students tags
function removeTagButton_click()
{
	socket.emit('remove_tag');
	isTagAlive = false;
	clearTimeout(timer);
	$(SendRemoveTagButton).text("Send Tag");
	send = true;
}

//retrives the data form the xml, puts it in json format and sends it to the server
function sendTagButton_click()
{
	if(isTagAlive)
		return;
	//get the xml and the index for which slide has the tag
	var xml = $(Reveal.getCurrentSlide()).find('.feedback').text();
	var indices =  Reveal.getIndices();
	var index = [indices.h, indices.v];

	//get the data from the tag
	var title = $(xml).find('title').text();
    var yes = $(xml).find('positive').text();
    var no = $(xml).find('negative').text();

    //set the current title 
    currentTitle = title;

    //send to the server the tag data, and the index of the slide
    var tag_data = {
    	'title': title,
    	'yes': yes,
    	'no': no,
    	'slide_index': index
    };
    socket.emit('instructor_tag_data', tag_data);
    Timer();
    isTagAlive = true;
    $(SendRemoveTagButton).text("Remove Tag");
    send = false;
}

socket.on('chart_update', function(chat_data){
	updatePieChart(chat_data);
});

/*NOTE: EVERYTHING PAST HERE IS EXTRA, ONLY HERE TO SHOW FUNCTIONALITY*/
var timer = null;
//timer for constantly updating the pie graph
function Timer(){
	timer = setTimeout(function(){
		timer_tick();
		Timer();
	}, timerSpeed);
}

//meat of the timer, used to augment the data and update the graph
//this is to mock an update from the server, making it easier to work with in the future
function timer_tick(){
    // understand += 50;
    // updatePieChart(["understand", "Don't Understand", "Unknown", understand, dontunderstand, unknown]);    
    console.log("Tick");
    var slide = Reveal.getIndices();
	var index = slide.h + "." + slide.v;
    socket.emit('get_chart_data', {
                slide_index : index,
                tag_title : currentTitle
            });
}

//initial set the chart and start the timer
$(document).ready(function(){
	// updatePieChart({understand: understand, dont: dontunderstand, unknown:unknown}, false);
	// Timer();
	$(SendRemoveTagButton).click(on_click);
});