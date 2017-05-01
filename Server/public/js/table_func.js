
//Colour of each respective YNRQ 
var graph_order_N_color = [
	{name:'Difficult', color: {r:255, g:0, b:0}},
	{name:'Like', color: {r:0, g:0, b:0}},
	{name:'Study', color: {r:0, g:0, b:255}}
];



/****************************************
		Chart Functionality
*****************************************/

//Add a bar graph to the given canvus
function addBarChart(canvas, stats, YNRQ_names)
{
	//setup up the data for the 
	var data = {};
	data.labels = [];
	data.datasets = [];

	//for each YNRQ name sent, setop the colour data and the default data
	YNRQ_names.forEach(function(YNRQ_name, index){
		data.datasets.push({
			label : YNRQ_name.name,
			borderWidth : 1,
			borderColor : [],
			backgroundColor : [],
			data : []
		});

		//of colour exists then use it, else chose a random one
		var color;
		if(YNRQ_name.color)
			color = YNRQ_name.color;
		else
			color = randRGB();
		for(var cnt = 0; cnt < Object.keys(stats).length; cnt++)
		{
			data.datasets[index].borderColor.push(RGBA(color, 1));
			data.datasets[index].backgroundColor.push(RGBA(color, 0.2));
		}

	});	

	//for each data point in each setion set the data
	Object.keys(stats).forEach(function(section){//each section
		var secVar = stats[section];
		data.labels.push(section);

		//for each tag, calc. the value and set it
		YNRQ_names.forEach(function(YNRQ_name, index){
			var tag = secVar[YNRQ_name.name];
			data.datasets[index].data.push(chartFormat(tag.U, tag.U+tag.D));
		});
	});
	
	//apply the bar chart to the canvus
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

//add a Line graph to the given canvus
function addLineChart(canvas, stats, YNRQ_names)
{
	//setup data, labels, and dataset
	var data = {};
	data.labels = [];
	data.datasets = [];

	//for each YNRQ sent, setup the default value and the colour
	YNRQ_names.forEach(function(YNRQ_name, index){
		//default value, for changes check out : http://www.chartjs.org/docs/#line-chart
		data.datasets.push({
			label : YNRQ_name.name,
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
		
		//if a colour is given use it, else create a random one.
		var color;
		if(YNRQ_name.color)
			color = YNRQ_name.color;
		else
			color = randRGB();
		for(var cnt = 0; cnt < Object.keys(stats).length; cnt++)
		{
			data.datasets[index].borderColor.push(RGBA(color, 1));
			data.datasets[index].backgroundColor.push(RGBA(color, 0.2));
		}
	});			
	
	//foe each setion of data setup the YNRQ for that setion
	Object.keys(stats).forEach(function(section){//each section
		var secVar = stats[section];

		data.labels.push(section);

		//for each YNRQ calc. a value and set it in the dataset
		YNRQ_names.forEach(function(YNRQ_name, index){
			var tag = secVar[YNRQ_name.name];
			data.datasets[index].data.push(chartFormat(tag.U, tag.U+tag.D));
		});
	});

	//apply a line graph to the canvaus give
	var myLinChart = new Chart($('#' + canvas), {
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

//add a average Line graph to the given canvus
function addAvgLineChart(canvas, stats, YNRQ_names)
{
	//setup data, labels, and dataset
	var data = {};
	data.labels = [];
	data.datasets = [];

	//for each YNRQ sent, setup the default value and the colour
	YNRQ_names.forEach(function(YNRQ_name, index){
		data.datasets.push({
			label : YNRQ_name.name,
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
		
		//if a colour is given use it, else create a random one.
		var color;
		if(YNRQ_name.color)
			color = YNRQ_name.color;
		else
			color = randRGB();
		for(var cnt = 0; cnt < Object.keys(stats).length; cnt++)
		{
			data.datasets[index].borderColor.push(RGBA(color, 1));
		}
	});			
	
	//foe each setion of data setup the YNRQ for that setion
	Object.keys(stats).forEach(function(section){//each section
		var secVar = stats[section];

		data.labels.push(section);

		//for each YNRQ calc. a value and set it in the dataset
		YNRQ_names.forEach(function(YNRQ_name, index){
			var tag = secVar[YNRQ_name.name];
			data.datasets[index].data.push(chartFormat(tag.U, tag.U+tag.D));
		});
	});

	//apply a line graph to the canvaus give
	var myLinChart = new Chart($('#' + canvas), {
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



/****************************************
		Table Functionality
*****************************************/

//main function, added the data for the server to the wanted table
function addToTable(tableid, stats, YNRW_order)
{
	//add the titles of the YNRQ to the table
	addTitletoTable(tableid, YNRW_order);	


	//average out the values of each row
	var avg_tags = [];

	//create an empty row for each YNRQ
	for(var cnt = 0; cnt < YNRW_order.length; cnt++)
		avg_tags.push({U:0,D:0,UNK:0,length:0, avg:0});
	
	//for each Data Entry
	Object.keys(stats).forEach(function(select){
		//save the YNRQ values
		var YNRW_values = [];
		//for each YNRQ, add the table entrys to the YNRQ_values and add to the average
		YNRW_order.forEach(function(YNRQ_name, index){
			YNRW_values.push(sec_YNRQ_table_entry(stats[select][YNRQ_name]));
			addtoAvg(avg_tags[index], stats[select][YNRQ_name],getPer(stats[select][YNRQ_name]));
		});
		//add the YNRQS values to the table
		addEntryToTable(tableid, select, YNRW_values);
	});

	//calcuatle the average values and output it
	var secLen = Object.keys(stats).length;
	var avg_values = [];

	//average each tag
	avg_tags.forEach(function(item){
		avgOut(item, secLen);
		avg_values.push(sec_YNRQ_table_entry(item));
	});

	//add average to table
	addEntryToTable(tableid, "AVERAGE", avg_values);
}

//give the table entrys for each YNRQ, add the name then the precreate vaules
function addEntryToTable(tableid, name, tags)
{
	//add the name to the table temp variable
	var table_Entry = "<tr><td>" + name + "</td>";
	
	//for each YNRQ pre compiled table entry add it to the table temp variable
	tags.forEach(function(item){
		table_Entry += item;
	});
	//end the table row
	table_Entry += "</tr>";
	//add the table row to the table
	$('#'+tableid).append(table_Entry);
}

//add the title of each YNRQ to the table
function addTitletoTable(tableid, YNRW_order)
{
	//add the main topic entry
	var lineone = '<tr><th rowspan="2">Topic</th>';
	var linetwo = "<tr>";

	//for each YNRQ add the title to the first line and the wanted outputs
	YNRW_order.forEach(function(item){
		lineone += "<th colspan = '3'>"+item+"</th>";
		linetwo += "<th># responses</th><th># "+ item +"</th><th>% "+ item +"</th>";
	});

	//append to the table the two lines that where just created
	$('#' + tableid).append(lineone + "</tr>");
	$('#' + tableid).append(linetwo + "</tr>");
}

//Creates the table entry for a given YNRQ
function sec_YNRQ_table_entry(item)	
{
	//setup the values
	var len = item.U+item.D;
	var avg = "";
	var positve = item.U;

	// if average is already computed, the use that vaule, else computer the average
	if(item.avg || item.avg === 0){
		avg = item.avg.toFixed(2) + "%";
		len = len.toFixed(2);
		positve = positve.toFixed(2);
	}
	else{
		avg = percentFormat(item.U, len);
	}

	//return the table entrys for the values
	return "<td>"+len+"</td><td>"+positve+"</td><td>"+avg+"</td>"
}


//add to the average value
function addtoAvg(avg, item, per)
{
	avg.U += item.U;
	avg.D += item.D;
	avg.UNK += item.UNK;
	avg.length += item.length;
	avg.avg += per;
}

//average the data in the avg vaiable with the amount in amount
function avgOut(avg, amount)
{
	avg.U /= amount;
	avg.D /= amount;
	avg.UNK /= amount;
	avg.length /= amount;	
	avg.avg /= amount;
}

//add the classes to the td of each table
function addTableColour()
{
	//for each tablt entry, add the class success, warning or danger based on the precentage
	$('td').each(function(){
		//get the text
		var text = $(this).text();

		//only do thoughs that are a percentage
		if(text.includes('%'))
		{
			//remove the % sign and evaluate the text
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

/****************************************
	  Chart Colour & Number Format
*****************************************/


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

//return the format of chart.js rgba color
function RGBA(rgb, a)
{
	return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')';
}

//randomaly generate a color
function randRGB()
{
	return {r:rand(255), g:rand(255), b:rand(255)};
}

//random function that get the color from 0 to the max
function rand(max)
{
	return Math.floor(Math.random() * max);
}

