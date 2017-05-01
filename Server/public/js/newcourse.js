
$(document).ready(function(){
	
	//on keypress, change the course Link preview
	$("#course_name").bind('input', function(){

		//get the address of the current page, and string the first part
		var loc = document.location.href;
		var index = loc.indexOf("//") + 2;
		loc = loc.substring(index, loc.indexOf("/", index));

		//output the preview
	  	$("#preview").text(loc + "/"+ $(this).val().replace(/ /g, "").toLowerCase() +"/Lecture.html");

	});


	$("#btnWebPreview").click(function(){
		//retrive the course and adn description, make sure that aren't empty
		var course_name = ($("#course_name").val() === "")? "N/A": $("#course_name").val();
		var course_des = ($("#course_description").val() === "")? "N/A": $("#course_description").val();

		//change the iframe to point at the course_preview page
		$("#webPreview").attr("src", "/course_preview?courseName="+course_name+"&courseDescription="+course_des);
		
	});	

});