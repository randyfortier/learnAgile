window.onload = function() {
	var h3s = document.getElementsByTagName('h3');
	for (var i = 0; i < h3s.length; i++) {
		var h3tag = h3s[i];
		// we'll use the current CSS class to determine if the element is expanded or collapsed
    	h3tag.onclick = function() {
    		var nextTag = this.nextElementSibling;
    		if (this.getAttribute('class') == 'header') {
    			// the item should be expanded
    			this.setAttribute('class', 'header headerExpanded');
    			nextTag.setAttribute('class', 'details');
    		} else {
    			// the item should be collapsed
    			this.setAttribute('class', 'header');
    			nextTag.setAttribute('class', 'details hidden');
    		}
    	};
	};
};
