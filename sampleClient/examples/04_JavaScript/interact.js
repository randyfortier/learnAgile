window.onload = function() {
	var button = document.getElementById('helloButton');
	button.onclick = function() {
		var fnameField = document.getElementById('fname');
		var name = fnameField.value;
		var output = document.getElementById('output');
		output.value = 'Hello, ' + name + '!';
	};	
};
