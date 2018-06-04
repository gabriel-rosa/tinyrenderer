function clear_canvas(color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function init_zbuffer() {
	zbuffer_data = new Array(canvas.width * canvas.height);

	for (var x=0; x<canvas.width; ++x) {
		for (var y=0; y<canvas.height; ++y) {
			var index = x + y*canvas.width;
			zbuffer_data[index] = -Infinity;
		}
	}
}

function clear() {
	clear_canvas('black');
	image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);	
	init_zbuffer();
}

function put_pixel(p, color) {
	var x = Math.round(p.x);
	var y = Math.round(p.y);
	if (x > 0 && y > 0 && x < canvas.width && y < canvas.height) {	
		var index = 4*(x + (canvas.height - y)*canvas.width);
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

function sample_texture(data, uv_coords, barycentric_coords) {
	var uv = new Vector2(0, 0);
			
	uv.x += uv_coords[0].x*barycentric_coords.x;
	uv.y += uv_coords[0].y*barycentric_coords.x;
	uv.x += uv_coords[1].x*barycentric_coords.y;
	uv.y += uv_coords[1].y*barycentric_coords.y;
	uv.x += uv_coords[2].x*barycentric_coords.z;
	uv.y += uv_coords[2].y*barycentric_coords.z;
	
	uv.x *= data.width;
	uv.y *= data.height;
	
	uv.x = Math.floor(uv.x);
	uv.y = Math.floor(uv.y);
	
	if (!(uv.x > 0 && uv.y > 0 && uv.x < data.width && uv.y < data.height))
		return new Color(0, 0, 0);
		
	var index = 4*(uv.x + (data.height-uv.y)*data.width);
	var r = data.data[index+0];
	var g = data.data[index+1];
	var b = data.data[index+2];
	
	return new Color(r, g, b);
}

function sample_texture_coord(data, uv_coords) {
	var uv = new Vector2(0, 0);

	uv.x = Math.floor(uv_coords.x);
	uv.y = Math.floor(uv_coords.y);
	
	if (!(uv.x > 0 && uv.y > 0 && uv.x < data.width && uv.y < data.height))
		return new Color(0, 0, 0);
		
	var index = 4*(uv.x + (data.height-uv.y)*data.width);
	var r = data.data[index+0];
	var g = data.data[index+1];
	var b = data.data[index+2];
	
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
			
			var texture_color = sample_texture(texture_data, uv_coords, bc);

			if (bypass_zbuffer) {
				put_pixel(P, texture_color);
				continue;
			}
			
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

function triangle(screen_coords, shader) {
	var bbox = bbox_triangle(screen_coords);

	for (var x = bbox[0].x; x < bbox[1].x; ++x) {
		for (var y = bbox[0].y; y < bbox[1].y; ++y) {
			var P = new Vector3(x, y, 0);
			var bc = barycentric(screen_coords, P);
			
			if (bc === undefined || bc.x < 0 || bc.y < 0 ||  bc.z < 0) continue;
			
			P.z = 0;
			P.z += screen_coords[0].z*bc.x;
			P.z += screen_coords[1].z*bc.y;
			P.z += screen_coords[2].z*bc.z;
			
			var index = Math.floor( P.x + P.y*canvas.width );
			if (bypass_zbuffer || zbuffer_data[index] < P.z) {			
				if (!bypass_zbuffer) zbuffer_data[index] = P.z;

				var fragment_data = shader.fragment(bc);
				if (!fragment_data.discard)
					put_pixel(P, fragment_data.color);
			}
		}
	}
}

function render_solid_triangle(vertices, color) {
	var bbox = bbox_triangle(vertices);

	for (var x = bbox[0].x; x < bbox[1].x; ++x) {
		for (var y = bbox[0].y; y < bbox[1].y; ++y) {
			var P = new Vector3(x, y, 0);
			var bc = barycentric(vertices, P);

			if (bc === undefined || bc.x < 0 || bc.y < 0 ||  bc.z < 0) continue;								

			put_pixel(P, new Color(255, 0, 0));
		}
	}
}

function render_zbuffer() {
	for (var x=0; x<canvas.width; ++x) {
		for (var y=0; y<canvas.height; ++y) {
			var index = x + y*canvas.width;
			var z = zbuffer_data[index];

			if (z < 0) {
				put_pixel(new Vector2(x, y), new Color(255, 0, 0));
			} else if (z == 0) {
				put_pixel(new Vector2(x, y), new Color(0, 0, 255));
			} else {
				put_pixel(new Vector2(x, y), new Color(z, z, z));
			}
		}
	}
}

function compute_modelview(camera) {
	var z = new Vector3(camera.eye.x-camera.center.x, camera.eye.y-camera.center.y, camera.eye.z-camera.center.z);
	z.normalize();
	var x = cross(camera.up, z);
	x.normalize();
	var y = cross(z, x);
	y.normalize();


	var minv = new Mat4x4;
	var tr = new Mat4x4;

	minv.data[0] = x.x; minv.data[1] = x.y; minv.data[2] = x.z;
	minv.data[4] = y.x; minv.data[5] = y.y; minv.data[6] = y.z;
	minv.data[8] = z.x; minv.data[9] = z.y; minv.data[10] = z.z;
	tr.data[3] = -camera.center.x; tr.data[7] = -camera.center.y; tr.data[11] = -camera.center.z;

	var modelview = minv;
	modelview.mult(tr);

	return modelview;
}

function compute_viewport(vp) {
	var viewport = new Mat4x4;

	viewport.data[3] = vp.x+vp.w/2;
	viewport.data[7] = vp.y+vp.h/2;
	viewport.data[11] = vp.d/2;
	viewport.data[0] = vp.w/2;
	viewport.data[5] = vp.h/2;
	viewport.data[10] = vp.d/2;

	return viewport;
}

function compute_projection(camera) {
	var projection = new Mat4x4;

	var cam_proj = new Vector3(camera.eye.x-camera.center.x, 
							camera.eye.y-camera.center.y, 
							camera.eye.z-camera.center.z);

	var distance = Math.sqrt(cam_proj.x*cam_proj.x + cam_proj.y*cam_proj.y + cam_proj.z*cam_proj.z);

	projection.data[14] = -1/distance;

	return projection;
}