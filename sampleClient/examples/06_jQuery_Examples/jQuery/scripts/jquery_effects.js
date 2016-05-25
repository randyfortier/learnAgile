$(document).ready(function() {
	$('#resizeme').click(function() {
		$('#resizeme').width($(window).width() / 4);
        $('#resizeme').height($(window).height() / 4);
	});
	
	$('#hideButton').click(function() {
		$('#hideandseek').hide();
		$('#fadeandseek').delay(1000).fadeOut('slow');
		$('#slideandseek').delay(2000).slideUp('slow');
	});

	$('#showButton').click(function() {
		$('#hideandseek').show();
		$('#fadeandseek').delay(1000).fadeIn('fast');
		$('#slideandseek').delay(2000).slideDown('fast');
	});

	$('#toggleButton').click(function() {
		$('#hideandseek').toggle();
		$('#fadeandseek').delay(1000).fadeToggle(1000);
		$('#slideandseek').delay(2000).slideToggle(1000);
	});
	
	$('#animateButton').click(function() {
		$('#animateme').animate({opacity: 0.25,
						         width: '-=100'},
							    5000,
							    function() {
								    // do nothing when animation is done
							    });
	});
});
