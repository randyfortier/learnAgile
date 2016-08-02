var socket = io('http://localhost:3000');
var ChartHTML = $('<canvas id="student_chart"></canvas>');


$('#speaker-controls').append('<div id="loading-text">Loading</div>');

$('#speaker-controls').append(ChartHTML);

function findLecture()
{
	var lecture = $('#current-slide').children();//.children().each(function(){

	if(lecture.length === 0)
	{
		//continue searching for the lecture
		temp = setTimeout(findLecture, 1000);
		return;
	}
	else
	{
		load_Lecture(lecture);
	}

}

var temp = setTimeout(findLecture, 4000);

function load_Lecture(lecture)
{
	// console.log($('#iframe').get(0));
	console.log(lecture);
	// console.log($(lecture).contents());
	// console.log(data, event.target);
// 		console.log(data, event.origin);
		
	// document.getElementById('iframe').contentWindow.document.body.innerHTML

	console.log($('#iframe').contents().find("html"));
	var iframer = document.getElementById('current-lecture');

	var iframeBody = iframer.contentDocument.body;

	// lecture.postMessage("test", 'http://localhost');

}

// window.addEventListener('message',function(event){
// 	var data = JSON.parse( event.data );

// 	if(data.eventName === "ready" && data.namespace === "reveal"){
// 		console.log(data, event.target);
// 		console.log(data, event.origin);
		
// 		event.target.postMessage("test", 'http://localhost');

// 	}
// })


// var binary_default = {};
// var currentH = 0;
// var isDefault = false;
// var currentSection = "";
// var ActionFunc = null;

// var standardTags = {
//     'en': {title:'Einstein', src:'images/Einstein.png'},
//     'heart': {title:'Heart', src:'images/Heart.png'},
//     'like': {title:'Like', src:'images/like.png'},
//     'hard': {title:'Hard', src:'images/hard.png'},
//     'study': {title:'Study', src:'images/study.png'}
// };

// function setBinary_default(index, text, section)
// {
//     binary_default['h_' + index] = {xml: text, section:section};
// }

// $('.slides').children().each(function(index){
//     //check for the instances of binary_tags
//     var found = $(this).find('.binary_default');
//     //if an item is found
//     if(found[0])
//     {
//         setBinary_default(index, $(found[0]).text(), $(found).attr('binarysection'));// add the first binary_default to the default map
//     }
//     else
//     {
//         found = $(this).find('.binary_tag')[0];//find the first avaible binary tag

//         if(found)//if there is a binary tag add it
//             setBinary_default(index, $(found).text(), $(found).attr('binarysection'));
//     }   

// });
// console.log(binary_default);

// function tagAction()
// {
//     if(ActionFunc !== null)
//         ActionFunc();
// }

// if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
//     $('.tagged').css('width', 100);
//     $('.tagged').css('height', 100);
//     screen.lockOrientation('landscape');
// }

// //send the user the lecture id
// socket.emit('lecture_server_setup', $('title').text());

// socket.on('lecture_client_setup', function(isInstuctor){
//     if(isInstuctor)
//     {
//         //name of the tag tiles, and the color assigned to each tag
//         var tag_color = {};
//         var tag_titles = [];

//         //set up the canvas, its id and its size
//         var ChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');

//         //speed that the timer ticks
//         var timerSpeed = 1000;
//         var timer = null;

//         //variable for the radarChart and its data
//         var radarChart = null;
//         var radar_chart_data = {};
//         var checkForChart = false;

//         ActionFunc = function(){
//             checkForChart = !checkForChart;
//             if(checkForChart){
//                 LoadChart();
//                 Timer();
//             }
//             else{
//                 clearTimeout(timer);
//                 $('#student_chart').remove();
//             }
//         };

//         Reveal.addEventListener( 'slidechanged', function( event ) {
//             //easy access to the current slide
//             var slide = event.currentSlide;

//             //sends a siginal to the server to change the students slides
//             socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

//             if(checkForChart)
//                 LoadChart();

//         });

//         function LoadChart()
//         {
//             //remove the prevoius chart, if one exists
//             $('#student_chart').remove();
//             var slide = Reveal.getCurrentSlide();
//             if(checkNupdateTag(slide, Reveal.getIndices().h))
//                 moveChart(slide, slide.offsetTop);
//         }

//         function checkNupdateTag(slide, hIndex)
//         {
//             //check for xml data
//             var rawxml = $(slide).find('.binary_tag');
//             //use !== 0 beacuse find returns a empty array
//             //if !0 then there is a tag there
//             if(rawxml.length !== 0)
//             {
//                 //NOTE: have script be type='text/xml', also parseXML didn't work and gave error
//                 //add the buuton to the screen and update the onclick method with the tag data and index of slide
//                 updateTagTitles($(rawxml[0]).text(), $(rawxml).attr('binarysection'));
//                 return true;
//             }
//             else
//                  //check to see if the a default exists, if so then add the default
//                 if(binary_default.hasOwnProperty(hIndex)){
//                     updateTagTitles(binary_default['h_'+hIndex].xml, binary_default['h_'+hIndex].section);
//                     return true;
//                 }
//             return false;
//         }        

