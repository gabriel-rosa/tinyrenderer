var Vector3 = function(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
};

var Face = function(vertex_inds, texture_inds, normal_inds) {
	this.vertex_inds = vertex_inds;
	this.texture_inds = texture_inds;
	this.normal_inds = normal_inds;
};

var Model = function(vertices, vertices_texture, vertices_normal, faces) {
	this.vertices = vertices;
	this.vertices_texture = vertices_texture;
	this.vertices_normal = vertices_normal;
	this.faces = faces;
};

function parseObj(raw_text) {
	var lines = raw_text.split('\n');

	var vertices = new Array();
	var vertices_texture = new Array();
	var vertices_normal = new Array();
	var faces = new Array();

	for (var i = 0; i < lines.length; ++i) {
		var line = lines[i].split(' ');

		if (line.length != 4)
			continue;

		switch (line[0]) {
			case 'v':
				var vertex = new Vector3(line[1], line[2], line[3]);
				vertices.push(vertex);
				break;

			case 'vt':
				var vertex_texture = new Vector3(line[1], line[2], line[3]);
				vertices_texture.push(vertex_texture);
				break;

			case 'vn':
				var vertex_normal = new Vector3(line[1], line[2], line[3]);
				vertices_normal.push(vertex_normal);
				break;

			case 'f':
				var param1 = line[1].split('/');
				var param2 = line[2].split('/');
				var param3 = line[3].split('/');

				if (param1.length == 1) {
					var v = new Vector3(line[1], line[2], line[3]);
					var f = new Face(v, 0, 0);
					faces.push(f);
				} else if (param1.length == 2) {
					var v = new Vector3(param1[0], param2[0], param3[0]);
					var vt = new Vector3(param1[1], param2[1], param3[1]);
					var f = new Face(v, vt, 0);
					faces.push(f);
				} else if (param1.length == 3) {
					var v = new Vector3(param1[0], param2[0], param3[0]);
					var vt = 0;
					if (param1[1] != '')
						var vt = new Vector3(param1[1], param2[1], param3[1]);
					var vn = new Vector3(param1[2], param2[2], param3[2]);
					var f = new Face(v, vt, vn);
					faces.push(f);
				}
				break;

			default:
		}
	}

	var model = new Model(vertices, vertices_texture, vertices_normal, faces);

	return model;
}
