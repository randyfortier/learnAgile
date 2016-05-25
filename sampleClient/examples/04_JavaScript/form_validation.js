window.onload = function() {
	var form = document.getElementById('form');
	form.onsubmit = function() {
		return validateForm();
	}
};

function validateForm() {
	var firstNameError = validateFirstName();
	var lastNameError = validateLastName();
	var addressError = validateAddress();
	var phoneError = validatePhone();

	clearValidationErrors();

	var formValid = true;

	if (firstNameError !== '') {
		showValidationError('firstNameVal', firstNameError);
		formValid = false;
	}
	if (lastNameError !== '') {
		showValidationError('lastNameVal', lastNameError);
		formValid = false;
	}
	if (addressError !== '') {
		showValidationError('addressVal', addressError);
		formValid = false;
	}
	if (phoneError !== '') {
		showValidationError('phoneVal', phoneError);
		formValid = false;
	}

	return formValid;
}

function clearValidationErrors() {
	clearFieldError('firstNameVal');
	clearFieldError('lastNameVal');
	clearFieldError('addressVal');
	clearFieldError('phoneVal');
}

function clearFieldError(id) {
	var element = document.getElementById(id);
	element.style.display = 'none';
	element.innerHTML = '';
}

function showValidationError(locationId, message) {
	var element = document.getElementById(locationId);

	element.innerHTML = message;

	element.style.display = 'block';
}

function validateFirstName() {
	var field = document.getElementById('FName');
	var value = field.value;

	if ((value.length >= 5) && (value.length <= 20))
		return '';
	  
	return "You must enter a first name (5-20 characters)";
}
function validateLastName() {
	var field = document.getElementById('LName');
	var value = field.value;

	if ((value.length >= 5) && (value.length <= 20))
		return '';
	  
	return "You must enter a last name (5-20 characters)";
}
function validateAddress() {
	var field = document.getElementById('Address');
	var value = field.value;

	if ((value.length >= 5) && (value.length <= 20))
		return '';
	  
	return "You must enter an address (5-20 characters)";
}
function validatePhone() {
	var field = document.getElementById('Phone');
	var value = field.value;

	var phonePattern = /[0-9]{10}/;
	if (!value.match(phonePattern)) {
		return 'The phone number must be ten digits';
	}
	
	return '';
}
