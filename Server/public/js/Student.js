function Student(){
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
                $('#sidebar').css('left', '100%');
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
                $('#sidebar').append(bulidSidebarIcon(YNRQInfo.title + "_" + section.replace(/ /g, '_'), "icon-disabled", YNRQInfo.src, YNRQInfo.tip));
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