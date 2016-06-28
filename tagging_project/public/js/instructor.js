var socket = io();

Reveal.addEventListener( 'slidechanged', function( event ) {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv
    
    //sends a siginal to the server to change the students slides
    socket.emit('instructor-moveslide', [event.indexh,event.indexv]);

});