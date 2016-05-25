var Shape = function(x, y) {
	this.x = x;
	this.y = y;
	
	this.translate = function(dx, dy) {
		this.x += dx;
		this.y += dy;
	};
	
	this.toString = function() {
		return "[Shape " + this.x + ", " + this.y + "]";
	};
};

var Circle = function(x, y, radius) {
	Shape.call(this, x, y);
	this.radius = radius;
	
	this.getArea = function() {
		return Math.PI * this.radius * this.radius;
	};
};

var shape = new Shape(30, 50);
console.log("shape: " + shape);

var circle = new Circle(0, 0, 1.0);
console.log("area: " + circle.getArea());
console.log("circle: " + circle);
