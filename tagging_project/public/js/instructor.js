var socket = io();

//set up the canvas, its id and its size
var pieChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');

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

Reveal.addEventListener( 'slidechanged', function( event ) {
    //easy access to the current slide
    var slide = event.currentSlide;

    //sends a siginal to the server to change the students slides
    socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

    //move the chart to the current slide and move the chart to the top left corner
    moveChart(slide, slide.offsetTop + 50);
});

Reveal.addEventListener('ready', function(event){
	//easy access to the current slide
    var slide = event.currentSlide;

    //this move is for when on the first slide, beacuse slide change isn't called on the first slide
	moveChart(slide, slide.offsetTop + 50);
});

//updates the pie chart with the data in the "data" variable
function UpdateData(data)
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
	        data[0],
	        data[1],
	        data[2],
	    ],
	    datasets: [
	        {
	        	//the last 3 data points are for the amounts of each piece of the pie
	            data: [data[3], data[4], data[5]],
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

	//move the chart up of down based on the "top" variable, it is negetive beacuse the number set throught is the offset that the current slide is from its parent, which is where the top of the slide starts
	pieChartHTML.css('top', -top);

	//add the chart to the current slide
	$(slide).prepend(pieChartHTML);
}

//timer for constantly updating the pie graph
function Timer(){
	setTimeout(function(){
		timer_tick();
		Timer();
	}, timerSpeed);
}

//meat of the timer, used to augment the data and update the graph
//this is to mock an update from the server, making it easier to work with in the future
function timer_tick(){
    understand += 50;
    UpdateData(["understand", "Don't Understand", "Unknown", understand, dontunderstand, unknown]);    
}

//initial set the chart and start the timer
$(document).ready(function(){
	UpdateData(["understand", "Don't Understand", "Unknown", understand, dontunderstand, unknown], false);
	Timer();
});