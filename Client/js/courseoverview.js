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