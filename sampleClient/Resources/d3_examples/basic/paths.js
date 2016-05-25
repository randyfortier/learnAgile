var canvas = d3.select("body")
               .append("svg")
               .attr("width", 500)
               .attr("height", 500);

var data = [
    {x: 10, y: 60},
    {x: 30, y: 20},
    {x: 50, y: 70}
];

var group = canvas.append("g")
                  .attr("transform", "translate(100,100)");

var line = d3.svg.line()
                 .x(function(data) { return data.x * 7; })
                 .y(function(data) { return data.y * 5; });
    
group.selectAll("path")
     .data([data])    // we only want one path
     .enter()
            .append("path")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 10);
     