var canvas = d3.select("body")
               .append("svg")
               .attr("width", 500)
               .attr("height", 500)
               .append("g")
                    .attr("transform", "translate(50, 50)");

//var tree = d3.layout.cluster()            // all leaves grouped at same position
//                    .size([400, 400]);

var tree = d3.layout.tree()                 // same level, same position
                    .size([400, 400]);


d3.json("tree_data.json", function(data) {
    var nodes = tree.nodes(data);
    var links = tree.links(nodes);
    console.log(links);
    var node = canvas.selectAll(".node")
                     .data(nodes)
                     .enter()
                        .append("g")
                        .attr("class", "node")
                        .attr("transform", function(data) { 
                            return "translate(" + data.y + "," + data.x + ")"; 
                        });
    
    node.append("circle")
        .attr("r", 5)
        .attr("fill", "steelblue");
    
    node.append("text")
        .attr("transform", "translate(-20, -10)")
        .text(function(data) { return data.name; });
    
    var diagonal = d3.svg.diagonal()
                         .projection(function(data) { return [data.y, data.x]; });
    
    canvas.selectAll(".link")
          .data(links)
          .enter()
                .append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#ADADAD")
                .attr("d", diagonal);
});
