function draw(geo_data) {
    "use strict";
    
    var margin = 10,
        width = 1000 - margin,
        height = 800 - margin;
    
    var colourScale = d3.scale.category10();
    var colour = d3.scale.ordinal()
                         .range(["red", "orange", "blue", "green", "yellow", "black", "pink", "cyan", "purple"]);
    
    var svg = d3.select("body")
                .append("svg")
                .attr("width", width + margin)
                .attr("height", height + margin)
                .append("g")
                .attr("class", "map");
    
    var projection = d3.geo.mercator()
                           .scale(80);
    
    var path = d3.geo.path()
                     .projection(projection);
    //debugger;
    var map = svg.selectAll("path")
                 .data(geo_data.features)
                 .enter()
                        .append("path")
                        .attr("d", path)
                        .attr("fill", function(data) { return colour(data.id); });
};

d3.json("world_countries.json", draw);
