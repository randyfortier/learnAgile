var socket = io();

socket.on('setup', function(isInstuctor){
    if(isInstuctor)
    {

        var tag_color = {};
        //set up the canvas, its id and its size
        var pieChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');

        //speed that the timer ticks
        var timerSpeed = 1000;

        //generate the chart onto the html, based on the mock data
        var pieChart = null;

        var currentTitle = "Einstein";
        var tag_titles = [];

        var radarChart = null;
        var radar_chart_data = {};

        Reveal.addEventListener( 'slidechanged', function( event ) {
            //easy access to the current slide
            var slide = event.currentSlide;

            //sends a siginal to the server to change the students slides
            socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

            //move the chart to the current slide and move the chart to the top left corner
            moveChart(slide, slide.offsetTop);

            //check for xml data
            var rawxml = $(slide).find('.binary_tag');
            //use !== 0 beacuse find returns a empty array
            //if !0 then there is a tag there
            if(rawxml.length !== 0)
            {
                //NOTE: have script be type='text/xml', also parseXML didn't work and gave error
                //add the buuton to the screen and update the onclick method with the tag data and index of slide
                updateTagTitles($(rawxml[0]).text());
            }

        });

        Reveal.addEventListener('ready', function(event){
            //easy access to the current slide
            var slide = event.currentSlide;

            //this move is for when on the first slide, beacuse slide change isn't called on the first slide
            moveChart(slide, slide.offsetTop);
        });

        function updateAllTagChartData()
        {
            tag_titles.forEach(function(title, index){
                socket.emit('get_chart_data', {
                        tag_title : title,
                        index: index
                    });
            });
        }

        function updateTagTitles(xml)
        {
            tag_titles = [];
            //for each child in the xml get the title
            $(xml).children().each(function(){
                //push the name in the list
                tag_titles.push($(this).attr('title'));
            });
            updateRadarChart();
            radar_chart_data = {
                labels: ["Yes","No","unknown"],
                datasets: tag_titles.slice()
            };
            updateAllTagChartData();
        }

        socket.on('chart_update', function(chart_data){
            updateTagChartData(chart_data);
        });


        function updateTagChartData(chart_data)
        {
            var data = [(chart_data.data.understand)?chart_data.data.understand:0, 
                        (chart_data.data.dont)?chart_data.data.dont:0, 
                        (chart_data.data.unknown)?chart_data.data.unknown:0];
            var rgb 
            if(!tag_color[chart_data.tag_title])
                tag_color[chart_data.tag_title] = randRGB();
            rgb = tag_color[chart_data.tag_title];

            radar_chart_data.datasets[chart_data.index] = {};
            radar_chart_data.datasets[chart_data.index].data = data;
            radar_chart_data.datasets[chart_data.index].pointBorderColor = "#fff";
            radar_chart_data.datasets[chart_data.index].pointHoverBackgroundColor = "#fff";
            radar_chart_data.datasets[chart_data.index].label = chart_data.tag_title;
            
            
            radar_chart_data.datasets[chart_data.index].backgroundColor = RGBA(rgb, '0.2');
            radar_chart_data.datasets[chart_data.index].borderColor = RGBA(rgb, '1');
            radar_chart_data.datasets[chart_data.index].pointBackgroundColor = RGBA(rgb, '1');
            radar_chart_data.datasets[chart_data.index].pointHoverBorderColor = RGBA(rgb, '1');
        }

        function randRGB()
        {
            var r = rand(255);
            var g = rand(255);
            var b = rand(255);
            return {r:r, g:g, b:b};
        }
        
        function RGBA(rgb, a)
        {
            return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
        }

        function rand(max)
        {
            return Math.floor(Math.random() * max);
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

            if(Object.keys(radar_chart_data).length === 0)
                return;

            //generate the chart onto the html, based on the mock data
            radarChart = new Chart(pieChartHTML, {
                type: 'radar',
                data: radar_chart_data,
                options: {
                    responsive: false,
                    animation: false
                }
            });
        }

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

            if ($(slide).find('.binary_tag').length === 0)
                return;

            //move the chart up of down based on the "top" variable, it is negetive beacuse the number set throught is the offset that the current slide is from its parent, which is where the top of the slide starts
            pieChartHTML.css('top', -top);

            //add the chart to the current slide
            $(slide).prepend(pieChartHTML);
        }


        // socket.on('chart_update', function(chart_data){
            // console.log(chart_data);
            // updatePieChart(chart_data);
        // });

        var timer = null;
        //timer for constantly updating the pie graph
        function Timer(){
            try
            {
                updateAllTagChartData();
                updateRadarChart();
            }
            catch(err)
            {
                console.log(err)
            }
            // console.log("tick" + tag_titles);
            // var slide = Reveal.getIndices();
            // var index = slide.h + "." + slide.v;
            // socket.emit('get_chart_data', {
            //             tag_title : currentTitle
            //         });
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

        function bulidTag(xml)
        {
            //variable for the name of each of the tags
            var tags = [];
            
            //for each child in the xml make a tag out of it
            $(xml).children().each(function(){

                //push the name in the list
                var title = $(this).attr('title');
                tags.push(title);

                //add to the sidebar a icon that has the title of the child title and the image that is the string location of the text in the child
                $(sidebar).append(bulidSidebarIcon(title, "unknown", bulidImage($(this).text())));
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
            var tag = $('#' + tag_status.title);

            //check what state that tag was when you last used it
            switch(tag_status.response)
            {
                case 1:
                    tag.addClass("clicked"); // it was on
                    break;
                case 0:
                    tag.addClass("unclicked"); // it was off
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

            if(clicked.hasClass('clickable'))//unclicked class
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
            else if(clicked.hasClass('unknown')){
                clicked.addClass('clicked');
                response = UNDERSTAND_RESPONSE;
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

        function bulidImage(src)
        {
            return '<img class="clickable" src="'+src+'" />';
        }
    }
});