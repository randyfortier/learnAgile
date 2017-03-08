function setUpInstructor(){
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
                    sendDataToNotes(event, origin);
                }
            }
            else
            {
                if(data.name){
                    sendDataToNotes(event, origin);
                    lec_name = data.name;
                    Reveal.addEventListener( 'slidechanged', function( event ) {
                        //sends a siginal to the server to change the students slides
                        socket.emit('instructor-moveslide', [event.indexh,event.indexv]);
                    });

                }
            }
        });

        function sendDataToNotes(event, origin)
        {
            if(!sendMultipleChoice(event.source, origin))
                sendYNRQs(event.source, origin);
        }

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
        
        function sendYNRQs(source, origin)
        {
            var slide = Reveal.getCurrentSlide();
            var YNRQs = checkNretriveYNRQ(slide, Reveal.getIndices().h);
            source.postMessage(JSON.stringify({
                YNRQuestion: YNRQs
            }), origin); 
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
                var data = getYNRQDataFromXML($(this));
                if(!data.title || !data.src)
                    return;    
                list.push(data.title);
            });
            return list;
        }
    }
}