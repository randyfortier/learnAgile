var socket = io('http://localhost:3000');
var binary_default = {};
var currentH = 0;
var isDefault = true;
var ActionFunc = null;

$('.slides').children().each(function(index){
    //check for the instances of binary_tags
    var found = $(this).find('.binary_default');

    //if an item is found
    if(found[0])
    {
        binary_default['h_' + index] = $(found[0]).text();// add the first binary_default to the default map
    }
    else
    {
        found = $(this).find('.binary_tag')[0];//find the first avaible binary tag
        if(found)//if there is a binary tag add it
            binary_default['h_' + index] = $(found).text();        
    }   
});

//send the user the lecture id
socket.emit('lecture_server_setup', $('title').text());

socket.on('lecture_client_setup', function(isInstuctor){
    if(isInstuctor)
    {
        //name of the tag tiles, and the color assigned to each tag
        var tag_color = {};
        var tag_titles = [];

        //set up the canvas, its id and its size
        var ChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');

        //speed that the timer ticks
        var timerSpeed = 1000;
        var timer = null;

        //variable for the radarChart and its data
        var radarChart = null;
        var radar_chart_data = {};
        var checkForChart = false;

        ActionFunc = function(){
            checkForChart = !checkForChart;
            if(checkForChart)
                LoadChart();
            else
                $('#student_chart').remove();
        };

        Reveal.addEventListener( 'slidechanged', function( event ) {
            //easy access to the current slide
            var slide = event.currentSlide;

            //sends a siginal to the server to change the students slides
            socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

            if(checkForChart)
                LoadChart();

        });

        function LoadChart()
        {
            //remove the prevoius chart, if one exists
            $('#student_chart').remove();
            var slide = Reveal.getCurrentSlide();
            if(checkNupdateTag(slide, Reveal.getIndices().h))
                moveChart(slide, slide.offsetTop);

        }

        function checkNupdateTag(slide, hIndex)
        {
            //check for xml data
            var rawxml = $(slide).find('.binary_tag');
            //use !== 0 beacuse find returns a empty array
            //if !0 then there is a tag there
            if(rawxml.length !== 0)
            {
                //NOTE: have script be type='text/xml', also parseXML didn't work and gave error
                //add the buuton to the screen and update the onclick method with the tag data and index of slide
                updateTagTitles($(rawxml[0]).text());
                return true;
            }
            else
                 //check to see if the a default exists, if so then add the default
                if(binary_default.hasOwnProperty(hIndex)){
                    updateTagTitles(binary_default['h_'+hIndex]);
                    return true;
                }
            return false;
        }        

        function updateAllTagChartData()
        {
            //for each title, send a request for it's tag data
            tag_titles.forEach(function(title, index){
                socket.emit('get_chart_data', {
                        tag_title : title,
                        index: index
                    });
            });
        }

        function updateTagTitles(xml)
        {
            //reset the tag titles
            tag_titles = [];
            //for each child in the xml get the title
            $(xml).children().each(function(){
                //push the name in the list
                tag_titles.push($(this).attr('title'));
            });

            //set the current chat data to be a template for data to be inputed
            radar_chart_data = {
                labels: ["Yes","No","unknown"],
                datasets: tag_titles.slice()
            };

            //update the tag data
            updateAllTagChartData();
        }

        socket.on('chart_update', function(chart_data){
            //when the chart data comes in, parse it, and save the data
            updateTagChartData(chart_data);
        });

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

        //move the chart from one slide to the next, independent from which was the last slide
        function moveChart(slide, top = 0)
        {
            //remove the prevoius chart, if one exists
            // $('#student_chart').remove();

            //move the chart up of down based on the "top" variable, it is negetive beacuse the number set throught is the offset that the current slide is from its parent, which is where the top of the slide starts
            ChartHTML.css('top', -top);

            //add the chart to the current slide
            $(slide).prepend(ChartHTML);
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
        function Timer(){
            //a try statement so if there is a problem with the data, the timer doesn't stop
            try
            {
                //update the char data, the display the chart
                updateAllTagChartData();
                updateRadarChart();
            }
            catch(err)
            {
                //if there is an error, show it
                console.log(err)
            }
            //start the timer over, waiting a set amount of time
            timer = setTimeout(function(){Timer();}, timerSpeed);
        }

        //initial start the timer
        $(document).ready(function(){
            Timer();
        });
    }
    else
    {
        var UNKNOWN_RESPONSE = -1;
        var DONTUNDERSTAND_RESPONSE = 0;
        var UNDERSTAND_RESPONSE = 1;
        var tagSidebar = $('<div id="sidebar"></div>');
        var follow_Instructors_Slides = false;

        ActionFunc = function()
        {
            follow_Instructors_Slides = !follow_Instructors_Slides;
        }

        //NOTE: when adding sidebar, height at 100% only matches the height of the text on the screen
        //adjusts that when adding to a new slide, fixed in the removeNaddsidebar function

        //moves to the slide that the server send, to the teachers slide
        socket.on('student-moveslide', function(indexies){
            if(follow_Instructors_Slides)//ask randy/ken best practice
                Reveal.slide(indexies[0], indexies[1], 0);
        });

        //when the slide changes, update the current the slide data
        Reveal.addEventListener( 'slidechanged', function( event ) {
            slide_load(event.currentSlide);
        });

        //when the doucument is ready load the current slide
        $(document).ready(function(){
            slide_load(Reveal.getCurrentSlide());
        });

        function slide_load(slide)
        {
            //have a vertical sidebar to show the tags for the 
            //add the sidebar to the slide
            removeNAddSidebar(slide, [$('.slides').height(), slide.offsetTop]);

            var hIndex = Reveal.getIndices().h;
            if(hIndex !== currentH)
            {
                //there was a change, load next default
                loadDefaultBinaryTag(hIndex)
                currentH = hIndex;
            }

            //check if there is a tag avaiable in the current slide, if ther is load it
            var change = checkNloadCurrentSlideXML(slide);

            //if a change has occured, change isDefault to false, 
            if(change)
                isDefault = false;
            else
            {
                //else, check to see if the default is up, if it isn't reload the default
                if(!isDefault)
                    loadDefaultBinaryTag(currentH);
            }
        }

        function loadDefaultBinaryTag(index)
        {
            //check to see if the a default exists, if so then add the default
            var hIndex = 'h_' + index;
            if(binary_default.hasOwnProperty(hIndex))
                updateCurrentTags(binary_default[hIndex]);
            else // else remove the previous tags
                removeTags();
            isDefault = true;
        }

        function checkNloadCurrentSlideXML(slide)
        {
            //check for xml data
            var rawxml = $(slide).find('.binary_tag');
            //use !== 0 beacuse find returns a empty array
            //if !0 then there is a tag there
            if(rawxml.length !== 0)
            {
                //NOTE: have script be type='text/xml', also parseXML didn't work and gave error
                //add the buuton to the screen and update the onclick method with the tag data and index of slide
                updateCurrentTags($(rawxml[0]).text());
                return true;
            }
            return false;
        }


        function removeNAddSidebar(slide, adjustvalues = [])
        {
            //gets ride of the old sidebar on the previous slide
            $('#tagSidebar').remove();

            if(adjustvalues.length > 0){
                //adjusts the height to be the height of the slide and location to be starting at the top of the slide
                tagSidebar.height(0.975*adjustvalues[0]);
                tagSidebar.css('top', -adjustvalues[1]);
            }
            //add the sidebar onto the current slide
            $(slide).prepend(tagSidebar);
        }

        function removeTags()
        {
            //remove the previous tags
            $('.tagged').remove();
        }

        function updateCurrentTags(xml)
        {
            removeTags();
            //bulid the tags that are in the xml
            bulidTag(xml);
        }

        function bulidTag(xml)
        {
            //variable for the name of each of the tags
            var tags = [];
            
            //for each child in the xml make a tag out of it
            $(xml).children().each(function(){

                //push the name in the list
                var title = $(this).attr('title');
                var section = $(this).attr('section');
                tags.push({title:title, section: section});

                //add to the sidebar a icon that has the title of the child title and the image that is the string location of the text in the child
                $(sidebar).append(bulidSidebarIcon(title + "_" + section, "unknown", $(this).text()));
            });

            //check the status of each of the tags, base on what the server has
            CheckTagStatus(tags);

            //add the click function of the images
            $('.tagged').click(tag_click);
        }

        function CheckTagStatus(tags)
        {
            //for each tag, send the name to the server and wait for what the status is of that tag
            tags.forEach(function(tag_title){
                socket.emit('check_binary_tag_status', tag_title);
            });
        }

        //get the response from the server that is the status of the tag according to what is in the database server
        socket.on('binary_tag_status', function(tag_status){

            //get the tag by it's name
            var tag = $('#' + tag_status.title + '_' + tag_status.section);

            //check what state that tag was when you last used it
            switch(tag_status.response)
            {
                case 1:
                    tag.addClass("clicked"); // it was on
                    tag.removeClass("unknown");
                    break;
                case 0:
                    tag.addClass("unclicked"); // it was off
                    tag.removeClass("unknown");
                    break;

                //no default beacause it has the default is coded into tag_click and bulid tag
            }
        });

        //when the tag item is clicked
        function tag_click(event)
        {
            //this is the text item that was clicked
            var clicked = $(event.target);
            var response = UNKNOWN_RESPONSE;
            var added = "";
            var removed = "";

            //check if the img was click of the div was, if the image the change clicked to its parent, the div
            if(clicked.hasClass('clickable'))//unclicked class
                clicked = clicked.parent();//the div

            //if the div has unclicked then switch the classes and set the response to understand
            if(clicked.hasClass('unclicked'))//unclicked class
            {
                removed = 'unclicked';
                added = 'clicked';
                response = UNDERSTAND_RESPONSE;
            }
            //if the div has clicked then switch the classes and set the response to dontunderstand
            else if(clicked.hasClass('clicked'))//clicked class
            {
                removed = 'clicked';
                added = 'unclicked';
                response = DONTUNDERSTAND_RESPONSE;
            }
            //if the div has yet to be clicked, add clicked, remove unknown and set the repsonse to understand
            else if(clicked.hasClass('unknown')){
                added = 'clicked';
                removed = 'unknown';
                response = UNDERSTAND_RESPONSE;
            }
            else
                //if the wrong item was clicked, do nothing
                return;
                
            //remove and add the class in removed and added
            clicked.removeClass(removed);
            clicked.addClass(added);

            //send the tag data
            var id = clicked.attr('id').split('_');
            var title = id[0];
            var section = id[1];
            sendTagResponse(title, section, response); 
        }

        function sendTagResponse(title, section, response)
        {
            //emit to the server, the title of the tag, the slide index, and which tag state they are in
            socket.emit('student_response', {
                title: title,
                section: section,
                response: response
            });
        }

        //template for the sidebar's items
        function bulidSidebarIcon(id, tag_class, src)
        {
            return $('<div id="'+id+'"class="tagged '+tag_class+'"> '+ bulidImage(src) +'</div>');
        }

        //template for the sidebar image
        function bulidImage(src)
        {
            return '<img class="clickable" src="'+src+'" />';
        }   
    }
});

function tagAction()
{
    if(ActionFunc !== null)
        ActionFunc();
}