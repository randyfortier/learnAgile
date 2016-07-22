// var socket = io();

// var Table = $('<table id="student_table"></table>');

// $(document).ready(function(){

// 	socket.emit('get_student_report_data', lec_stud);

// });
// socket.on('table_data', function(table_data){
// 	updateTable(table_data);
// });

// function updateTable(table_data)
// {
// 	$('.removable').remove();



// 	var tableInsert = makeTableInsert("Tag", "Response");

// 	$(Table).append(tableInsert);


// 	var	score = 0;
// 	table_data.forEach(function(item, index){

// 		var id = item.tag_title;
// 		var value = item.response;

// 		if(value === 1)
// 			score++;

// 		var tableInsert = makeTableInsert(id, ParseDBResponse(value));

// 		$(Table).append(tableInsert);

// 	});

// 	$('#table_area').append(Table);
// 	$('#score_area').text("Score : " + score/table_data.length);
// }

// function makeTableInsert(id, value)
// {
// 	return '<tr class="removable"><td>'+ id +'</td><td>'+ value+'</td></tr>';	
// }

// function ParseDBResponse(value)
// {
// 	switch(value)
// 	{
// 		case 1: // understand
// 			return "U";
// 		case 0: //don't understand
// 			return "D";
// 		default: //default is unknown and -1
// 			return "UNK";
// 	}
// }

