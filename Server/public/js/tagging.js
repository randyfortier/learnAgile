var socket = io();//'http://sci54.science.uoit.ca:3000');
var YNRQuestion_section_default = {};
var MCRQ_correct_answer = {};
// var MCRQ_title = [];
var MCRQ_title = {};
var ActionFunc = null;
var isMobile = false;
var mobileSize = 110;
var mobilePos = "110%"
// var cnt = 0;

//YNRQuestion/YNRQ - Yes No Response Question

var standardYNRQuestions = {
    'like': {title:'Like', src:'images/like.png', tip:'I find this content interesting'},
    'difficult': {title:'Difficult', src:'images/hard.png', tip:'I find this content difficult'},
    'study': {title:'Study', src:'images/study.png', tip:'I think I should study this for the test'}
};

//hide the multiplechoice html
$('multiplechoice').css('display','none');

//for each multiple choice html, convert it to current html
$('multiplechoice').each(function(index){
    //the current multiple choice object
    var multi = this;
    var title = $(multi).attr('title');

    var id = title.replace(/ /g, '_');
    // MCRQ_title.push(title);
    MCRQ_title[title] = $(multi).attr('ca');

    //Get the correct answer
    MCRQ_correct_answer[id] = $(multi).attr('ca');
    $(multi).attr('ca', '-1');
    
    //add a spot for the question, and get the question text
    $(multi).after('<div id="question_'+id+'"></div>');
    var question = $(multi).find('question').html();
    
    //add the question text and an ordered list
    $('#question_'+id).append('<h2 id="'+id+'">'+question+'</h2>');
    $('#question_'+id).append('<ol id="answers_'+id+'" title="'+title+'"></ol>');

    //for each answer in the question add it to the question div, add 2 classes, answer for adding
    //click functionality and answer_'index' to be able to refrenece all answers in one question
    $(multi).find('answer').each(function(a_index){
        $('#answers_'+id).append('<li id="a_'+a_index+'" class="answer answers_'+index+'">'+$(this).text()+'</li>');
    });
});

function setYNRQ_section_default(index, text, section, tip)
{
    YNRQuestion_section_default['h_' + index] = {xml: text, section:section};
}

$('.slides').children().each(function(index){
    //check for the instances of YNRQs
    var found = $(this).find('.YNRQuestion-default');
    //if an item is found
    if(found[0])
    {
        setYNRQ_section_default(index, $(found[0]).text(), $(found).attr('YNRQuestion-section'));// add the first YNRQuestion_section_default to the default map
    }
});

function getXMLData(item)
{
    var standard = standardYNRQuestions[$(item)[0].tagName.toLowerCase()];

    if(!standard)
    {
        var title = $(item).attr('title');
        var src = $(item).attr('src');
        var tip = $(item).attr('tip');
        return {title: title, src:src, tip: tip};
    }
    else
        return standard;
}

function tagAction()
{
    if(ActionFunc !== null)
        ActionFunc();
}

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    isMobile = true;   
}
//socket.emit('mobile_debug', "Debug " + cnt++);

//send the user the lecture id
socket.emit('lecture_server_setup', $('title').text());

