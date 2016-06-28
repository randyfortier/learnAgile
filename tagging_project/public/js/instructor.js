var socket = io();

//set up the canvas, its id and its size
var pieChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');;

//mock data for the chart.js website, used to show the chart off
var data = {
	    labels: [
	        "Understand",
	        "Don't Understand",
	        "Unknown"
	    ],
	    datasets: [
	        {
	            data: [300, 50, 100],
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
var pieChart = new Chart(pieChartHTML,{
	type: 'pie',
	data: data,
	options: {
       	responsive: false
   	}
});

Reveal.addEventListener( 'slidechanged', function( event ) {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv
    
    //easy access to the current slide
    var slide = event.currentSlide;

    //sends a siginal to the server to change the students slides
    socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

    //move the chart to the current slide and move the chart to the top left corner
    moveChart(slide, slide.offsetTop + 50);
});


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
