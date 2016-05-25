/*var costPattern = /\$[0-9]+/;
var text1 = 'I paid $100 for this item.';
var text2 = text1.replace(costPattern, '$...');
console.log(text2);
*/
var costPattern = /\$[0-9]+/;
var text1 = "I paid $100 for this item.";
var text2 = text1.replace(costPattern, "$...");
console.log(text2);

var wordPattern = /the/ig;
var text3 = "The quick brown fox jumped over the lazy dog";
var text4 = text3.replace(wordPattern, "a");
console.log(text4);

var badWordsPattern = /darn|crud|gosh/ig;
var text5 = "It took me all day to write the gosh darned thing.";
if (text5.match(badWordsPattern)) {
	console.log("This post contains some bad words.");
}