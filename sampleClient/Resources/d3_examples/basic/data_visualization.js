var width = 500;
var height = 500;

var dataArray = [120, 40, 350, 405, 210, 600, 425, 290, 155];

var widthScale = d3.scale.linear()
                         .domain([0, 600])
                         .range([0, width - 100]);

var heightScale = d3.scale.linear()
                          .domain([0, dataArray.length])
                          .range([0, height - 100]);

var colourScale = d3.scale.linear()
                          .domain([0, 600])
                          .range(["red", "blue"]);

var axis = d3.svg.axis()
                 .ticks(5)
                 .scale(widthScale);

var canvas = d3.select("body")
               .append("svg")
               .attr("width", width)
               .attr("height", height)
               .append("g")
               .attr("transform", "translate(20, 0)");

// enter:  fewer DOM elements than data values (called for each data value remaining)
// exit:   fewer data values than DOM elements (called for each DOM element remaining)
// update: same number of DOM elements and data values (called to bind new values)
var bars = canvas.selectAll("rect")
                 .data(dataArray)
                 .enter()              // fewer DOM elements than data
                    .append("rect")
                    .attr("width", function(data) { return widthScale(data); })
                    .attr("height", function(data, index) { return heightScale(.5); })
                    .attr("fill", function(data) { return colourScale(data); })
                    .attr("y", function(data, index) { return heightScale(index); });

canvas.append("g")
      .attr("transform", "translate(0, 400)")
      .call(axis);
    