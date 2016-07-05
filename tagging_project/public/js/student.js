var socket = io();

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
    var response = -1;

    //check to see if the id of the click ite is 'tag_good' which is the "i understand" portion of the tag
    if($(clicked).attr('id') === 'tag_good')
    {
        //set current to good and other to bad, for the color change 
        current = 'good';
        other = 'bad';
        //send to the server 1 when there is a good respose
        response = 1;
    }
    else if($(clicked).attr('id') === 'tag_bad')//check fi tag is 'tag_bad' which is the "i don't understand" portion of the tag
    {
        //set current to bad and other to good, for the color change
        current = 'bad';
        other = 'good';
        //send to the server 0 when it is a bad response
        response = 0;
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
