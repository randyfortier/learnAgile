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
var shape = new Shape(30, 50);
shape.translate(10, -10);
console.log("shape: " + shape);
