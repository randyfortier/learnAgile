var StudentSIDtoID = {};
var overallColspan = 10;
var table_content = '<tr><th>Tag Name</th><th>Yes</th><th>No</th><th>No Response</th><th>Total</th><th>Overall Yes%</th><th>Overall No%</th><th>Overall Unknown%</th><th>Yes% that gave an answer</th><th>No% that gave an answer</th></tr>';

$.post('/course_overview', function(report){
	var studStats = report.studStats;
	var lecStats = report.lecStats;
	StudentSIDtoID = {};

	$('#StudentTable, #CourseTable').append(table_content);
	
	addToTable(studStats, 'StudentTable');
	addToTable(lecStats, 'CourseTable');

	addChart('student_chart', studStats, 'Hard');

	addTableColour();
});


function addChart(canvas, stats, tag_name)
{
	var data = {};
	data.labels = [];
	data.datasets = [{}];
	data.datasets[0].label = "Understanding";
	data.datasets[0].borderWidth = 1;
	data.datasets[0].borderColor = [];
	data.datasets[0].backgroundColor = [];
	data.datasets[0].data = [];

	Object.keys(stats).forEach(function(section){//each section
		var secVar = stats[section];

		data.labels.push(section);

		var tag = secVar[tag_name];
		var color = randRGB();
		data.datasets[0].borderColor.push(RGBA(color, 1));
		data.datasets[0].backgroundColor.push(RGBA(color, 0.2));
		data.datasets[0].data.push(chartFormat(tag.U, tag.U+tag.D));
	});

	var myBarChart = new Chart($('#' + canvas), {
		type: 'bar',
		data: data,
		options: {
			responsive: false,
			animation: false,
			scales: {
				yAxes:[{
					ticks: {
						min : 0,
						max : 100,
						maxTicksLimit: 4,
						stepSize: 25
					}
				}]
			}
		}
	});
}			

function chartFormat(score, length)
{
	return ((length === 0) ? '0' :(score/length) * 100);
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

function addToTable(stats, tableid)
{
	Object.keys(stats).forEach(function(type, index){//each leacture/student
		var typ = stats[type];
		var opt = {};
		if(tableid === 'StudentTable'){
			opt = {type:1, classname:'student', index:index};
			// socket.emit('userid_to_sid', {studentid: type, index: index});
		}
		else
			opt = {type:2, classname: 'lecture'};

		$('#' + tableid).append(makeNameTableInsert(type, opt, overallColspan));

		Object.keys(typ).forEach(function(tag){//each tag
			$('#' + tableid).append(makeTableInsert(tag, typ[tag]));
		});
	});
}

function percentFormat(score, length)
{
	return ((length === 0) ? '0.00' :((score/length) * 100).toFixed(2)) + "%";
}

function makeHeadTableInsert(value, classname, colspan)
{
	return '<tr class="removable '+classname+'"><th colspan='+colspan+'>'+ value+'</td></tr>';	
}


function makeNameTableInsert(title, opt, colspan)
{
	var addID = "";

	if(opt.type === 1)
		addID = 'id="class_'+opt.index+'"';

	return '<tr class="removable"><td class="title '+opt.classname+'" '+addID+' colspan='+colspan+'>'+ title + '</td></tr>';	
}

function makeTableInsert(tag, item)
{
	return '<tr class="removable"><td>'+ tag+'</td><td>'+ item.U+'</td><td>'+ item.D+'</td><td>'+ item.UNK+'</td><td>'+ item.length+'</td><td>'+ percentFormat(item.U, item.length)+'</td><td>'+ percentFormat(item.D, item.length)+'</td><td>'+ percentFormat(item.UNK, item.length)+'</td><td>'+ percentFormat(item.U, item.U+item.D)+'</td><td>'+ percentFormat(item.D, item.U+item.D)+'</td></tr>';	
}

function RGBA(rgb, a)
{
    return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
}

function randRGB()
{
    return {r:rand(255), g:rand(255), b:rand(255)};
}

function rand(max)
{
    return Math.floor(Math.random() * max);
}