var width = 500,
    height = 500,
    padding = 50;

var canvas = d3.select("body")
               .append("svg")
               .attr("width", width)
               .attr("height", height + padding);

var colourScale = d3.scale.category10();

d3.json("tree_data.json", function(data) {
    var treemap = d3.layout.treemap()
                           .size([width, height])
                           .nodes(data);
    var cells = canvas.selectAll(".cell")
                      .data(treemap)
                      .enter()
                            .append("g")
                            .attr("class", "cell");
    
    cells.append("rect")
         .attr("x", function(data) { return data.x; })
         .attr("y", function(data) { return data.y; })
         .attr("width", function(data) { return data.dx; })
         .attr("height", function(data) { return data.dy; })
         .attr("stroke", "#fff")
         .attr("fill", function(data) { 
            return data.children ? null : colourScale(data.parent.name); 
         });
    
    cells.append("text")
         .attr("x", function(data) { return data.x + data.dx / 2; })
         .attr("y", function(data) { return data.y + data.dy / 2; })
         .attr("text-anchor", "middle")
         .text(function(data) { return data.children ? null : data.name; });
});