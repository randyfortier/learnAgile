var graph_order_N_color = [{name:'Difficult', color: {r:255, g:0, b:0}}, {name:'Like', color: {r:0, g:0, b:0}}, {name:'Study', color: {r:0, g:0, b:255}}];

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

function addAvgLineChart(canvas, stats, tag_names)
{
	var data = {};
	data.labels = [];
	data.datasets = [];

	tag_names.forEach(function(tag_name, index){
		data.datasets.push({
			label : tag_name.name,
			fill: false,
			lineTension: 0,
			borderCapStyle: 'butt',
			borderDash: [10, 5],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			pointBorderWidth: 1,
			pointHoverRadius: 5,
			pointHoverBorderWidth: 2,
			pointRadius: 0,
			borderWidth : 1,
			borderColor : [],
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

function addEntryToTable(tableid, name, tags)
{
	var table_Entry = "";
	table_Entry += "<tr><td>" + name + "</td>";
	tags.forEach(function(item){
		table_Entry += item;
	});
	table_Entry += "</tr>";
	$('#'+tableid).append(table_Entry);
}

function addTitletoTable(tableid, tag_order)
{
	var lineone = '<tr><th rowspan="2">Topic</th>';
	var linetwo = "<tr>";

	tag_order.forEach(function(item){
		lineone += "<th colspan = '3'>"+item+"</th>";
		linetwo += "<th># responses</th><th># "+ item +"</th><th>% "+ item +"</th>";
	});

	$('#' + tableid).append(lineone + "</tr>");
	$('#' + tableid).append(linetwo + "</tr>");
}

function sec_tag_table_entry(item)		
{
	if(item.avg)
		return "<td>"+(item.U+item.D)+"</td><td>"+item.U+"</td><td>"+item.avg.toFixed(2)+"%</td>";

	var len = item.U+item.D;
	return "<td>"+len+"</td><td>"+item.U+"</td><td>"+percentFormat(item.U, len)+"</td>"
}

function addtoAvg(avg, item, per)
{
	avg.U += item.U;
	avg.D += item.D;
	avg.UNK += item.UNK;
	avg.length += item.length;
	avg.avg += per;
}

function avgOut(avg,cnt)
{
	avg.U /= cnt;
	avg.D /= cnt;
	avg.UNK /= cnt;
	avg.length /= cnt;	
	avg.avg /= cnt;
}

function addTableColour()
{
	$('td').each(function(){
		var text = $(this).text();

		if(text.includes('%'))
		{
			text = text.substr(0, text.length -1);
			var percent = Number(text);

			if(percent >= 80)
				$(this).addClass('success');
			else if(percent >= 50 && percent < 59)
				$(this).addClass('warning');
			else if(percent < 50)
				$(this).addClass('danger');
		}
	});
}

function getPer(item)
{
	return chartFormat(item.U,item.U+item.D)
}

function chartFormat(score, length)
{
	return ((length === 0) ? 0 :(score/length) * 100);
}

function percentFormat(score, length)
{
	return ((length === 0) ? '0.00' :((score/length) * 100).toFixed(2)) + "%";
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