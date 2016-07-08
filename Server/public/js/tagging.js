var socket = io();

socket.on('setup', function(isInstuctor){
    if(isInstuctor)
    {
        //set up the canvas, its id and its size
        var pieChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');

        //speed that the timer ticks
        var timerSpeed = 1000;

        //generate the chart onto the html, based on the mock data
        var pieChart = null;

        var currentTitle = "Einstein";

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
        function updatePieChart(server_data)
        {
            //if data is empty then don't do anything
            if(server_data.length === 0)
                return;
            //if there isn't a pieChart, don't destroy it
            if(pieChart !== null)
                /*if it is not destroyed each time, an error occurs where
                *mutliple graphs are on top of each other, and when moving
                *the mouse over the graph old data will be shown along with new data
                */
                pieChart.destroy();

            //the first 3 data points are for the names of the three pieces of the pie
            var data = {
                labels: [
                    "Understand", 
                    "Don't Understand", 
                    "Unknown"
                ],
                datasets: [
                    {
                        //the last 3 data points are for the amounts of each piece of the pie
                        data: [(server_data.understand)?server_data.understand:0, 
                        (server_data.dont)?server_data.dont:0, 
                        (server_data.unknown)?server_data.unknown:0],
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


        socket.on('chart_update', function(chart_data){
            console.log(chart_data);
            updatePieChart(chart_data);
        });

        var timer = null;
        //timer for constantly updating the pie graph
        function Timer(){
            var slide = Reveal.getIndices();
            var index = slide.h + "." + slide.v;
            socket.emit('get_chart_data', {
                        tag_title : currentTitle
                    });
            timer = setTimeout(function(){Timer();}, timerSpeed);
        }

        //initial set the chart and start the timer
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

        //NOTE: when adding sidebar, height at 100% only matches the height of the text on the screen
        //adjusts that when adding to a new slide, fixed in the removeNaddsidebar function

        //moves to the slide that the server send, to the teachers slide
        socket.on('student-moveslide', function(indexies){
            if(follow_Instructors_Slides)//ask randy/ken best practice
                Reveal.slide(indexies[0], indexies[1], 0);
        });

        Reveal.addEventListener( 'slidechanged', function( event ) {
            //easier access to the current slide variable
            var slide = event.currentSlide;

            //2b, have a vertical sidebar to show the tags for the 
            //add the sidebar to the slide
            removeNAddSidebar(slide, [$('.slides').height(), slide.offsetTop]);

            //check for xml data
            var rawxml = $(slide).find('.binary_tag');
            //use !== 0 beacuse find returns a empty array
            //if !0 then there is a tag there
            if(rawxml.length !== 0)
            {
                //NOTE: have script be type='text/xml', also parseXML didn't work and gave error
                //add the buuton to the screen and update the onclick method with the tag data and index of slide
                updateCurrentTags($(rawxml[0]).text());
            }
        });

        function updateCurrentTags(xml)
        {
            //remove the previous tags
            $('.tagged').remove();

            bulidTag(xml);
        }

        function getTagID()
        {
            var slideIndices = Reveal.getIndices(); //the slide numbers
            return slideIndices.h +'_'+ slideIndices.v;//text for the id of the div
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

        function bulidImage(src)
        {
            return '<img class="clickable" src="'+src+'" />';
        }

        function bulidTag(xml)
        {
            //for each child in the xml make a tag out of it
            $(xml).children().each(function(){
                //add to the sidebar a icon that has the title of the child title and the image that is the string location of the text in the child
                $(sidebar).append(bulidSidebarIcon($(this).attr('title'), "unclicked", bulidImage($(this).text())));
            });
            //add the click function of the images
            $('.clickable').click(tag_click);
        }

        //when the tag item is clicked
        function tag_click(event)
        {
            //this is the text item that was clicked
            var clicked = $(event.target);
            var response = UNKNOWN_RESPONSE;

            clicked = clicked.parent();

            if(clicked.hasClass('unclicked'))//unclicked class
            {
                clicked.removeClass('unclicked');
                clicked.addClass('clicked');
                response = UNDERSTAND_RESPONSE;
            }
            else if(clicked.hasClass('clicked'))//clicked class
            {
                clicked.removeClass('clicked');
                clicked.addClass('unclicked');
                response = DONTUNDERSTAND_RESPONSE;
            }
            else
                return;

            sendTagResponse(clicked.attr('id'), response); 
           
        }

        function sendTagResponse(title, response)
        {
            //emit to the server, the title of the tag, the slide index, and which tag state they are in
            socket.emit('student_response', {
                title: title,
                response: response
            });
        }

        //template for the sidebar's items
        function bulidSidebarIcon(id, tag_class, innerItem)
        {
            return $('<div id="'+id+'"class="tagged '+tag_class+'"> '+ innerItem +'</div>');
        }
    }
});