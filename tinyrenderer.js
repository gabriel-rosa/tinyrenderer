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
	
	for (var x = 0; x <= width; ++x) {
		var t = x / width;
		var y = Math.floor( p1.y*(1.0-t) + p2.y*t );		
		if (steep)
			put_pixel(new Vector2(y, p1.x+x), color); // de-transpose
		else
			put_pixel(new Vector2(p1.x+x, y), color);
	}
}

function dot(v1, v2) {
	var out = 0;
	
	for (var i = 0; i < v1.length; ++i)
		out += v1[i]*v2[i];

	return out;
}

function cross(v1, v2) {
	var s1 = v1.y*v2.z - v1.z*v2.y;
	var s2 = v1.z*v2.x - v1.x*v2.z;
	var s3 = v1.x*v2.y - v1.y*v2.x;

	return new Vector3(s1, s2, s3);
}

function barycentric(vertices, P) {
	var x = new Vector3(vertices[2].x - vertices[0].x, vertices[1].x - vertices[0].x, vertices[0].x - P.x);
	var y = new Vector3(vertices[2].y - vertices[0].y, vertices[1].y - vertices[0].y, vertices[0].y - P.y);

	var u = cross(x, y);

	if (Math.abs(u.z) < 1)
		return undefined;
	else
		return new Vector3(1 - (u.x+u.y)/u.z, u.y/u.z, u.x/u.z);
}

function bbox_triangle(vertices) {
	var minX = Math.max(0, Math.min(vertices[0].x, vertices[1].x, vertices[2].x));
	var minY = Math.max(0, Math.min(vertices[0].y, vertices[1].y, vertices[2].y));
	var maxX = Math.min(canvas.width-1, Math.max(vertices[0].x, vertices[1].x, vertices[2].x));
	var maxY = Math.min(canvas.height-1, Math.max(vertices[0].y, vertices[1].y, vertices[2].y));

	return [new Vector2(minX, minY), new Vector2(maxX, maxY)];
}

function render_triangle(vertices, color) {
	var bbox = bbox_triangle(vertices);

	for (var x = bbox[0].x; x < bbox[1].x; ++x) {
		for (var y = bbox[0].y; y < bbox[1].y; ++y) {
			var P = new Vector2(x, y);
			var bc = barycentric(vertices, P);
			
			if (bc === undefined || bc.x < 0 || bc.y < 0 ||  bc.z < 0) continue;

			put_pixel(P, color);
		}
	}
}

canvas.width = 200;
canvas.height = 200;

clear_canvas('black');
image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);


var t0 = [new Vector2(10, 70),   new Vector2(50, 160),  new Vector2(70, 80)]; 
var t1 = [new Vector2(180, 50),  new Vector2(150, 1),   new Vector2(70, 180)]; 
var t2 = [new Vector2(180, 150), new Vector2(120, 160), new Vector2(130, 180)]; 
render_triangle(t0, new Color(255, 0, 0)); 
render_triangle(t1, new Color(255, 255, 255)); 
render_triangle(t2, new Color(0, 255, 0));
ctx.putImageData(image_data, 0, 0);


/*
var test_model = new Model();
test_model.open("models/african_head.obj", function(data) {
	var white = new Color(255, 255, 255);

	for (var i = 0; i < test_model.faces.length; ++i) {
		var ind1 = test_model.faces[i].vertex_inds.x;
		var ind2 = test_model.faces[i].vertex_inds.y;
		var ind3 = test_model.faces[i].vertex_inds.z;
		
		var v0 = test_model.vertices[ind1].copy();
		var v1 = test_model.vertices[ind2].copy();
		var v2 = test_model.vertices[ind3].copy();
		
		v0.x = Math.round((v0.x+1)*canvas.width/2);
		v1.x = Math.round((v1.x+1)*canvas.width/2);
		v2.x = Math.round((v2.x+1)*canvas.width/2);
		v0.y = Math.round((v0.y+1)*canvas.height/2);
		v1.y = Math.round((v1.y+1)*canvas.height/2);
		v2.y = Math.round((v2.y+1)*canvas.height/2);
		
		render_line(v0, v1, white);
		render_line(v1, v2, white);
		render_line(v2, v0, white);
	}	
	
	ctx.putImageData(image_data, 0, 0);
});
*/

/*var test_image = new TGA();
test_image.open( "images/african_head_diffuse.tga", function(data){
	var imageData = ctx.createImageData(test_image.header.width, test_image.header.height);

	canvas.width = test_image.header.width;
	canvas.height = test_image.header.height;

	ctx.putImageData(test_image.getImageData(imageData), 0, 0);
});*/
