var provinces = {Canada: ['Alberta', 'British Columbia', '...'],
                 USA: ['Alabama', 'Alaska', '...']};

$(document).ready(function() {
	$('#registerButton').click(function() {
		$('#results').append('Button clicked<br />');
	});
	
	$('#registerButton').dblclick(function() {
		$('#results').append('Button double clicked<br />');
	});
	
	$('#registerButton').toggle(function() {
		$('#results').append('Button toggled on<br />');
	}, function() {
		$('#results').append('Button toggled off<br />');
	});
	
	$('form').submit(function() {
		$('#results').append('Form submitted<br />');
		return false;
	});
	
	$('#firstNameField').mouseenter(function() {
		$('#results').append('Text field mouse in<br />');
	});

	$('#firstNameField').mouseleave(function() {
		$('#results').append('Text field mouse out<br />');
	});

	$('#firstNameField').focus(function() {
		$('#results').append('Text field focussed<br />');
	});
	
	$("input[type='text']").change( function() {
		$('#results').append('Text field value changed<br />');
	});
	
	$('#firstNameField').select(function() {
		$('#results').append('Text selected<br />');
	});
	
	$('#countryDropdown').change(function() {
		$('#results').append('Country selected<br />');
		
        content = '';
        $.each(provinces[$('#countryDropdown').val()], function(index, value) {
        	content += '<option>' + value + '</option>';
        });
        $('#provinceDropdown').html(content);
	}).change(); // pre-populate the provinces/states
	
	$('#provinceDropdown').change(function() {
		$('#results').append('Province/state selected<br />');
	});
	
	$('#clearButton').click(function() {
		$('#results').empty();
	});
});