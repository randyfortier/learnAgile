var socket = io();

socket.on('setup', function(isInstuctor){

    if(isInstuctor)
    {
        //set up the canvas, its id and its size
        var pieChartHTML = $('<canvas id="student_chart" width="200" height="200"></canvas>');
        var SendRemoveTagButton = $('<div id="send_remove_tag">Send Tag</div>');
        var sendtag = true;

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
            if(!sendtag)
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
                    "Understand", 
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


        //when send/remove tag button is click, call the appropriate function
        function on_click()
        {
            if(sendtag)//call the send tag function
                sendTagButton_click();
            else//call the remove tag function
                removeTagButton_click();
        }

        //send a signal to the server to remove the students tags
        function removeTagButton_click()
        {
            //send the no tag
            socket.emit('remove_tag');
            //remove the timer grabing the the chart data
            clearTimeout(timer);
            
            //clear the chart
            pieChart.destroy();

            //change the name and functionality of the button
            $(SendRemoveTagButton).text("Send Tag");
            sendtag = true;
        }

        //retrives the data form the xml, puts it in json format and sends it to the server
        function sendTagButton_click()
        {
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

            //start the timer for grabbing the infromation for the server
            Timer();

            //change the name and functionality of the button
            $(SendRemoveTagButton).text("Remove Tag");
            sendtag = false;
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
                        slide_index : index,
                        tag_title : currentTitle
                    });
            timer = setTimeout(function(){Timer();}, timerSpeed);
        }

        //initial set the chart and start the timer
        $(document).ready(function(){
            //set the the click functionality for the send/remove tag button
            $(SendRemoveTagButton).click(on_click);
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
            Reveal.slide(indexies[0], indexies[1], 0);
        });

        Reveal.addEventListener( 'slidechanged', function( event ) {
            //easier access to the current slide variable
            var slide = event.currentSlide;

            //2b, have a vertical sidebar to show the tags for the 
            //add the sidebar to the slide
            removeNAddSidebar(slide, [$('.slides').height(), slide.offsetTop]);
        });

        //function to remove the tag when the instructor wants
        socket.on('remove_tag', function(){
            //remove the interaction box
            $('#tag').remove();
        });

        socket.on('student_tag_data', function(tag_data){
            //change the slide to the same on as the instructors, the get the current slide
            Reveal.slide(tag_data.slide_index[0], tag_data.slide_index[1]);
            var slide = Reveal.getCurrentSlide();

            //bulid the tag and place it on the slide
            bulidFeedbackTag(slide, tag_data.title, tag_data.yes, tag_data.no);


            var slideIndices = Reveal.getIndices(); //the slide numbers
            var indexLocation = slideIndices.h +'.'+ slideIndices.v; //text visiual for the sidebar
            var indexID = slideIndices.h +'_'+ slideIndices.v;
            //check if there is already a item in sidebar
            if($(sidebar).find('#slide_'+indexID).length === 0){
                //get the current slide data and send unknown response
                sendTagResponse(indexLocation, UNKNOWN_RESPONSE);
            }
        });

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

        function bulidFeedbackTag(slide, t_title, t_yes, t_no)
        {
            //retrive the values for the xml script and place them into tags
            var title = $('<h3 id="tag_title"></h3>').text(t_title);
            var yes = $('<div id="tag_good"></div>').text(t_yes);
            var no = $('<div id="tag_bad"></div>').text(t_no);

            //setup the main tag, then add all the elements from above
            var tag = $('<div id="tag"> </div>');
            tag.append(title);
            tag.append(yes);
            tag.append(no);
            
            //adjust the size and location of the box. use this instend of css file because
            //this can be changed dynamically 
            tag.css({
                'height': '150',
                'width': '100', 
                'left': '85%', 
                'top': '0px',
                'font-size': '24px'
            });

            //add to the top of the slide
            $(slide).prepend(tag);

            //add the onlclick functionality to the two buttons
            $('#tag_good').click(tag_click);
            $('#tag_bad').click(tag_click);
            $('#tag_title').click(tag_click); 
        }

        //when the tag item is clicked
        function tag_click(event)
        {
            //this is the text item that was clicked
            var clicked = event.target;
            var slideIndices = Reveal.getIndices(); //the slide numbers
            var indexLocation = slideIndices.h +'.'+ slideIndices.v; //text visiual for the sidebar
            var indexID = slideIndices.h +'_'+ slideIndices.v;//text for the id of the div
            var current = "";
            var other = ""
            var response = UNKNOWN_RESPONSE;

            //check to see if the id of the click item is 'tag_good' which is the "i understand" portion of the tag
            if($(clicked).attr('id') === 'tag_good')
            {
                //set current to good and other to bad, for the color change 
                current = 'good';
                other = 'bad';
                //send to the server 1 when there is a good respose
                response = UNDERSTAND_RESPONSE;
            }
            else if($(clicked).attr('id') === 'tag_bad')//check if tag is 'tag_bad' which is the "i don't understand" portion of the tag
            {
                //set current to bad and other to good, for the color change
                current = 'bad';
                other = 'good';
                //send to the server 0 when it is a bad response
                response = DONTUNDERSTAND_RESPONSE;
            }
            else
            {
                //if neiter is click then remove the item
                $('#slide_'+indexID).remove();
                //send to the server -1 when the result is unknown
                sendTagResponse(indexLocation, response);        
                return;
            }

            //check if there is already a item in sidebar
            var exists = $(sidebar).find('#slide_'+indexID);
            if(exists.length === 0){
                //if there isn't already an item in the sidebar, add it with the right type
                $(sidebar).append(bulidSidebarIcon(indexID, current, indexLocation));
            }
            else
            {
                //if the class is "bad" or "good" it will remove "bad" and turn it to "good"
                $(exists[0]).removeClass(other);
                $(exists[0]).addClass(current);
            }

            //send the response data to the server, with the response number based on 
            //which button is pressed
            sendTagResponse(indexLocation, response);
        }

        function sendTagResponse(indexLocation, response)
        {
            //emit to the server, the title of the tag, the slide index, and which tag state they are in
            socket.emit('student_response', {
                title: $('#tag_title').text(),
                index: indexLocation,
                response: response
            });
        }

        //template for the sidebar's items
        function bulidSidebarIcon(id, tag_class, innerItem)
        {
            return $('<div id="slide_'+id+'"class="tagged '+tag_class+'"> '+ innerItem +'<div>');
        }
    }
});