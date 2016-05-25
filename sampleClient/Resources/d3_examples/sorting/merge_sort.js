var width = 800,
    height = 500,
    chartWidth = 350,
    barHeight = 20,
    barPadding = 10;
var barChart = 0;
var dataToSort = [30,57,91,49,68,21,71,67,38,73,72,84,66,48,46,12];

//d3.csv('sample_data.csv', function(jsonData) {
d3.json('data.json', function(jsonData) {
    var canvas = d3.select("body")
                   .append("svg")
                   .attr("width", width)
                   .attr("height", height);
    
    var xScale = d3.scale.linear()
                         .domain([0,100])
                         .range([0, chartWidth]);
    
    canvas.selectAll("rect")
          .data(jsonData)
          .enter()
                .append("rect")
                .attr("width", function(data) { return xScale(data.finalMark); })
                .attr("height", 23)
                .attr("y", function(data, index) { return index * (barHeight+barPadding); })
                .attr("fill", "blue");
    
    mergeSort(canvas, 0, 15);
    //mergeSort(canvas, 0, 1);
    
    /*
    canvas.selectAll("text")
          .data(jsonData)
          .enter()
                .append("text")
                .attr("fill", "white")
                .attr("y", function(data, index) { return index * 25 + 15; })
                .text(function(data) { return data.name; });
    */
    barChart = canvas;
});

function mergeSort(canvas, start, end) {
    if (start >= end) {
        return; // sorted
    } else if ((end - start) == 1) {
        // swap 'end' and 'start'
        
        barChart = barChart.selectAll("rect")
                           .transition()
                           .delay(2000)
                           .duration(1000)
                           .attr("y", function(data, index) {
                                if ((index == start) && (dataToSort[start] > dataToSort[end])) {
                                    return end * (barHeight+barPadding);
                                } else if ((index == end) && (dataToSort[start] > dataToSort[end])) {
                                    var temp = dataToSort[start];
                                    dataToSort[start] = dataToSort[end];
                                    dataToSort[end] = temp;

                                    return start * (barHeight+barPadding);
                                } else {
                                    return index * (barHeight+barPadding);
                                }
                           });
        return;
    }
    var mid = Math.round((start + end) / 2);
    barChart = barChart.selectAll("rect")
                       .transition()
                       .delay(2000)
                       .duration(1000)
                       .attr("fill", function(data, index) { return index < mid ? 'red': 'green'});
    /*
          .transition()
          .delay(2000)
          .attr("x", function(data, index) {});
    */
    console.log("mergeSort(canvas, "+start+", "+(mid-1)+")");
    mergeSort(canvas, start, mid-1);
    console.log("mergeSort(canvas, "+mid+", "+end+")");
    mergeSort(canvas, mid, end);
}