socket.on('lecture_client_setup', function(isInstuctor){
    if(isInstuctor)
    {
        if(window.parent)
        {
            var lec_name = undefined;

            window.addEventListener('message', function(event){
                var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
                var data = JSON.parse( event.data );
                if(lec_name)
                {
                    if(data.method === 'setState')
                    {
                        if(!sendMultipleChoice(event.source, origin))
                            sendYNRQs(event.source, origin);
                    }
                }
                else
                {
                    if(data.name){
                        if(!sendMultipleChoice(event.source, origin))
                            sendYNRQs(event.source, origin);
                        lec_name = data.name;
                        Reveal.addEventListener( 'slidechanged', function( event ) {
                            //sends a siginal to the server to change the students slides
                            socket.emit('instructor-moveslide', [event.indexh,event.indexv]);
                        });

                    }
                }
            });

            function sendMultipleChoice(source, origin)
            {
                var slide = Reveal.getCurrentSlide();
                var multi = multiChoice(slide);

                if(multi.length !== -1){
                    console.log('sendMC, TAGS:', multi);
                    source.postMessage(JSON.stringify({
                        MultipleChoice: multi
                    }), origin);
                    return true;
                }
                else
                    return false;
            }

            function sendYNRQs(source, origin)
            {
                var slide = Reveal.getCurrentSlide();
                var YNRQs = checkNretriveYNRQ(slide, Reveal.getIndices().h);
                source.postMessage(JSON.stringify({
                    YNRQuestion: YNRQs
                }), origin); 
            }

            function multiChoice(slide)
            {
                var multi = $(slide).find('multiplechoice');
                console.log(multi);

                if(multi.length > 0)
                {
                    //get div
                    var div = $(multi).next();

                    var list = $(div).find('ol')[0];

                    return {title: $(list).attr('title'), length: $(list).children().length};
                }
                return {title: "", length: -1};
            }
            
            function checkNretriveYNRQ(slide, hIndex)
            {
                //search for any Script Tag with the class YNRQuestion in it
                var YNRQuestions = $(slide).find('.YNRQuestion');
                
                //if there is a Script Tag with YNRQuestion class
                if(YNRQuestions.length > 0)
                {
                    //update the YNRQSidebar with the Tags that are available in this slide
                    return {YNRQs: bulidListofYNRQs($(YNRQuestions[0]).text()), section:$(YNRQuestions).attr('YNRQuestion-section')};
                }
                else
                {
                    //check to see if the a default exists, if so then add the default
                    if(YNRQuestion_section_default.hasOwnProperty('h_' + hIndex)){
                        return {YNRQs: bulidListofYNRQs(YNRQuestion_section_default['h_'+hIndex].xml) , section: YNRQuestion_section_default['h_'+hIndex].section};
                    }
                }
                return {tag: null, section: null};
            }

            function bulidListofYNRQs(xml)
            {
                var list = [];                
                var wrapper = "<YNRQ>"+xml+"</YNRQ>";
                //for each child in the xml get the title
                $(wrapper).children().each(function(){
                    //push the name in the list
                    var data = getXMLData($(this));
                    if(!data.title || !data.src)
                        return;    
                    list.push(data.title);
                });
                return list;
            }
        }
    }
    else
    {
        var UNKNOWN_YN_RESPONSE = -1;
        var DONTUNDERSTAND_YN_RESPONSE = 0;
        var UNDERSTAND_YN_RESPONSE = 1;
        var YNRQuestionSidebar = $('<div id="sidebar"></div>');
        var follow_Instructors_Slides = false;

        ActionFunc = function()
        {
            follow_Instructors_Slides = !follow_Instructors_Slides;
        }

        //NOTE: when adding sidebar, height at 100% only matches the height of the text on the screen
        //adjusts that when adding to a new slide, fixed in the moveYNRQSidebar function

        //moves to the slide that the server send, to the teachers slide
        socket.on('student-moveslide', function(indexies){
            //follow the instrcutor only if the 'f' key is pressed
            if(follow_Instructors_Slides)
                //navigate to the corrent slide, [h, v] is data format
                Reveal.slide(indexies[0], indexies[1], 0);
        });

        //when the slide changes, update the current the slide data
        Reveal.addEventListener( 'slidechanged', function( event ) {
            //invoke the slide_change function on the current slide
            slide_change(event.currentSlide);
        });

        //when the doucument is ready load the current slide
        $(document).ready(function(){
            //invoke the slide_change function on the current slide
            // $($('.slide-background .present')[0]).append(YNRQuestionSidebar);
            slide_change(Reveal.getCurrentSlide());
        });

        $(window).resize(function(){
            //when the size of the windows changes, change the locaiton of the sidebar
            KeepYNRQSidbarOnRight();
        })

   
        function KeepYNRQSidbarOnRight()
        {
            if(isMobile){
                YNRQuestionSidebar.css("left", mobilePos);
            }
            else{
                if( parseInt($('.slides').css('margin-left')) > 0)
                    $('#sidebar').css('left', (parseInt($('.slides').width()) + parseInt($('.slides').css('margin-left'))) - $('.YNRQ').width());
                else
                {
                    // console.log($($('.slide-background .present')[0]).width());

                    // $('#sidebar').css('left', $($('.slide-background .present')[0]).width());
                    $('#sidebar').css('left', '110%');
                }
            }
        }

        /*when ever a slide is loaded onto the screen,
            - move the YNRQ sidebar to the currentslide
            - Load the Load the sidebar with the YNRQuestion icons
         */
        function slide_change(slide)
        {
            //testing new code
            multiChoice(slide);

            //move the YNRQsidebar from to the current slide, and set it's position
            moveYNRQSidebar(slide, [$('.slides').height(), slide.offsetTop]);

            //update the YNRquestion that are available in the Sidebar
            UpdateYNRQuestionsInSidebar(slide);

            KeepYNRQSidbarOnRight();
        }

        function moveYNRQSidebar(slide, adjustvalues = [])
        {
            //gets ride of the old sidebar on the previous slide
            $('#sidebar').remove();

            if(adjustvalues.length > 0){
                //adjusts the height to be the height of the slide and location to be starting at the top of the slide
                YNRQuestionSidebar.height(0.975*adjustvalues[0]);
                YNRQuestionSidebar.css('top', -adjustvalues[1]);
            }
            //add the sidebar onto the current slide
            $(slide).prepend(YNRQuestionSidebar);
        }

        function UpdateYNRQuestionsInSidebar(slide)
        {
            //Update the YNRQSidebar with YNRQs from the slide, if it fails, update the YNRQSidbar with the default YNRQs
            if(!UpdateYNRQSidebarWithYNRQsFromSlide(slide))
                //Update the YNRQSidbar with the default YNRQs
                UpdateYNRQSidebarWithYNRQsDefaults(Reveal.getIndices().h);
        }

        function UpdateYNRQSidebarWithYNRQsDefaults(index)
        {
            //check to see if the a default exists, if so then add the default
            var hIndex = 'h_' + index;
            if(YNRQuestion_section_default.hasOwnProperty(hIndex))
                appendYNRQsToSidebar(YNRQuestion_section_default[hIndex].xml, YNRQuestion_section_default[hIndex].section);
            else // else remove the previous tags
                removeYNRQuestions();
        }

        function UpdateYNRQSidebarWithYNRQsFromSlide(slide)
        {
            //search for any Script Tag with the class YNRQuestion in it
            var YNRQuestions = $(slide).find('.YNRQuestion');
            
            //if there is a Script Tag with YNRQuestion class
            if(YNRQuestions.length > 0)
            {
                //update the YNRQSidebar with the Tags that are available in this slide
                appendYNRQsToSidebar($(YNRQuestions[0]).text(), $(YNRQuestions).attr('YNRQuestion-section'));
                return true;
            }
            return false;
        }

        function removeYNRQuestions()
        {
            //remove the previous YNRQs
            $('.YNRQ').remove();
        }

        function appendYNRQsToSidebar(xml, section)
        {
            removeYNRQuestions();
            //bulid the YNRQs that are in the xml
            bulidYNRQs(xml, section);
        }

        function bulidYNRQs(xml, section)
        {
            try
            {
                //variable for the name of each of the YNRQs
                var YNRQs = {section: section};
                YNRQs.titles = [];
                var wrapper = "<YNRQ>"+xml+"</YNRQ>";
                //for each child in the xml make a YNRQ out of it
                $(wrapper).children().each(function(){
                    var YNRQInfo = getXMLData($(this));
                    if(!YNRQInfo.title || !YNRQInfo.src)
                        return;
                    YNRQs.titles.push(YNRQInfo.title);

                    //add to the sidebar a icon that has the title of the child title and the image that is the string location of the text in the child
                    $(sidebar).append(bulidSidebarIcon(YNRQInfo.title + "_" + section.replace(/ /g, '_'), "icon-disabled", YNRQInfo.src, YNRQInfo.tip));
                });
                if(isMobile)
                {
                    //adjust the size of the YNRQs when on the mobile device
                    $('.YNRQ').css("height", mobileSize);
                    $('.YNRQ').css("width", mobileSize);
                }

                //check the status of each of the YNRQs, base on what the server has
                requestYNRQsStatus(YNRQs);

                //add the click function of the images
                $('.YNRQ').click(YNRQ_click);
            }
            catch(error)
            {
                console.log(xml, section);
                console.log(error);
            }
        
        }

        function requestYNRQsStatus(tags)
        {
            socket.emit('check_YNRQs_status', tags);
        }

        //when the tag item is clicked
        function YNRQ_click(event)
        {
            //this is the text item that was clicked
            var clicked = $(event.target);
            var response = UNKNOWN_YN_RESPONSE;
            var added = "";
            var removed = "";

            //check if the img was click of the div was, if the image the change clicked to its parent, the div
            if(clicked.hasClass('clickable'))//unclicked class
                clicked = clicked.parent();//the div

            //if the div has unclicked then switch the classes and set the response to understand
            if(clicked.hasClass('icon-disabled'))//unclicked class
            {
                removed = 'icon-disabled';
                added = 'clicked';
                response = UNDERSTAND_YN_RESPONSE;
            }
            //if the div has clicked then switch the classes and set the response to dontunderstand
            else if(clicked.hasClass('clicked'))//clicked class
            {
                removed = 'clicked';
                added = 'icon-disabled';
                response = DONTUNDERSTAND_YN_RESPONSE;
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
            sendYNRQResponse(title, section, response); 
        }

        //get the response from the server that is the status of the tag according to what is in the database server
        socket.on('YNRQs_status', function(tag_status){

            tag_status.tag_responses.forEach(function(tag_data){
                //get the tag by it's name
                var tag = $('#' + tag_data.title + '_' + tag_status.section.replace(/ /g, '_'));
                //check what state that tag was when you last used it
                switch(tag_data.response)
                {
                    case 1:
                        tag.addClass('clicked'); // it was on
                        tag.removeClass('icon-disabled');
                        break;
                    //no default beacause it has the default is coded into YNRQ_click and bulid tag
                }
            });
        });

        function sendYNRQResponse(title, section, response)
        {
            //emit to the server, the title of the tag, the slide index, and which tag state they are in
            socket.emit('YNRQ_response', {
                title: title,
                section: section,
                response: response
            });
        }

        //template for the sidebar's items
        function bulidSidebarIcon(id, tag_class, src, tip)
        {
            return $('<div id="'+id+'"class="YNRQ '+tag_class+'"> '+ bulidImage(src, tip) +'</div>');
        }

        //template for the sidebar image
        function bulidImage(src, tip)
        {
            return '<img class="clickable" src="'+src+'" title="'+tip+'" />';
        }



        /******** Multiple Choice Functionality ********/

        function highlightChoice(answer)
        {
            //can change to be any style
            $(answer).attr('style', 'text-decoration: underline');
        }

        //add click functionality to the slide, remove the answer class
        $('.answer').click(multiplechoice_click);
        $('.answer').each(function(){
            $(this).removeClass('answer');
        });

        function multiplechoice_click(event)
        {
            //get the click object and the class of that object
            var answer = event.target;
            var answer_class = $(answer).attr('class');

            //remove the style from each answer in this question
            $('.' + answer_class).each(function(){
                $(this).removeAttr('style');
            });

            //can change to be any style
            highlightChoice(answer)

            //send result to the server
            sendMultipleChoiceResponse($(answer).parent().attr("title"), $(answer).attr('id'));
        }

        function sendMultipleChoiceResponse(title, response)
        {
            socket.emit('student_multiple_response', {
                title: title,
                response: response 
            });
        }

        function multiChoice(slide)
        {
            var multi = $(slide).find('multiplechoice');

            if(multi.length > 0)
            {
                //get div
                var div = $(multi).next();

                var list = $(div).find('ol')[0];

                CheckMultipleChoiceStatus($(list).attr('title'), $(list).attr('id'));
            }
        }

        function CheckMultipleChoiceStatus(title, id)
        {
            socket.emit('check_multiple_choice_status', {title: title, id: id});
        }

        //get the response from the server that is the status of the tag according to what is in the database server
        socket.on('multiple_choice_status', function(status){
            if(status.response !== 'a_-1')
            {
                var space = $('#'+status.id);
                var index = parseInt(status.response.replace('a_', ''));
                var item = space.find('li')[index];
                highlightChoice(item);
            }
        });
    }

    Object.keys(MCRQ_title).forEach(function(item){
        socket.emit('check_multiple_choice_question', {title:item, answer: MCRQ_title[item]});
        MCRQ_title[item] = 0;
    });


    socket.on('close_multiple_choice_question', function(chart_data){
        
        if(MCRQ_title[chart_data.title] === 0){
            MCRQ_title[chart_data.title] = 1;

            var title = chart_data.title.replace(/ /g, '_');

            var len = $('#'+title).next().children().length;

            $('#'+title).next().css('display', 'none');

            $('#'+title).after('<canvas id="'+title+'_chart" height="300" width="300" style="padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;"></canvas>');

            createChart(chart_data, $('#'+title+'_chart'), len);
        }
    });


    function createChart(chart_data, canvas, length)
    {
        var title = chart_data.title.replace(/ /g, '_');
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
            
            if(MCRQ_correct_answer[title] === ""+(cnt+1))
            {
                var color = {r:0,g:255,b:0};
                data.datasets[0].borderColor.push(RGBA(color, 1));
                data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
            }
            else{
                var color = {r:0,g:0,b:0};
                data.datasets[0].borderColor.push(RGBA(color, 1));
                data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
            }
        }

        data.datasets[0].data = []
        for(var cnt = 0; cnt < length; cnt++)
            data.datasets[0].data.push(0);
        //get active users
        var activeUsers = chart_data.length - chart_data.inactive;

        //update chart with data for server
        Object.keys(chart_data.answers).forEach(function(item){
            var index = parseInt(item.replace('a_', ''));
            data.datasets[0].data[index] = chartFormat(chart_data.answers[item], activeUsers);
        });

        data.datasets[0].label = "% of Responses: "



        var barChart = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: {
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
                },
                title: {
                    display: true,
                    text: "# of Responses Vs. # Active Users : " + activeUsers + ' vs. '+ chart_data.length
                }
            }
        });
    }

    function chartFormat(score, length)
    {
        return ((length === 0) ? 0 :(score/length) * 100);
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
});
