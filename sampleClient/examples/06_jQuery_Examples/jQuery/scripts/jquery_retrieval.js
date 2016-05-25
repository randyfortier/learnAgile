$(document).ready(function() {
	$('#retrieveButton').click(function() {
		var textField = $('#firstNameField');
		var bigDiv = $('#bigDiv');
		$('#results').append('field\'s value attr: ' + textField.attr('value') + '<br />');
		$('#results').append('field\'s value prop: ' + textField.prop('value') + '<br />');
		$('#results').append('field\'s value: ' + textField.val() + '<br />');
		$('#results').append('bigDiv\'s HTML: <pre>' + escapeHTML(bigDiv.html()) + '</pre><br />');
		$('#results').append('bigDiv\'s content: ' + bigDiv.text() + '</pre>');
	});
});
function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}