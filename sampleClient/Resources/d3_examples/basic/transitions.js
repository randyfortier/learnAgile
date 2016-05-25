var canvas = d3.select("body")
               .append("svg")
               .attr("width", 500)
               .attr("height", 500);

var circle = canvas.append("circle")
                   .attr("cx", 50)
                   .attr("cy", 100)
                   .attr("r", 25);

circle.transition()
      .duration(1500)
      .delay(500)
      .attr("cx", 150)
      .attr("fill", "green")
      .transition()
      .attr("cy", 200)
      .attr("fill", "blue")
      .each("start", function() { d3.select(this).attr("fill", "orange"); })
      .each("end", function() { d3.select(this).attr("fill", "red"); });