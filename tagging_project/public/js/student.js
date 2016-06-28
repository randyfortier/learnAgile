var socket = io();

var tagSidebar = $('<div id="sidebar"></div>');;
//NOTE: when adding sidebar, height at 100% only matches the height of the text on the screen
//adjusts that when adding to a new slide

/*$(document).ready(function(){
    /* called right at the begin, before the presentation is loaded
     * i tried reveal's event "ready", but it was called after "slidechange" when loading any but the first page
     * i want to have the side bar set up before slidechage is called because i want to be able to remove the need for
     * checking for null for the sidebar
     

    //add the the vertical bar, left side of the screen
    tagSidebar = $('<div id="sidebar"></div>');

});*/


//moves to the slide that the server send, to the teachers slide
socket.on('student-moveslide', function(indexies){
    Reveal.slide(indexies[0], indexies[1], 0);
});



Reveal.addEventListener( 'slidechanged', function( event ) {
    //easier access to the current slide variable
    var slide = event.currentSlide;

    //add the sidebar to the slide
    removeNAddSidebar(slide, [$('.slides').height(), slide.offsetTop]);

    //remove the interaction box form the previous slide
   	$('#tag').remove();
 
    //testing for xml input
    var rawxml = $(slide).find('.feedback');

    //use !== 0 beacuse find returns a empty array
    if(rawxml.length !== 0)
    {
    	//NOTE: have script be type='text/xml', also parseXML didn't work and gave error
		bulidFeedbackTag(slide, $(rawxml[0]).text());

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

function bulidFeedbackTag(slide, xml)
{
    //retrive the values for the xml script and place them into tags
    var title = $('<h3 id="tag_title"></h3>').text($(xml).find('title').text());
    var yes = $('<div id="tag_good"></div>').text($(xml).find('positive').text());
    var no = $('<div id="tag_bad"></div>').text($(xml).find('negative').text());

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
}

//when the tag item is clicked
function tag_click(event)
{
    //this is the text item that was clicked
    var clicked = event.target;
    var slideIndices = Reveal.getIndices(); //the slide numbers
    var indexLocation = slideIndices.h +'.'+ slideIndices.v; //text visiual for the sidebar
    var indexID = slideIndices.h +'_'+ slideIndices.v;//text for the id of the div

    //check to see if the id of the click ite is 'tag_good' which is the "i understand" portion of the tag
    if($(clicked).attr('id') === 'tag_good')
    {
        if($(sidebar).find('#slide_'+indexID).length === 0)
            $(sidebar).append(bulidSidebarIcon(indexID, indexLocation));
    }
    else
        //because of a binary tag, this is when the id tag_bad
        $('#slide_'+indexID).remove();
}

function bulidSidebarIcon(id, innerItem)
{
    return $('<div id="slide_'+id+'"class="tagged"> '+ innerItem +'<div>');
}
