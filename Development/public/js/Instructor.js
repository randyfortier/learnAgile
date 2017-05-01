function setUpInstructor(){

	//there is a parent when the page is in notes.js mode(loaded in a iframe)
	if(window.parent)
	{
		//varable use to set up the connection with the notes.js
		var lec_name = undefined;

		//add a listener for the conection with the notes.js
		window.addEventListener('message', function(event){
			var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
			var data = JSON.parse( event.data );
			//if a connection has been made
			if(lec_name)
			{
				//if there has been a change in slides
				if(data.method === 'setState')
				{
					//send the data to the Notes
					sendDataToNotes(event, origin);
				}
			}
			else
			{
				//if name is avaiable then setup connection with notes.js
				if(data.name){
					//set the lec_name
					lec_name = data.name;

					//setup way for students to follow the teacher automatically
					Reveal.addEventListener( 'slidechanged', function( event ) {
						//sends a siginal to the server to change the students slides
						socket.emit('instructor-moveslide', [event.indexh,event.indexv]);
					});
					//send message to notes.js of the current courseID and lecture ID for
					//the setup for the Socket.io
					event.source.postMessage(JSON.stringify({
						courseID: CourseID,
						lectureID: LectureID
					}), origin);
					//send the notes of the current data
					sendDataToNotes(event, origin);
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
			//get slide and the mutliple choice data if it exists on the page
			var slide = Reveal.getCurrentSlide();
			var multi = multiChoice(slide);

			if(multi.length !== -1){
				//send mutilpleChoice data to notes.js
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

			if(multi.length > 0)
			{

				//get div
				var div = $(multi).next();
				var list = $(div).find('ol')[0];

				//send the title and the total number of answers
				return {title: $(list).attr('title'), length: $(list).children().length};
			}
			return {title: "", length: -1};
		}
		
		function sendYNRQs(source, origin)
		{
			//set slide adn YNRQS if they are on the current slide
			var slide = Reveal.getCurrentSlide();
			var YNRQs = checkNretriveYNRQ(slide, Reveal.getIndices().h);

			//send to notes.js
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