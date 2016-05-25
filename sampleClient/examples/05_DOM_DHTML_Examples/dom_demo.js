window.onload = function () {
    setCurrentElement(document.getElementsByTagName('p')[0]);
    
    var btnParent = document.getElementById('btnParent');
    btnParent.onclick = function () {
        if (currentElement.parentElement) {
            setCurrentElement(currentElement.parentElement);
        }
    };

    var btnPrevSibling = document.getElementById('btnPrevSibling');
    btnPrevSibling.onclick = function () {
        if (currentElement.previousElementSibling) {
            setCurrentElement(currentElement.previousElementSibling);
        }
    };

    var btnNextSibling = document.getElementById('btnNextSibling');
    btnNextSibling.onclick = function () {
        if (currentElement.nextElementSibling) {
            setCurrentElement(currentElement.nextElementSibling);
        }
    };

    var btnFirstChild = document.getElementById('btnFirstChild');
    btnFirstChild.onclick = function () {
        if (currentElement.firstElementChild) {
            setCurrentElement(currentElement.firstElementChild);
        }
    };

    var btnLastChild = document.getElementById('btnLastChild');
    btnLastChild.onclick = function () {
        if (currentElement.lastElementChild) {
            setCurrentElement(currentElement.lastElementChild);
        }
    };
    
    var lstVisibility = document.getElementById('lstVisibility');
    lstVisibility.onchange = function () {
        var selectedIndex = lstVisibility.selectedIndex;
        var selectedVal = lstVisibility.options[selectedIndex].text;
        setVisibility(selectedVal);
    };
    
    var btnAdd = document.getElementById('btnAdd');
    btnAdd.onclick = function () {
        var newPlaceField = document.getElementById('newPlaceField');
        var newPlace = newPlaceField.value;
        
        var coolPlaces = document.getElementById('coolPlaces');
        
        var newPlaceElement = document.createElement('li');
        var newPlaceContent = document.createTextNode(newPlace);
        newPlaceElement.appendChild(newPlaceContent);
        coolPlaces.appendChild(newPlaceElement);
    };

    var btnSelect = document.getElementById('btnSelect');
    btnSelect.onclick = function () {
        var cssSelectorField = document.getElementById('cssSelectorField');
        var cssSelector = cssSelectorField.value;
		var match = document.querySelector(cssSelector);
		setCurrentElement(match);
    };
};

var currentElement;
function setCurrentElement(element) {
    // De-select the previously selected elements
    if (currentElement) {
        currentElement.className = '';
    }
    
    // select the new element
    currentElement = element;
    currentElement.className = 'selected';
    log(currentElement);
}

function setVisibility(visibility) {
    currentElement.style.display = visibility;
}

function log(msg) {
    var console = document.getElementById('console');
    console.innerHTML += '<div>' + msg + '</div>';
}