var socket = io('http://localhost:3000');
var binary_default = {};
var currentH = 0;
var isDefault = false;
var currentSection = "";
var ActionFunc = null;

var standardTags = {
    'en': {title:'Einstein', src:'images/Einstein.png'},
    'heart': {title:'Heart', src:'images/Heart.png'},
    'like': {title:'Like', src:'images/like.png'},
    'hard': {title:'Hard', src:'images/hard.png'},
    'study': {title:'Study', src:'images/study.png'}
};

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
        setBinary_default(index, $(found[0]).text(), $(found).attr('binarysection'));// add the first binary_default to the default map
    }
    else
    {
        found = $(this).find('.binary_tag')[0];//find the first avaible binary tag

        if(found)//if there is a binary tag add it
            setBinary_default(index, $(found).text(), $(found).attr('binarysection'));
    }   

});

function getXMLData(item)
{
    return standardTags[$(item)[0].tagName.toLowerCase()];
}

function tagAction()
{
    if(ActionFunc !== null)
        ActionFunc();
}

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $('.tagged').css('width', 100);
    $('.tagged').css('height', 100);
    screen.lockOrientation('landscape');
}

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
                        sendXML(event.source, origin);
                    }
                }
                else
                {
                    if(data.name){
                        sendXML(event.source, origin);
                        lec_name = data.name;
                        Reveal.addEventListener( 'slidechanged', function( event ) {
                            //sends a siginal to the server to change the students slides
                            socket.emit('instructor-moveslide', [event.indexh,event.indexv]);
                        });

                    }
                }
            });

            function sendXML(source, origin)
            {
                var slide = Reveal.getCurrentSlide();

                source.postMessage(JSON.stringify({
                    Tags: checkNupdateTag(slide, Reveal.getIndices().h)
                }), origin); 
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
                    return {tags: bulidListfromXML($(rawxml[0]).text()) , section: $(rawxml).attr('binarysection')};
                    
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
                    list.push(getXMLData($(this)).title);
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
        });

        //when the doucument is ready load the current slide
        $(document).ready(function(){
            currentH = Reveal.getIndices().h;
            slide_load(Reveal.getCurrentSlide());
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
                updateCurrentTags($(rawxml[0]).text(), $(rawxml).attr('binarysection'));
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
            var tags = [];
            //for each child in the xml make a tag out of it
            $(xml).children().each(function(){
                var tagInfo = getXMLData($(this));
                tags.push({title:tagInfo.title, section: section});

                //add to the sidebar a icon that has the title of the child title and the image that is the string location of the text in the child
                $(sidebar).append(bulidSidebarIcon(tagInfo.title + "_" + section, "icon-disabled", tagInfo.src));
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
                    tag.addClass('clicked'); // it was on
                    tag.removeClass('icon-disabled');
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