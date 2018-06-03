var canvas, ctx; 
var image_data, zbuffer_data, texture_data, normal_data, specular_data;
var camera, vp;
var light_dir;
var viewport, projection, modelview;
var bypass_zbuffer;
var draw_texture, draw_zbuffer;

/* Initialization */

canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = 800;
canvas.height = 800;

bypass_zbuffer = false;
draw_texture = false;
draw_zbuffer = false;

camera = {
	eye: new Vector3(1, 1, 3),
	center: new Vector3(0, 0, 0),
	up: new Vector3(0, 1, 0)
};

vp = {
	x: canvas.width/8, 
	y: canvas.height/8, 
	w: canvas.width*3/4, 
	h: canvas.height*3/4, 
	d: 255
};

light_dir = new Vector3(1, 1, 1);
light_dir.normalize();

/* Render functions */

var Color = function(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
};

function world_to_screen(modelview, viewport, projection, vertices) {
	var out_vertices = new Array(3);

	var aug_vertices = new Array(3);
	for (var i=0; i<3; ++i) {
		aug_vertices[i] = new Vector4(vertices[i].x, vertices[i].y, vertices[i].z, 1);
		aug_vertices[i] = mat4vec(modelview, aug_vertices[i]);
		aug_vertices[i] = mat4vec(projection, aug_vertices[i]);
		aug_vertices[i] = mat4vec(viewport, aug_vertices[i]);

		out_vertices[i] = new Vector3(aug_vertices[i].x / aug_vertices[i].w, 
									aug_vertices[i].y / aug_vertices[i].w, 
									aug_vertices[i].z / aug_vertices[i].w);

		// without rounding things go haywire
		out_vertices[i].x = Math.round(out_vertices[i].x);
		out_vertices[i].y = Math.round(out_vertices[i].y);
	}

	return out_vertices;
}

var shader = {

	model: undefined,

	varying_normal: new Array(3),
	varying_uv: new Array(3),
	varying_pos: new Array(3),

	init: function(model) {
		this.model = model;
	},

	vertex: function(i_face, n_vert) {
		var gl_Vertex = this.model.get_vert(i_face, n_vert);

		this.varying_normal[n_vert] = this.model.get_normal(i_face, n_vert);
		this.varying_uv[n_vert] = this.model.get_uv(i_face, n_vert);
		this.varying_pos[n_vert] = new Vector3(gl_Vertex.x, gl_Vertex.y, gl_Vertex.z);
		
		var transformed = mat4vec(viewport, mat4vec(projection, mat4vec(modelview, gl_Vertex)));

		transformed.x /= transformed.w; transformed.y /= transformed.w; transformed.z /= transformed.w;
		transformed.x = Math.round(transformed.x); transformed.y = Math.round(transformed.y);
		return transformed;
	},

	fragment: function(bar) {		
		// sample textures
		var diff_color = sample_texture(texture_data, this.varying_uv, bar);
		var nm_color = sample_texture(normal_data, this.varying_uv, bar);
		var spec_color = sample_texture(specular_data, this.varying_uv, bar);		

		// interpolated normal
		var n_ = [new Vector3(this.varying_normal[0].x, this.varying_normal[1].x, this.varying_normal[2].x),
				new Vector3(this.varying_normal[0].y, this.varying_normal[1].y, this.varying_normal[2].y),
				new Vector3(this.varying_normal[0].z, this.varying_normal[1].z, this.varying_normal[2].z)]
		var n = new Vector3(n_[0].dot(bar),
							n_[1].dot(bar),
							n_[2].dot(bar));
		n.normalize();

		// normal map in tangent space
		var nm = new Vector3((nm_color.r/255)*2-1, (nm_color.g/255)*2-1, (nm_color.b/255)*2-1);

		// tangent and bitangent
		var dP1 = this.varying_pos[1].subtract(this.varying_pos[0]);
		var dP2 = this.varying_pos[2].subtract(this.varying_pos[0]);
		var dUV1 = this.varying_uv[1].subtract(this.varying_uv[0]);
		var dUV2 = this.varying_uv[2].subtract(this.varying_uv[0]);

		var r = dUV1.x*dUV2.y - dUV1.y*dUV2.x;
		var tangent = new Vector3((dP1.x*dUV2.y - dP2.x*dUV1.y)/r, 
								(dP1.y*dUV2.y - dP2.y*dUV1.y)/r,
								(dP1.z*dUV2.y - dP2.z*dUV1.y)/r);
		var bitangent = new Vector3((dP2.x*dUV1.x - dP1.x*dUV2.x)/r, 
								(dP2.y*dUV1.x - dP1.y*dUV2.x)/r,
								(dP2.z*dUV1.x - dP1.z*dUV2.x)/r);

		// transform from tangent to model space
		var t2m = new Mat3x3([tangent.x, bitangent.x, n.x], 
							[tangent.y, bitangent.y, n.y], 
							[tangent.z, bitangent.z, n.z]);
		nm = mat3vec(t2m, nm);
		nm.normalize();

		// add normal map perturbation to normal
		n.add(nm);
		n.normalize();

		// technically the light_dir should be transformed to model space
		// but since the model isnt being transformed we dont bother

		// phong
		var intensity = n.dot(light_dir);
		var reflected_light = new Vector3(n.x*2*intensity, n.y*2*intensity, n.z*2*intensity);
		reflected_light = reflected_light.subtract(light_dir);

		var diff = Math.max(0, intensity);
		var spec = Math.pow(Math.max(0, reflected_light.z), spec_color.r);		
		
		diff_color.r = Math.min(0 + diff_color.r*(diff + 0.0*spec), 255);
		diff_color.g = Math.min(0 + diff_color.g*(diff + 0.0*spec), 255);
		diff_color.b = Math.min(0 + diff_color.b*(diff + 0.0*spec), 255);		

		return {
			color: diff_color,
			//color: new Color(bitangent.x*255, bitangent.y*255, bitangent.z*255),
			discard: false
		};
	}

};

function render_model(model, shader) {
	clear();	

	modelview = compute_modelview(camera);
	viewport = compute_viewport(vp);
	projection = compute_projection(camera);	

	shader.init(model);

	for (var i = 0; i < model.faces.length; ++i) {
		var screen_coords = [new Vector4(0,0,0,0), new Vector4(0,0,0,0), new Vector4(0,0,0,0)];
		for (var j = 0; j < 3; ++j) {
			screen_coords[j] = shader.vertex(i, j);
		}
		triangle(screen_coords, shader);
	}	

	if (draw_zbuffer) {
		render_zbuffer();
		ctx.putImageData(image_data, 0, 0);
	} else {
		ctx.putImageData(image_data, 0, 0);
	}
}

/* Main */

clear();

var texture_image = new TGA();
var normal_image = new TGA();
var specular_image = new TGA();
var test_model = new Model();

texture_image.open("images/african_head_diffuse.tga", function(data) {
	texture_data = texture_image.getImageData();
	
	if (draw_texture) {
		canvas.width = texture_data.width;
		canvas.height = texture_data.height;
		ctx.putImageData(texture_data, 0, 0);
		return;
	}
	
	normal_image.open("images/african_head_normal.tga", function(data) {
		normal_data = normal_image.getImageData();

		specular_image.open("images/african_head_specular.tga", function(data) {
			specular_data = specular_image.getImageData();

			test_model.open("models/african_head.obj", mesh_onload);
		});
	});
	
});

function mesh_onload(data) {
	render_model(test_model, shader);
}