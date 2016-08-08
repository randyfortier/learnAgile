$.post("/status", function(status){
	var data = JSON.parse(status);
	if(data.loggedin)
	{
		console.log('true');
		$('.loggedin, .isStudent').show();
		if(data.isInstructor)
			$('.isInstructor').show();
	}
	else
	{
		console.log('false');
		$('.not-loggedin').show();
	}
	console.log(data);
	console.log('ran');
});
console.log('ran');