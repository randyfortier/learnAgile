d3.select("p").text("Hello world!");
d3.select("body").append("p").style('color', 'red').text("Hey there, what's up?");
var canvas = d3.select("body")
               .append("svg")
               .attr("width", 500)
               .attr("height", 500);
var circle = canvas.append("circle")
                   .attr("cx", 250)
                   .attr("cy", 250)
                   .attr("r", 50)
                   .attr("fill", "red");
var rectangle = canvas.append("rect")
                      .attr("width", 100)
                      .attr("height", 50)
                      .attr("x", 50)
                      .attr("y", 100)
                      .attr("fill", "blue");
var line = canvas.append("line")
                 .attr("x1", 0)
                 .attr("y1", 100)
                 .attr("x2", 400)
                 .attr("y2", 400)
                 .attr("stroke", "green")
                 .attr("stroke-width", 10);
                