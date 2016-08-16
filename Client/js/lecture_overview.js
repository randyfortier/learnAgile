var StudentSIDtoID = {};
var socket = io();
var	current_lecture = '';
var table_content = '<tr><th>Tag Name</th><th>Overall Yes%</th><th>Overall No%</th><th>Overall Unknown%</th><th>Yes% that gave an answer</th><th>No% that gave an answer</th></tr>';
var overallColspan = 6;

$(document).ready(function(){
	socket.on('return_userid_to_sid', function(sidResult){
		var sid = sidResult.sid;
		StudentSIDtoID[sid] = sidResult.studentid;
		$('#id_'+sidResult.index).text(sid);
	});

	$.post('/lectureOverview',function(lec_data){
		var data = JSON.parse(lec_data);
		var stud = data.students;//lectures;
		var sect = data.sections;//alldata;
		current_lecture = data.lecture;
		console.log(data);

		var secTable = 'section_table';
		var studTable = 'student_table';
		$('#' + secTable+ ', #' + studTable).append(table_content);

		addToTable(secTable, sect);
		addToTable(studTable, stud, true);
		
		$('.student').click(function(event){
			invokePostCall('/lectureReport', 'student', StudentSIDtoID[$(event.target).text()], 'lecture', current_lecture);
		});
		addTableColour();
		console.log("ran");
	});

});

function invokePostCall(action, postName, value, postName2, value2)
{
	var form = $('<form style="display: none" action="'+action+'", method="post"><input id="postVar" name="'+postName+'"/><input id="postVar2" name="'+postName2+'"/><button id="go"></button></form>');
	form.find('#postVar').val(value);
	form.find('#postVar2').val(value2);
	form.find('#go').trigger("click");
}



function createScoreData(item)
{
    return {
        overallYes: percentFormat(item.U, item.length),
        overallNo: percentFormat(item.D, item.length),
        overallUnknown: percentFormat(item.UNK, item.length),
        givenYes: percentFormat(item.U, item.U+item.D),
        givenNo: percentFormat(item.D, item.U+item.D)
    };
}

function addToTable(tableid, stats, student)
{
	var isStudent = (student || false);
	Object.keys(stats).forEach(function(select, index){//each section
		var secVar = stats[select];

		if(isStudent){
			$('#' + tableid).append(makeHeadTableInsert(select, index, overallColspan));
			socket.emit('userid_to_sid', {studentid: select, index: index});

		}
		else
			$('#' + tableid).append(makeNameTableInsert(select, overallColspan));
		Object.keys(secVar).forEach(function(tag){//each tag
			$('#' + tableid).append(makeTableInsert(tag, secVar[tag]));
		});
	});
}

function makeHeadTableInsert(value, colspan)
{
	return '<tr class="removable"><th class="lecture" colspan='+colspan+'>'+ value+'</td></tr>';	
}

function makeNameTableInsert(title, colspan)
{
	return '<tr class="removable "><td class="title" colspan='+colspan+'>'+ title + '</td></tr>';	
}

function makeTableInsert(tag, item)
{
	var calScore = createScoreData(item);
	return '<tr class="removable">'+
	'<td>'+tag+'</td>' +
	'<td>'+ calScore.overallYes +'</td>' +
	'<td>'+ calScore.overallNo + '</td>' +
	'<td>'+ calScore.overallUnknown + '</td>' +
	'<td>'+ calScore.givenYes + '</td>' +
	'<td>'+ calScore.givenNo + '</td></tr>';	
}

function percentFormat(score, length)
{
	return ((length === 0) ? '0.00' :((score/length) * 100).toFixed(2)) + "%";
}

function addTableColour()
{
	$('td').each(function(){
		var text = $(this).text();

		if(text.includes('%'))
		{
			text = text.substr(0, text.length -1);
			var percent = Number(text);

			if(percent >= 90)
				$(this).addClass('exellent');
			else if(percent >= 80)
				$(this).addClass('great');
			else if(percent >= 70)
				$(this).addClass('good');
			else if(percent >= 60)
				$(this).addClass('ok');
			else if(percent >= 50)
				$(this).addClass('bad');
			else
				$(this).addClass('need_help');
		}
	});
}