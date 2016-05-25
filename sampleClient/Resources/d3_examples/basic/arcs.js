var canvas = d3.select("body")
               .append("svg")
               .attr("width", 500)
               .attr("height", 500);

var group = canvas.append("g")
                  .attr("transform", "translate(100,100)");

var inside = 80;
var outside = 100;
var angle = Math.PI * 2 - 1;  // radians
var arc = d3.svg.arc()
            .innerRadius(inside)
            .outerRadius(outside)
            .startAngle(0)
            .endAngle(angle);

group.append("path")
     .attr("d", arc);