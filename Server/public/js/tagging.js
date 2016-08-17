var socket = io();//'http://sci54.science.uoit.ca:3000');
var binary_default = {};
var currentH = 0;
var isDefault = false;
var currentSection = "";
var ActionFunc = null;
var isMobile = false;
var mobileSize = 110;
var mobilePos = "110%"
// var cnt = 0;

var standardTags = {
    'like': {title:'Like', src:'images/like.png'},
    'difficult': {title:'Difficult', src:'images/hard.png'},
    'study': {title:'Study', src:'images/study.png'}
};

//hide the multiplechoice html
$('multiplechoice').css('display','none');

//for each multiple choice html, convert it to current html
$('multiplechoice').each(function(index){
    //the current multiple choice object
    var multi = this;

    //add a spot for the question, and get the question text
    $(multi).after('<div id="question_'+index+'"></div>');
    var question = $(multi).find('question').html();

    //add the question text and an ordered list
    $('#question_'+index).append('<h2 id="'+$(multi).attr('title').replace(' ', '_')+'">'+question+'</h2>');
    $('#question_'+index).append('<ol id="answers_'+index+'" title="'+$(multi).attr('title')+'"></ol>');

    //for each answer in the question add it to the question div, add 2 classes, answer for adding
    //click functionality and answer_'index' to be able to refrenece all answers in one question
    $(multi).find('answer').each(function(a_index){
        $('#answers_'+index).append('<li id="a_'+a_index+'" class="answer answers_'+index+'">'+$(this).text()+'</li>');
    });
});

function setBinary_default(index, text, section)
{
    binary_default['h_' + index] = {xml: text, section:section};
}

$('.slides').children().each(function(index){
    //check for the instances of binary_tags
    var found = $(this).find('.binary_default');
    //if an item is found
    if(found[0])
    {
        setBinary_default(index, $(found[0]).text(), $(found).attr('binary-section'));// add the first binary_default to the default map
    }
    else
    {
        found = $(this).find('.binary_tag');//find the first avaible binary tag

        if(found.length > 0)
            for(var cnt = 0; cnt < found.length; cnt++)
            {
                var bin_tag = found[cnt]
                var section = $(bin_tag).attr('binary-section');
                if(section){
                    setBinary_default(index, $(bin_tag).text(), section);
                    return;
                }
            }
    }   
});

function getXMLData(item)
{
    var standard = standardTags[$(item)[0].tagName.toLowerCase()];

    if(!standard)
    {
        var title = $(item).attr('title');
        var src = $(item).attr('src');
        return {title: title, src:src};
    }
    else
        return standard;
}

