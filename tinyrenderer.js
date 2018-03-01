var canvas, ctx;
canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

var Vector2 = function(x, y) {
	this.x = x;
	this.y = y;
};

function clear_canvas(color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render_pixel(p, color) {
	ctx.fillStyle = color;
	ctx.fillRect(p.x, canvas.height - p.y, 1, 1);
}

// Bresenham's line algorithm
function render_line(p1, p2, color) {
	var width = Math.abs(p2.x - p1.x);
	var height = Math.abs(p2.y - p1.y);
	
	var steep = false;
	if (height > width) {
		// transpose
		var tmp = new Vector2(p1.x, p2.x);
		p1.x = p1.y;
		p1.y = tmp.x;
		p2.x = p2.y;
		p2.y = tmp.y;				
		steep = true;
		width = height;
	}

	if (p1.x > p2.x) {
		var tmp = p1;
		p1 = p2;
		p2 = tmp;
	}
	
	for (var x = 0; x < width; ++x) {
		var t = x / width;
		var y = Math.round( p1.y*(1.0-t) + p2.y*t );
		
		if (steep)
			render_pixel(new Vector2(y, p1.x+x), color); // de-transpose
		else
			render_pixel(new Vector2(p1.x+x, y), color);
	}
}

canvas.width = 100;
canvas.height = 100;

clear_canvas('black');

render_line(new Vector2(13, 20), new Vector2(80, 40), 'white'); 
render_line(new Vector2(20, 13), new Vector2(40, 80), 'red'); 
render_line(new Vector2(80, 40), new Vector2(13, 20), 'red'); 

var test_model = new Model();
test_model.open("models/african_head.obj", function(data) {
	console.log("Model loaded!");
});

/*var test_image = new TGA();
test_image.open( "images/african_head_diffuse.tga", function(data){
	var imageData = ctx.createImageData(test_image.header.width, test_image.header.height);

	canvas.width = test_image.header.width;
	canvas.height = test_image.header.height;

	ctx.putImageData(test_image.getImageData(imageData), 0, 0);
});*/
