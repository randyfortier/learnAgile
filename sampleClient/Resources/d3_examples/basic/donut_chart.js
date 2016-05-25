var data = [10, 50, 80];
var radius = 250;

var colour = d3.scale.ordinal()
                     .range(["red", "blue", "orange"]);

var canvas = d3.select("body")
               .append("svg")
               .attr("width", 1000)
               .attr("height", 1000);

var group = canvas.append("g")
                  .attr("transform", "translate(300,300)");



var arc = d3.svg.arc()
            .innerRadius(radius - 100)
            .outerRadius(radius);

var pie = d3.layout.pie()
                   .value(function(data) { return data; });

var arcs = group.selectAll(".arc")
                .data(pie(data))
                .enter()
                    .append("g")
                    .attr("class", "arc");

arcs.append("path")
    .attr("d", arc)
    .attr("fill", function(data) { return colour(data.data); });

arcs.append("text")
    .attr("transform", function(data) { return "translate(" + arc.centroid(data) + ")"; })
    .attr("text-anchor", "middle")
    .attr("font-size", "1.5em")
    .text(function(data) { return data.data; });