function tagAction()
{
    if(ActionFunc !== null)
        ActionFunc();
}
//4
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
                            sendBinaryTags(event.source, origin);
                    }
                }
                else
                {
                    if(data.name){
                        if(!sendMultipleChoice(event.source, origin))
                            sendBinaryTags(event.source, origin);
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

            function sendBinaryTags(source, origin)
            {
                var slide = Reveal.getCurrentSlide();
                var tags = checkNupdateTag(slide, Reveal.getIndices().h); 
                console.log('sendBT, TAGS:', tags);
                source.postMessage(JSON.stringify({
                    BinaryTags: tags//checkNupdateTag(slide, Reveal.getIndices().h)
                }), origin); 
            }

            function multiChoice(slide)
            {
                var multi = $(slide).find('multiplechoice');

                if(multi.length > 0)
                {
                    //get div
                    var div = $(multi).next();

                    var list = $(div).find('ol')[0];

                    return {title: $(list).attr('title'), length: $(list).children().length};
                }
                return {title: "", length: -1};
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
                    return {tags: bulidListfromXML($(rawxml[0]).text()) , section: $(rawxml).attr('binary-section')};
                    
                }
                else
                {
                     //check to see if the a default exists, if so then add the default
                    if(binary_default.hasOwnProperty('h_' + hIndex)){
                        return {tags: bulidListfromXML(binary_default['h_'+hIndex].xml) , section: binary_default['h_'+hIndex].section};
                        // updateTagTitles(binary_default['h_'+hIndex].xml, binary_default['h_'+hIndex].section);
                        // return true;
                    }
                }
                return {tag: null, section: null};
            }

            function bulidListfromXML(xml)
            {
                var list = [];
                //for each child in the xml get the title
                $(xml).children().each(function(){
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
            multiChoice(event.currentSlide);
            // if(isMobile)
            //     $(event.currentSlide).append($('<div>').text("on mobile Device"));
        });

        //when the doucument is ready load the current slide
        $(document).ready(function(){
            currentH = Reveal.getIndices().h;
            slide_load(Reveal.getCurrentSlide());
            multiChoice(Reveal.getCurrentSlide());
        });

        function slide_load(slide)
        {
            //have a vertical sidebar to show the tags for the 
            //add the sidebar to the slide
            removeNAddSidebar(slide, [$('.slides').height(), slide.offsetTop]);

            currentH = Reveal.getIndices().h;
            //check if there is a tag avaiable in the current slide, if ther is load it
            var change = checkNloadCurrentSlideXML(slide);
            
            if(!change)
                //load the default if no change
                loadDefaultBinaryTag(currentH);
        }

        function loadDefaultBinaryTag(index)
        {
            //check to see if the a default exists, if so then add the default
            var hIndex = 'h_' + index;
            if(binary_default.hasOwnProperty(hIndex))
                updateCurrentTags(binary_default[hIndex].xml, binary_default[hIndex].section);
            else // else remove the previous tags
                removeTags();
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
                updateCurrentTags($(rawxml[0]).text(), $(rawxml).attr('binary-section'));
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

        function updateCurrentTags(xml, section)
        {
            removeTags();
            //bulid the tags that are in the xml
            bulidTag(xml, section);
        }

        function bulidTag(xml, section)
        {
            //variable for the name of each of the tags
            var tags = {section: section};
            tags.titles = [];
            //for each child in the xml make a tag out of it
            $(xml).children().each(function(){

                var tagInfo = getXMLData($(this));
                if(!tagInfo.title || !tagInfo.src)
                    return;
                tags.titles.push(tagInfo.title);

                //add to the sidebar a icon that has the title of the child title and the image that is the string location of the text in the child
                $(sidebar).append(bulidSidebarIcon(tagInfo.title + "_" + section.replace(' ', '_'), "icon-disabled", tagInfo.src));
            });
            if(isMobile)
            {
                $('.tagged').css("height", mobileSize);
                $('.tagged').css("width", mobileSize);
                tagSidebar.css("left", mobilePos);

            }

            //check the status of each of the tags, base on what the server has
            CheckTagStatus(tags);

            //add the click function of the images
            $('.tagged').click(tag_click);
        }

        function CheckTagStatus(tags)
        {
            socket.emit('check_binary_tags_status', tags);
        }

        //get the response from the server that is the status of the tag according to what is in the database server
        socket.on('binary_tags_status', function(tag_status){

            tag_status.tag_responses.forEach(function(tag_data){
                //get the tag by it's name
                var tag = $('#' + tag_data.title + '_' + tag_status.section.replace(' ', '_'));
                //check what state that tag was when you last used it
                switch(tag_data.response)
                {
                    case 1:
                        tag.addClass('clicked'); // it was on
                        tag.removeClass('icon-disabled');
                        break;
                    //no default beacause it has the default is coded into tag_click and bulid tag
                }
            });
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
            if(clicked.hasClass('icon-disabled'))//unclicked class
            {
                removed = 'icon-disabled';
                added = 'clicked';
                response = UNDERSTAND_RESPONSE;
            }
            //if the div has clicked then switch the classes and set the response to dontunderstand
            else if(clicked.hasClass('clicked'))//clicked class
            {
                removed = 'clicked';
                added = 'icon-disabled';
                response = DONTUNDERSTAND_RESPONSE;
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
            sendBinaryTagResponse(title, section, response); 
        }

        function sendBinaryTagResponse(title, section, response)
        {
            //emit to the server, the title of the tag, the slide index, and which tag state they are in
            socket.emit('student_binary_response', {
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
            
            var space = $('#'+status.id);
            var index = parseInt(status.response.replace('a_', ''));
            var item = space.find('li')[index];
            highlightChoice(item);
            
        });
    }
    socket.on('close_multiple_choice_question', function(chart_data){
        console.log(chart_data.title);

        var title = chart_data.title.replace(' ', '_');

        var len = $('#'+title).next().children().length;

        $('#'+title).next().remove();

        $('#'+title).after('<canvas id="'+title+'_chart" style="test-align: left"></canvas>');

        createChart(chart_data, $('#'+title+'_chart'), len);

    });


    function createChart(chart_data, canvas, length)
    {
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
            var color = randRGB();
            data.datasets[0].borderColor.push(RGBA(color, 1));
            data.datasets[0].backgroundColor.push(RGBA(color, 0.2));

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

        data.datasets[0].label = "# of Responses Vs. # Active Users : " + activeUsers + ' vs. '+ chart_data.length;



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
