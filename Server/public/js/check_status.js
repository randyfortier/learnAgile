$.post("/status", function(status){
	var data = JSON.parse(status);
	if(data.loggedin)
	{
		$('.loggedin, .isStudent').show();
		if(data.isInstructor)
			$('.isInstructor').show();
	}
	else
	{
		$('.not-loggedin').show();
	}
});