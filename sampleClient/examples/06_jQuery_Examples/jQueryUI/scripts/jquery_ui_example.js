var provinces = [
      "Alberta",
      "British Columbia",
      "Manitoba",
      "New Brunswick",
      "Newfoundland",
      "Northwest Territories",
      "Nova Scotia",
      "Nunavut",
      "Ontario",
      "Prince Edward Island",
      "Quebec",
      "Saskatchewan",
      "Yukon"
    ];
    
function donothing() {
}

$(document).ready(function() {
	$('#virusWarningDialog').dialog();
    $('#navigationMenu').menu();
    $('#accordion').accordion();

	// controls inside the first accordion section, UI widgets
	$('button').button().click(function(event) {
		$('#virusWarningDialog').dialog("close");
        event.preventDefault();
    });
    $('#mainTabPanel').tabs();
    $('#dateOfBirth').datepicker();
    $('#province').autocomplete({
      source: provinces
    });
    $('#adHatred').slider();
    $('#spamVolume').spinner();
    
    // controls for the other accordion section, progress bar
    $('#progress').progressbar({value: 0});
    $('#progress').progressbar('option', 'max', 25);
    $('#clickingText').click(function() {
        var value = $('#progress').progressbar('option', 'value');
        if (value < 25) {
        	$('#progress').progressbar('option', 'value', value + 1);	
        } else {
        	$('#progress').after("<div>Stage 1 of 68 completed!</div>");
        }
    });
    
    // controls for the second tab, effects
    
    // disappearing effects
    $('#blind').click(function() {
    	$(this).effect('blind', {}, 500, donothing);
    });

    $('#clip').click(function() {
    	$(this).effect('clip', {}, 500, donothing);
    });

    $('#drop').click(function() {
    	$(this).effect('drop', {}, 500, donothing);
    });

    $('#explode').click(function() {
    	$(this).effect('explode', {}, 500, donothing);
    });

    $('#fade').click(function() {
    	$(this).effect('fade', {}, 500, donothing);
    });

    $('#fold').click(function() {
    	$(this).effect('fold', {}, 500, donothing);
    });

    $('#puff').click(function() {
    	$(this).effect('puff', {}, 500, donothing);
    });

	// highlighting effects
    $('#bounce').click(function() {
    	$(this).effect('bounce', {}, 500, donothing);
    });

    $('#highlight').click(function() {
    	$(this).effect('highlight', {}, 500, donothing);
    });

    $('#pulsate').click(function() {
    	$(this).effect('pulsate', {}, 500, donothing);
    });

    $('#shake').click(function() {
    	$(this).effect('shake', {}, 500, donothing);
    });

    $('#size').click(function() {
    	$(this).effect('size', { to: { width: 200, height: 60 } }, 500, donothing);
    });

    $('#slide').click(function() {
    	$(this).effect('slide', {}, 500, donothing);
    });

	// transitions    
    $('#scale').click(function() {
    	$(this).effect('scale', { percent: 0 }, 500, donothing);
    });

    $('#colourAnim').click(function() {
    	$('#colourAnim').animate({ backgroundColor: '#aa0000',
    	                           color: '#ffffff'}, 2000 );
    });
    
    // controls for the third tab, interaction
	$('#draggable').draggable();
	$('#droppable').droppable({drop: function() {
    	$('#results').append('<div>Dropped</div>');
    }});
	$('#selectable').selectable();
	$('#resizable').resizable();
    
    $(document).tooltip();
});