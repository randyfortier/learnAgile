var socket = io();


socket.on('report_course_overview', function(report){

	console.log(report);
	var studStats = {};
	var lecStats = {};

	report.forEach(function(item){
		updateReportData(lecStats, item.lecture, item.tag_title, item.response);
		updateReportData(studStats, item.studentid, item.tag_title, item.response);		
	});

	console.log(studStats);
	console.log(lecStats);


	// Object.keys(studStats).forEach(function(student){//each leacture
	// 	console.log(student);
	// 	var lec = studStats[student];
	// 	Object.keys(lec).forEach(function(tag){//each tag
	// 		$('#StudentTable').append(makeTableInsert(tag, percentFormat(lec[tag].score, lec[tag].length)));
	// 	});
	// });
	addToTable(studStats);
	addToTable(lecStats);

});

function addToTable(stats)
{
	Object.keys(stats).forEach(function(type){//each leacture
		var typ = stats[type];
		Object.keys(typ).forEach(function(tag){//each tag
			$('#StudentTable').append(makeTableInsert(tag, percentFormat(typ[tag].score, typ[tag].length)));
		});
	});

}

function percentFormat(score, length)
{
	return (((score || 0)/length) * 100) + "%";
}

function makeTableInsert(id, value)
{
	return '<tr class="removable"><td>'+ id +'</td><td>'+ value+'</td></tr>';	
}

function updateReportData(stats, type, tag_title, response)
{
	if(!stats[type]){
		stats[type] = {};
		// stats[type].score = {};
		// stats[type].length = {};
	}
	var stype = stats[type];
	if(!stype[tag_title]){
		stype[tag_title] = {};
	}
	

	if(response > 0 ) // it is one
		stype[tag_title].score = (stype[tag_title].score + 1 || 1);
	stype[tag_title].length = (stype[tag_title].length + 1 || 1);
}

$(document).ready(function(){
	socket.emit('course_overview_report');
});