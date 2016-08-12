var graph_order_N_color = [{name:'Difficult', color: {r:255, g:0, b:0}}, {name:'Like', color: {r:0, g:0, b:0}}, {name:'Study', color: {r:0, g:0, b:255}}];


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