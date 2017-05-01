var overallColspan = 10;

$.post('course_summary', function(report){
	var studStats = report.studStats;
	var lecStats = report.lecStats;
	
	//added the data form the server to the Student Table and the Course Table
	addToTable('StudentTable', studStats, ['Like', 'Difficult', 'Study']);
	addToTable('CourseTable', lecStats, ['Like', 'Difficult', 'Study']);


	//Create a Line Graph and Bar Graph for the Student data
	addBarChart('student_chart_2', studStats, graph_order_N_color);
	addLineChart('student_chart', studStats, graph_order_N_color);

	//add the Highlightign of good warning and in trouble
	addTableColour();
});