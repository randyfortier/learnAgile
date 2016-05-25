var width = 800,
    height = 600;

var canvas = d3.select("body")
               .append("svg")
               .attr("width", width)
               .attr("height", height)
               .append("g")
                    .attr("transform", "translate(50, 50)");

var pack = d3.layout.pack()
                    .size([width, height - 50])
                    .padding(10);

var colourScale = d3.scale.linear()
                          .domain([15, 85])
                          .range(["red", "blue"]);

d3.json("bubble_data.json", function(data) {
    var nodes = pack.nodes(data);
    var node = canvas.selectAll(".node")
                     .data(nodes)
                     .enter()
                        .append("g")
                        .attr("class", "node")
                        .attr("transform", function(data) { 
                            return "translate(" + data.x + "," + data.y + ")"; 
                        });

    node.append("circle")
        .attr("r", function(data) { return data.r; })
        .attr("fill", function(data) { return data.children ? "#fff" : colourScale(data.value); })
        .attr("opacity", 0.75)
        .attr("stroke", function(data) { return data.children ? "#fff" : "#000"; });

    node.append("text")
        .text(function(data) { return data.children ? "" : data.name; })
        .attr("transform", "translate(-15, 5)");
});

