$(document).ready(function() {
	$('#textButton').click(function() {
		var value = $('#valueField').val();
		$('#bigDiv').text(value);
	});

	$('#htmlButton').click(function() {
		var value = $('#valueField').val();
		$('#bigDiv').html('<div>' + value + '</div>');
	});

	$('#colorButton').click(function() {
		var value = $('#valueField').val();
		$('#bigDiv').css('background', value);
	});

	$('#backButton').click(function() {
		var value = $('#bigDiv').html();
		$('#valueField').val(value);
	});

	$('#appendButton').click(function() {
		var value = $('#valueField').val();
		//$('<div>' + value + '</div>').appendTo($('#bigDiv'));
		$('#bigDiv').append('<div>' + value + '</div>');
	});

	$('#prependButton').click(function() {
		var value = $('#valueField').val();
		$('<div>' + value + '</div>').prependTo($('#bigDiv'));
		//$('#bigDiv').prepend('<div>' + value + '</div>');
	});

	$('#beforeButton').click(function() {
		var value = $('#valueField').val();
		$('<div>' + value + '</div>').insertBefore($('#bigDiv'));
		//$('#bigDiv').before('<div>' + value + '</div>');
	});

	$('#afterButton').click(function() {
		var value = $('#valueField').val();
		//$('<div>' + value + '</div>').insertAfter($('#bigDiv'));
		$('#bigDiv').after('<div>' + value + '</div>');
	});

	$('#wrapButton').click(function() {
		$('#bigDiv').wrap('<div class="wrapper" />');
	});

	$('#replaceButton').click(function() {
		$('#bigDiv').replaceWith('<div id="#bigDiv">Nothing to see here</div>');
	});

	$('#replaceAllButton').click(function() {
		$('<div>Boom!</div>').replaceAll('div');
	});

	$('#copyButton').click(function() {
		var copy = $('#bigDiv').clone();
		$('body').append(copy);
	});
});