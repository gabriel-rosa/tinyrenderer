var canvas, ctx, image_data;
canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

var Vector2 = function(x, y) {
	this.x = x;
	this.y = y;
};

var Color = function(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
};

function clear_canvas(color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function put_pixel(p, color) {
	if (p.x > 0 && p.y > 0 && p.x < canvas.width && p.y < canvas.height) {	
		var index = 4*(p.x + (canvas.height - p.y)*canvas.width);
		image_data.data[index + 0] = color.r;
		image_data.data[index + 1] = color.g;
		image_data.data[index + 2] = color.b;
		//ctx.fillStyle = color;
		//ctx.fillRect(p.x, canvas.height - p.y, 1, 1);
	}
}

// Bresenham's line algorithm
function render_line(p1_, p2_, color) {	
	var p1 = new Vector2(p1_.x, p1_.y);
	var p2 = new Vector2(p2_.x, p2_.y);
	
	var width = Math.abs(p2.x - p1.x);
	var height = Math.abs(p2.y - p1.y);
	
	var steep = false;
	if (height > width) {
		// transpose
		var t1 = new Vector2(p1.x, p2.x);
		p1.x = p1.y;
		p1.y = t1.x;
		p2.x = p2.y;
		p2.y = t1.y;				
		steep = true;
		width = height;
	}

	if (p1.x > p2.x) {
		var t2 = p1;
		p1 = p2;
		p2 = t2;
	}
	
	for (var x = 0; x < width; ++x) {
		var t = x / width;
		var y = Math.round( p1.y*(1.0-t) + p2.y*t );
		
		if (steep)
			put_pixel(new Vector2(y, p1.x+x), color); // de-transpose
		else
			put_pixel(new Vector2(p1.x+x, y), color);
	}
}

function render_triangle(v0, v1, v2, color) {
	ctx.beginPath();
	ctx.moveTo(v0.x, v0.y);
	ctx.lineTo(v1.x, v1.y);
	ctx.lineTo(v2.x, v2.y);
	ctx.strokeStyle = color;
	ctx.stroke();
}

canvas.width = 800;
canvas.height = 800;

clear_canvas('black');
image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

/*
render_line(new Vector2(13, 20), new Vector2(80, 40), new Color(255, 255, 255)); 
render_line(new Vector2(20, 13), new Vector2(40, 80), new Color(255, 0, 0)); 
render_line(new Vector2(80, 40), new Vector2(13, 20), new Color(255, 0, 0)); 
ctx.putImageData(image_data, 0, 0);
*/

var test_model = new Model();
test_model.open("models/african_head.obj", function(data) {
	return;
	
	var color = new Color(255, 255, 255);

	for (var i = 0; i < 20; ++i) {
		var ind1 = test_model.faces[i].vertex_inds.x;
		var ind2 = test_model.faces[i].vertex_inds.y;
		var ind3 = test_model.faces[i].vertex_inds.z;
		
		console.log(i, ind1, ind2, ind3);
		
		var v0 = test_model.vertices[ind1].copy();
		var v1 = test_model.vertices[ind2].copy();
		var v2 = test_model.vertices[ind3].copy();
		v0.x = Math.round((v0.x+1)*canvas.width/2);
		v1.x = Math.round((v1.x+1)*canvas.width/2);
		v2.x = Math.round((v2.x+1)*canvas.width/2);
		v0.y = Math.round((v0.y+1)*canvas.height/2);
		v1.y = Math.round((v1.y+1)*canvas.height/2);
		v2.y = Math.round((v2.y+1)*canvas.height/2);
		console.log(v0, v1, v2);
		//render_triangle(v0, v1, v2, 'white');
		render_line(v0, v1, color);
		render_line(v1, v2, color);
		render_line(v2, v0, color);
	}	
	
	ctx.putImageData(image_data, 0, 0);
});

function render_face(i) {
	var color = new Color(255, 255, 255);
	
	var ind1 = test_model.faces[i].vertex_inds.x;
	var ind2 = test_model.faces[i].vertex_inds.y;
	var ind3 = test_model.faces[i].vertex_inds.z;

	console.log(i, ind1, ind2, ind3);

	var v0 = test_model.vertices[ind1].copy();
	var v1 = test_model.vertices[ind2].copy();
	var v2 = test_model.vertices[ind3].copy();
	v0.x = Math.round((v0.x+1)*canvas.width/2);
	v1.x = Math.round((v1.x+1)*canvas.width/2);
	v2.x = Math.round((v2.x+1)*canvas.width/2);
	v0.y = Math.round((v0.y+1)*canvas.height/2);
	v1.y = Math.round((v1.y+1)*canvas.height/2);
	v2.y = Math.round((v2.y+1)*canvas.height/2);
	console.log(v0, v1, v2);
	render_line(v0, v1, color);
	render_line(v1, v2, color);
	render_line(v2, v0, color);	
	ctx.putImageData(image_data, 0, 0);
}

/*var test_image = new TGA();
test_image.open( "images/african_head_diffuse.tga", function(data){
	var imageData = ctx.createImageData(test_image.header.width, test_image.header.height);

	canvas.width = test_image.header.width;
	canvas.height = test_image.header.height;

	ctx.putImageData(test_image.getImageData(imageData), 0, 0);
});*/
