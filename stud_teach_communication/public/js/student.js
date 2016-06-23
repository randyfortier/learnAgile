var socket = io();

socket.on('student-moveslide', function(indexies){
	Reveal.slide(indexies[0], indexies[1], 0);
});
