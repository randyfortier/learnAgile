
var table_content = '<tr><th>Tag Name</th><th>Overall Yes% (Student/Average)</th><th>Overall No% (Student / Average)</th><th>Overall Unknown% (Student / Average)</th><th>Yes% that gave an answer (Student / Average)</th><th>No% that gave an answer (Student / Average)</th></tr>';

var overallColspan = 6;

$(document).ready(function(){
	$.get('courseReport',function(lec_data){
		var data = JSON.parse(lec_data);
		var lec = data.lectures;
		var allLec = data.alldata;

		$('#lecture_table').append(table_content);
		$('#avg_table').append(table_content);

		addToTable('lecture_table', lec);
		addToTable('avg_table', allLec);
		
		$('.lecture').click(function(event){
			invokePostCall('/lectureReport', 'lecture', $(event.target).text());
		});
		addTableColour();
		console.log("ran");
	});

});

function invokePostCall(action, postName, value)
{
	var form = $('<form style="display: none" action="'+action+'", method="post"><input id="postVar" name="'+postName+'"/><input id="postVar2" name="student"/><button id="go"></button></form>');
	form.find('#postVar').val(value);
	form.find('#postVar2').val('#{userid}');
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

function addToTable(tableid, stats)
{
	Object.keys(stats).forEach(function(lecture){//each leacture/student
		var lecVar = stats[lecture];

		$('#' + tableid).append(makeHeadTableInsert(lecture, overallColspan));

		Object.keys(lecVar).forEach(function(section){//each section
			var secVar = lecVar[section];

			$('#' + tableid).append(makeNameTableInsert(section, overallColspan));
			Object.keys(secVar).forEach(function(tag){//each tag
				$('#' + tableid).append(makeTableInsert(tag, secVar[tag]));
			});
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