//         function updateAllTagChartData(section)
//         {
//             //for each title, send a request for it's tag data
//             tag_titles.forEach(function(title, index){
//                 socket.emit('get_chart_data', {
//                         tag_title : title,
//                         section: section,
//                         index: index
//                     });
//             });
//         }

//         function getXMLData(item)
//         {
//             // var tagData = standardTags[$(item)[0].tagName.toLowerCase()];
//             return standardTags[$(item)[0].tagName.toLowerCase()];
//         }


//         function updateTagTitles(xml, section)
//         {
//             //reset the tag titles
//             tag_titles = [];

//             //for each child in the xml get the title
//             $(xml).children().each(function(){
//                 //push the name in the list
//                 tag_titles.push(getXMLData($(this)).title);
//             });

//             //set the current chat data to be a template for data to be inputed
//             radar_chart_data = {
//                 labels: ["Yes","No","unknown"],
//                 datasets: tag_titles.slice()
//             };

//             //update the tag data
//             updateAllTagChartData(section);
//         }

//         socket.on('chart_update', function(chart_data){
//             //when the chart data comes in, parse it, and save the data
//             updateTagChartData(chart_data);
//         });

//         function updateTagChartData(chart_data)
//         {
//             //set the data in the chart.js format
//             var data = [(chart_data.data.understand)?chart_data.data.understand:0, 
//                         (chart_data.data.dont)?chart_data.data.dont:0, 
//                         (chart_data.data.unknown)?chart_data.data.unknown:0];
//             //set the color of the chart data, if no colour is assigned the generate a new color
//             var rgb;
//             if(!tag_color[chart_data.tag_title])
//                 tag_color[chart_data.tag_title] = randRGB();
//             rgb = tag_color[chart_data.tag_title];

//             //reset the chart dat and set the chart data, label, and other field
//             radar_chart_data.datasets[chart_data.index] = {};
//             radar_chart_data.datasets[chart_data.index].data = data;
//             radar_chart_data.datasets[chart_data.index].pointBorderColor = "#fff";
//             radar_chart_data.datasets[chart_data.index].pointHoverBackgroundColor = "#fff";
//             radar_chart_data.datasets[chart_data.index].label = chart_data.tag_title;
            
//             //set the color for chart data
//             radar_chart_data.datasets[chart_data.index].backgroundColor = RGBA(rgb, '0.2');
//             radar_chart_data.datasets[chart_data.index].borderColor = RGBA(rgb, '1');
//             radar_chart_data.datasets[chart_data.index].pointBackgroundColor = RGBA(rgb, '1');
//             radar_chart_data.datasets[chart_data.index].pointHoverBorderColor = RGBA(rgb, '1');
//         }

//         //updates the pie chart with the data in the "data" variable
//         function updateRadarChart()
//         {
//             //if there isn't a pieChart, don't destroy it
//             if(radarChart !== null)
//                 /*if it is not destroyed each time, an error occurs where
//                 *mutliple graphs are on top of each other, and when moving
//                 *the mouse over the graph old data will be shown along with new data
//                 */
//                 radarChart.destroy();

//             //if ther is property's in the chart data, do nothing
//             if(Object.keys(radar_chart_data).length === 0)
//                 return;

//             //generate the chart onto the html, based on the mock data
//             radarChart = new Chart(ChartHTML, {
//                 type: 'radar',
//                 data: radar_chart_data,
//                 options: {
//                     responsive: false,//stops the animation, so the update looks better
//                     animation: false
//                 }
//             });
//         }

//         //move the chart from one slide to the next, independent from which was the last slide
//         function moveChart(slide, top = 0)
//         {
//             //remove the prevoius chart, if one exists
//             // $('#student_chart').remove();

//             //move the chart up of down based on the "top" variable, it is negetive beacuse the number set throught is the offset that the current slide is from its parent, which is where the top of the slide starts
//             ChartHTML.css('top', -top);

//             //add the chart to the current slide
//             $(slide).prepend(ChartHTML);
//         }

//         //return the format of chart.js rgba color
//         function RGBA(rgb, a)
//         {
//             return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
//         }

//         //randomaly generate a color
//         function randRGB()
//         {
//             return {r:rand(255), g:rand(255), b:rand(255)};
//         }
        
//         //random function that get the color from 0 to the max
//         function rand(max)
//         {
//             return Math.floor(Math.random() * max);
//         }

//         //timer for constantly updating the graph graph
//         function Timer()
//         {
//             //a try statement so if there is a problem with the data, the timer doesn't stop
//             try
//             {
//                 //update the char data, the display the chart
//                 updateAllTagChartData($(Reveal.getCurrentSlide()).find('.binary_tag').attr('binarysection'));
//                 updateRadarChart();
//             }
//             catch(err)
//             {
//                 //if there is an error, show it
//                 console.log(err)
//             }
//             //start the timer over, waiting a set amount of time
//             timer = setTimeout(function(){Timer();}, timerSpeed);
//         }

//         // //initial start the timer
//         // $(document).ready(function(){
//         //     Timer();
//         // });
//     }
// });
