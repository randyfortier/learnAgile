$(document).ready(function() {
	//$('body').addClass('selected');

	$('#parentButton').click(function() {
		$('#current').parent().toggleClass('selected');
	});
	
	$('#childrenButton').click(function() {
		$('#current').children().toggleClass('selected');
	});
	
	$('#nextButton').click(function() {
		$('#current').next().toggleClass('selected');
	});
	
	$('#prevButton').click(function() {
		$('#current').prev().toggleClass('selected');
	});
	
	$('#siblingsButton').click(function() {
		$('#current').siblings().toggleClass('selected');
	});
	
	$('#findButton').click(function() {
		var userText = $('#field').val();
		$('#current').find(userText).toggleClass('selected');
	});
});
