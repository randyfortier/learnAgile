window.onload = function() {
	var checkButton = document.getElementById('checkButton');
	checkButton.onclick = function() {
		var numberField = document.getElementById('number');
		var input = numberField.value;
		var num = parseInt(input);

		if (num <= 10) {
			console.log('That is a small number!');
		} else if (num <= 20) {
			console.log('That is a normal number.');
		} else {
			console.log('That is a big number!');
		}

		switch (num) {
			case 2:
				console.log('You guessed it!');
				break;
			case 1:
				console.log('A little higher...');
				break;
			case 3:
				console.log('A little lower...');
				break;
			default:
				console.log('Not even close!');
		}
	};
};
