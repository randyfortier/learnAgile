$(document).ready(function(){
	
	// uses setTimeout function recursively to make timer/thread
	function DisplayTimer(){
		setTimeout(function(){
			UpdateText();
			DisplayTimer();
		}, 1000);
	}

	//updates the text on ther screen by removing the time id paragraph and adds a new paragraph wiht the time.
	function UpdateText(){
		$('#time').remove();
		$('#clock').append("<p id='time'>Time: " + clockText() + " </p>");
	}

	//function to retrive Timer as a string
	function clockText()
	{
		var time = new Date();
		return time.getHours() + ":" + time.getMinutes() + ":" + ((time.getSeconds() < 10)? "0" + time.getSeconds():time.getSeconds());
	}

	//update the text at first
	UpdateText();

	//start display timer.
	DisplayTimer();

});