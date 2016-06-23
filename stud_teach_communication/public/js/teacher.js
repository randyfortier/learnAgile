var socket = io();

Reveal.addEventListener( 'slidechanged', function( event ) {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv
    socket.emit('teacher-moveslide', [event.indexh,event.indexv]);
} );