  "initialize": "function(container) { 
	var width = container.width,
	    height = container.height;
	var radius = height / 2 - 5,
	    scale = radius,
	    velocity = .02;
	var projection = d3.geo.orthographic()
	    .translate([width / 2, height / 2])
	    .scale(scale)
	    .clipAngle(90);
	var context = container.getContext('2d');
	var path = d3.geo.path()
	    .projection(projection)
	    .context(context);

	d3.json('reveal.js-plugins/anything/d3/world-110m.json', function(error, world) {
	  if (error) throw error;
	  var land = topojson.feature(world, world.objects.land);
	  d3.timer(function(elapsed) {
	    context.clearRect(0, 0, width, height);
	    context.beginPath();
	    context.arc(width / 2, height / 2, radius, 0, 2 * Math.PI, true);
	    context.lineWidth = 2.5;
	    context.fillStyle = '#fff';
	    context.fill();

	    projection.rotate([velocity * elapsed, 0]);
	    context.beginPath();
	    path(land);
	    context.fillStyle = '#42affa';
	    context.fill();
	    context.beginPath();
	    context.arc(width / 2, height / 2, radius, 0, 2 * Math.PI, true);
	    context.lineWidth = 2.5;
	    context.strokeStyle = '#ccc';
	    context.stroke();
	  });
	});
	d3.select(self.frameElement).style('height', height + 'px');

    }"