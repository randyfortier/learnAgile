var width = 500,
    height = 500,
    padding = 50;

var canvas = d3.select("body")
               .append("svg")
               .attr("width", width)
               .attr("height", height + padding)
               .append("g")
                    .attr("transform", "translate(20, 0)");

d3.csv("histogram_data.csv", function(data) {
    var map = data.map(function(element) { return parseInt(element.age); });
    var histogram = d3.layout.histogram()
                       .bins(7);
    histogram = histogram(map);
    
    var yScale = d3.scale.linear()
                         .domain([0,d3.max(histogram.map(function(arr) { return arr.length; }))])
                         .range([0, height]);
    
    var xScale = d3.scale.linear()
                         .domain([0, d3.max(map)])
                         .range([0, width]);
    
    var xAxis = d3.svg.axis()
                      .scale(xScale)
                      .orient("bottom");
    
    var group = canvas.append("g")
                      .attr("transform", "translate(0, " + height + ")")
                      .call(xAxis);
    
    console.log(histogram);
    var bars = canvas.selectAll(".bar")
                     .data(histogram)
                     .enter()
                        .append("g");
    
    bars.append("rect")
        .attr("x", function(data) { return xScale(data.x); })
        .attr("y", function(data) { return height - yScale(data.y); })
        .attr("width", function(data) { return xScale(data.dx); })
        .attr("height", function(data) { return yScale(data.y); })
        .attr("fill", "steelblue");
    
    bars.append("text")
        .attr("x", function(data) { return xScale(data.x); })
        .attr("y", function(data) { return height - yScale(data.y); })
        .attr("fill", "#fff")
        .attr("text-anchor", "middle")
        .attr("dy", "20px")
        .attr("dx", function(data) { return xScale(data.dx/2); })
        .text(function(data) { return data.y; });
});