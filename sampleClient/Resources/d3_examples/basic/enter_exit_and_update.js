var dataArray = [10];

var canvas = d3.select("body")
               .append("svg")
               .attr("width", 500)
               .attr("height", 500);

var circle1 = canvas.append("circle")
                   .attr("cx", 50)
                   .attr("cy", 100)
                   .attr("r", 25);
 
var circle2 = canvas.append("circle")
                   .attr("cx", 50)
                   .attr("cy", 150)
                   .attr("r", 25);
 
var circles = canvas.selectAll("circle")
                    .data(dataArray)
                    .attr("fill", "green")  // update (existing)
                                            // there are the same # of data and circles
                    .exit()                 // exit: more circles than data
                        .attr("fill", "blue");

circles.enter()                             // there are more data than circles
       .append("circle")
       .attr("cx", 50)
       .attr("cy", 50)
       .attr("r", 25)
       .attr("fill", "red");
