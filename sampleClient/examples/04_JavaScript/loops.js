window.onload = function() {
	var checkButton = document.getElementById('checkButton');
	checkButton.onclick = function() {
		// for simplicity, we'll hard code the power of 2 in this variable
		var power = 8;

		var value = 1;
		do {
			value *= 2;
			power--;
		} while (power > 0);
		console.log('Result: ' + value);

		value = 1;
		power = 8;
		while (power > 0) {
			value *= 2;
			power--;
		}
		console.log('Result: ' + value);

		// we'll use this sentence to drive our counter-driven loop      
		var sentence = 'the quick brown fox jumped over the lazy dog';
		var words = sentence.split(' ');

		var index = 0;
		var count = 0;
		while (index < words.length) {
			// most pointless loop ever!
			count++;
			index++;
		}
		console.log(sentence + ' contains ' + count + ' words.');

		var value = 1;
		while (true) {
			value++;      // for the sake of demonstration

			if ((value % 2) == 1) {
				continue; // skip odd numbers
			}

			if ((value % 7) == 0) {
				break;
			}
		}
		console.log('First even number divisible by 7: ' + value);

		var numberField = document.getElementById('number');
		var input = numberField.value;
		var n = parseInt(input);
		var value = 1;
		for (var i = n; i >= 1; i--) {
			value *= i;
		}
		console.log('' + n + '! == ' + value);
	};
};
