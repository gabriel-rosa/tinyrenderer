var canvas, ctx, image_data, zbuffer_data, texture_data;
canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

var Color = function(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
};

function clear_canvas(color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function init_zbuffer(buffer) {
	for (var x=0; x<canvas.width; ++x) {
		for (var y=0; y<canvas.height; ++y) {
			var index = x + y*canvas.width;
			buffer[index] = -Infinity;
		}
	}
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

function sample_texture(uv_coords, barycentric_coords) {
	var uv = new Vector2(0, 0);
			
	uv.x += uv_coords[0].x*barycentric_coords.x;
	uv.y += uv_coords[0].y*barycentric_coords.x;
	uv.x += uv_coords[1].x*barycentric_coords.y;
	uv.y += uv_coords[1].y*barycentric_coords.y;
	uv.x += uv_coords[2].x*barycentric_coords.z;
	uv.y += uv_coords[2].y*barycentric_coords.z;
	
	uv.x *= texture_data.width;
	uv.y *= texture_data.height;
	
	uv.x = Math.floor(uv.x);
	uv.y = Math.floor(uv.y);
	
	if (!(uv.x > 0 && uv.y > 0 && uv.x < texture_data.width && uv.y < texture_data.height))
		return new Color(0, 0, 0);
		
	var index = 4*(uv.x + (texture_data.height-uv.y)*texture_data.width);
	var r = texture_data.data[index+0];
	var g = texture_data.data[index+1];
	var b = texture_data.data[index+2];
	
	return new Color(r, g, b);
}

function render_triangle(vertices, uv_coords, color) {
	var bbox = bbox_triangle(vertices);

	for (var x = bbox[0].x; x < bbox[1].x; ++x) {
		for (var y = bbox[0].y; y < bbox[1].y; ++y) {
			var P = new Vector3(x, y, 0);
			var bc = barycentric(vertices, P);
			
			if (bc === undefined || bc.x < 0 || bc.y < 0 ||  bc.z < 0) continue;
			
			P.z = 0;
			P.z += vertices[0].z*bc.x;
			P.z += vertices[1].z*bc.y;
			P.z += vertices[2].z*bc.z;
			
			var texture_color = sample_texture(uv_coords, bc);
			
			var lit_color = new Color(texture_color.r*color.r/255,
						  texture_color.g*color.g/255,
						  texture_color.b*color.b/255);
			
			var index = Math.floor( P.x + P.y*canvas.width );
			if (zbuffer_data[index] < P.z) {
				zbuffer_data[index] = P.z;				
				put_pixel(P, lit_color);
			}
		}
	}
}

function render_solid_triangle(vertices, color) {
	var bbox = bbox_triangle(vertices);

	console.log(vertices);

	for (var x = bbox[0].x; x < bbox[1].x; ++x) {
		for (var y = bbox[0].y; y < bbox[1].y; ++y) {
			var P = new Vector3(x, y, 0);
			var bc = barycentric(vertices, P);
			
			if (bc === undefined || bc.x < 0 || bc.y < 0 ||  bc.z < 0) continue;
									
			put_pixel(P, color);
		}
	}
}

function world_to_screen(camera, viewport, vertices) {
	var out_vertices = new Array(3);

	var transform = new Mat4x4([1,0,0,0], [0,1,0,0], [0,0,1,0], [0,0,-1/camera.c,1]);
	var vp = new Mat4x4;
	vp.data[3] = viewport.x+viewport.w/2;
	vp.data[7] = viewport.y+viewport.h/2;
	vp.data[11] = viewport.d/2;
	vp.data[0] = viewport.w/2;
	vp.data[5] = viewport.h/2;
	vp.data[10] = viewport.d/2;

	var aug_vertices = new Array(3);
	for (var i=0; i<3; ++i) {
		aug_vertices[i] = new Vector4(vertices[i].x, vertices[i].y, vertices[i].z, 1);
		aug_vertices[i] = mat4vec(transform, aug_vertices[i]);
		aug_vertices[i] = mat4vec(vp, aug_vertices[i]);

		out_vertices[i] = new Vector3(aug_vertices[i].x / aug_vertices[i].w, aug_vertices[i].y / aug_vertices[i].w, aug_vertices[i].z / aug_vertices[i].w);
	}

	return out_vertices;
}

canvas.width = 800;
canvas.height = 800;

clear_canvas('black');
image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
zbuffer_data = new Array(canvas.width * canvas.height);
init_zbuffer(zbuffer_data);

var camera = {
	c: 2
};

var viewport = {
	x: 0,
	y: 0,
	w: canvas.width,
	h: canvas.height,
	d: 2
};


var red = new Color(255, 0, 0);
/*
var world_coords = [new Vector3(0,0,0), new Vector3(0.5,0,-1), new Vector3(0,0.5,-0.5)];

//var screen_coords = world_to_screen(camera, viewport, world_coords);
var screen_coords = [new Vector3(328,315,1.51), new Vector3(364,292,1.45), new Vector3(338,343,1.43)];

render_solid_triangle(screen_coords, red);

ctx.putImageData(image_data, 0, 0);
*/


var texture_image = new TGA();
var test_model = new Model();


texture_image.open( "images/african_head_diffuse.tga", function(data){
	texture_data = texture_image.getImageData();
	
	//canvas.width = texture_data.width;
	//canvas.height = texture_data.height;
	//ctx.putImageData(texture_data, 0, 0);
	
	test_model.open("models/african_head.obj", mesh_onload);
});

function mesh_onload(data) {
	var light_dir = new Vector3(0, 0, 1);

	for (var i = 0; i < test_model.faces.length; ++i) {					
		var ind1 = test_model.faces[i].vertex_inds.x;
		var ind2 = test_model.faces[i].vertex_inds.y;
		var ind3 = test_model.faces[i].vertex_inds.z;

		var world_coords = [test_model.vertices[ind1].copy(), 
				    test_model.vertices[ind2].copy(),
				    test_model.vertices[ind3].copy()];
		
		ind1 = test_model.faces[i].texture_inds.x;
		ind2 = test_model.faces[i].texture_inds.y;
		ind3 = test_model.faces[i].texture_inds.z;

		var uv_coords = [test_model.vertices_texture[ind1].copy(),
				 test_model.vertices_texture[ind2].copy(),
				 test_model.vertices_texture[ind3].copy()];

		var v1 = new Vector3(world_coords[2].x-world_coords[0].x, 
				     world_coords[2].y-world_coords[0].y,
				     world_coords[2].z-world_coords[0].z);
		var v2 = new Vector3(world_coords[2].x-world_coords[1].x, 
				     world_coords[2].y-world_coords[1].y,
				     world_coords[2].z-world_coords[1].z);
		var n = cross(v1, v2);
		n.normalize();

		var light_intensity = n.x*light_dir.x + n.y*light_dir.y + n.z*light_dir.z;

		if (light_intensity > 0) {
			var color = new Color(Math.floor(light_intensity*256), 
					      Math.floor(light_intensity*256), 
					      Math.floor(light_intensity*256));
			var screen_coords = world_to_screen(camera, viewport, world_coords);
			render_solid_triangle(screen_coords, red);
			//render_triangle(screen_coords, uv_coords, color);
		}
	}	

	ctx.putImageData(image_data, 0, 0);
}