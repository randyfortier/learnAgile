function ascending(val1, val2) { 
	return parseInt(val1) - parseInt(val2); 
}

var myarray = [3,1,7,9,6,2];
var found = false;
for (var i = 0; i < myarray.length; i++) {
	if (myarray[i] == 9) {
		found = true;
		break;
	}
}
if (found) {
	console.log('Found 9 (using linear search)');
} else {
	console.log('Did not find 9 (using linear search)');
}

var myarray2 = myarray.sort(ascending); // array2 == [1,2,3,6,7,9]
var start = 0;
var end = myarray2.length - 1;
found = false;
while (start <= end) {
	var mid = Math.floor((end - start) / 2) + start;

	if (myarray2[mid] == 6) {
		found = true;
		break;
	} else if (myarray2[mid] < 6) {
		start = mid + 1; // search to the right of the midpoint
	} else {             //if (myarray2[mid] > 6) {
		end = mid - 1;   // search to the left of the midpoint
	}
}

if (found) {
	console.log('Found 6 (using binary search)');
} else {
	console.log('Did not find 6 (using binary search)');
}

var grades = {"100000001": "A",
              "100000013": "C",
              "100000015": "C-",
              "100000019": "B-",
              "100000022": "C-",
              "100000037": "C+",
              "100000051": "F",
              "100000059": "B+",
              "100000063": "F",
			  };
var sid = "100000037";
console.log("The grade of " + sid + " is " + grades[sid]);