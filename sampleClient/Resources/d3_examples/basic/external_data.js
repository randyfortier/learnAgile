//d3.csv('sample_data.csv', function(jsonData) {
d3.json('sample_data.json', function(jsonData) {
    var canvas = d3.select("body")
                   .append("svg")
                   .attr("width", 500)
                   .attr("height", 500);
    
    canvas.selectAll("rect")
          .data(jsonData)
          .enter()
                .append("rect")
                .attr("width", function(data) { return data.age * 10; })
                .attr("height", 23)
                .attr("y", function(data, index) { return index * 25; })
                .attr("fill", "blue")
    canvas.selectAll("text")
          .data(jsonData)
          .enter()
                .append("text")
                .attr("fill", "white")
                .attr("y", function(data, index) { return index * 25 + 15; })
                .text(function(data) { return data.name; });
});


