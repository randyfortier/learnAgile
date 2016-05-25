$(document).ready(function() {
	$('h3').click(function() {
		// toggle class turns a class on or off, depending in its current state
		$(this).toggleClass('headerExpanded');
		$(this).next().toggleClass('hidden');
	});
});
