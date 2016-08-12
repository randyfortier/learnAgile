var overallColspan = 10;

$.post('/course_summary', function(report){
	var studStats = report.studStats;
	var lecStats = report.lecStats;
	
	addToTable('StudentTable', studStats, ['Like', 'Difficult', 'Study']);
	addToTable('CourseTable', lecStats, ['Like', 'Difficult', 'Study']);

	addBarChart('student_chart_2', studStats, graph_order_N_color);
	addLineChart('student_chart', studStats, graph_order_N_color);

	addTableColour();
});



function addBarChart(canvas, stats, tag_names)
{
	var data = {};
	data.labels = [];
	data.datasets = [];

	tag_names.forEach(function(tag_name, index){
		data.datasets.push({
			label : tag_name.name,
			borderWidth : 1,
			borderColor : [],
			backgroundColor : [],
			data : []
		});
		var color;
		if(tag_name.color)
			color = tag_name.color;
		else
			color = randRGB();
		for(var cnt = 0; cnt < Object.keys(stats).length; cnt++)
		{
			data.datasets[index].borderColor.push(RGBA(color, 1));
			data.datasets[index].backgroundColor.push(RGBA(color, 0.2));
		}
	});	

	Object.keys(stats).forEach(function(section){//each section
		var secVar = stats[section];

		data.labels.push(section);

		tag_names.forEach(function(tag_name, index){
			var tag = secVar[tag_name.name];
			data.datasets[index].data.push(chartFormat(tag.U, tag.U+tag.D));
		});
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

function addLineChart(canvas, stats, tag_names)
{
	var data = {};
	data.labels = [];
	data.datasets = [];

	tag_names.forEach(function(tag_name, index){
		data.datasets.push({
			label : tag_name.name,
			fill: true,
			lineTension: 0,
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			pointBorderWidth: 1,
			pointHoverRadius: 5,
			pointHoverBorderWidth: 2,
			pointRadius: 0,
			borderWidth : 1,
			borderColor : [],
			backgroundColor : [],
			data : []
		});
		
		var color;
		if(tag_name.color)
			color = tag_name.color;
		else
			color = randRGB();
		for(var cnt = 0; cnt < Object.keys(stats).length; cnt++)
		{
			data.datasets[index].borderColor.push(RGBA(color, 1));
			data.datasets[index].backgroundColor.push(RGBA(color, 0.2));
		}
	});			
	
	Object.keys(stats).forEach(function(section){//each section
		var secVar = stats[section];

		data.labels.push(section);

		tag_names.forEach(function(tag_name, index){
			var tag = secVar[tag_name.name];
			data.datasets[index].data.push(chartFormat(tag.U, tag.U+tag.D));
		});
	});

	var myBarChart = new Chart($('#' + canvas), {
		type: 'line',
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

function addToTable(tableid, stats, tag_order)
{
	addTitletoTable(tableid, tag_order);	

	var avg_tags = [];
	for(var cnt = 0; cnt < tag_order.length; cnt++)
		avg_tags.push({U:0,D:0,UNK:0,length:0, avg:0});
	Object.keys(stats).forEach(function(select){
		var tag_values = [];

		tag_order.forEach(function(tag_name, index){
			tag_values.push(sec_tag_table_entry(stats[select][tag_name]));
			addtoAvg(avg_tags[index], stats[select][tag_name],getPer(stats[select][tag_name]));
		});
		addEntryToTable(tableid, select, tag_values);
	});

	var secLen = Object.keys(stats).length;
	var avg_values = [];
	avg_tags.forEach(function(item){
		avgOut(item, secLen);
		avg_values.push(sec_tag_table_entry(item));
	});

	addEntryToTable(tableid, "AVERAGE", avg_values);
}


