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

d3.json("tree_data.json", function(data) {
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
        .attr("fill", "steelblue")
        .attr("opacity", 0.25)
        .attr("stroke", "#ADADAD")
        .attr("stroke-width", "2");

    node.append("text")
        .text(function(data) { return data.children ? "" : data.name; })
        .attr("transform", function(data) { return "translate(-20,10)"; });
});

