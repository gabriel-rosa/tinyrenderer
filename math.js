var Vector2 = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector2.prototype.copy = function() {
	var v_out = new Vector2(this.x, this.y);
	return v_out;
};

var Vector3 = function(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
};

Vector3.prototype.copy = function() {
	var v_out = new Vector3(this.x, this.y, this.z);
	return v_out;
};

Vector3.prototype.dot = function(v2) {
	return this.x*v2.x + this.y*v2.y + this.z*v2.z;
}

Vector3.prototype.normalize = function() {
	var length = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	this.x /= length;
	this.y /= length;
	this.z /= length;
};

Vector3.prototype.add = function(v) {
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
};

var Vector4 = function(x, y, z, w) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
};

var Mat2x2 = function(m1x, m2x) {
	this.data = new Array(4);

	if (m1x !== undefined && m2x !== undefined) {
		this.data[0] = m1x[0]; this.data[1] = m1x[1];
		this.data[2] = m2x[0]; this.data[3] = m2x[1];
	} else {
		this.data = [1, 0, 0, 1];
	}
	
};

Mat2x2.prototype.add = function(M) {
	for (var i=0; i<4; ++i)
		this.data[i] += M.data[i];
};

Mat2x2.prototype.mult = function(M) {
	var m11 = this.data[0]*M.data[0] + this.data[1]*M.data[2];
	var m12 = this.data[0]*M.data[1] + this.data[1]*M.data[3];
	var m21 = this.data[2]*M.data[0] + this.data[3]*M.data[2];
	var m22 = this.data[2]*M.data[1] + this.data[3]*M.data[3];

	this.data = [m11, m12, m21, m22];
};

function mat2vec(M, v) {
	var x = M.data[0]*v.x + M.data[1]*v.y;
	var y = M.data[2]*v.x + M.data[3]*v.y;
	return new Vector2(x, y);
}

function mat2det(M) {
	var determinant = M.data[0]*M.data[3];
	determinant += -M.data[1]*M.data[2];
	return determinant;
}

function mat2inv(M) {
	var inv = new Mat2x2;
	var det = mat2det(M);

	inv.data[0] = M.data[3] / det;
	inv.data[1] = -M.data[1] / det;
	inv.data[2] = -M.data[2] / det;
	inv.data[3] = M.data[1] / det;

	return inv;
}

var Mat3x3 = function(m1x, m2x, m3x) {
	this.data = new Array(9);
	if (m1x !== undefined && m2x !== undefined) {
		this.data[0] = m1x[0]; this.data[1] = m1x[1]; this.data[2] = m1x[2];
		this.data[3] = m2x[0]; this.data[4] = m2x[1]; this.data[5] = m2x[2];
		this.data[6] = m3x[0]; this.data[7] = m3x[1]; this.data[8] = m3x[2];
	} else {
		this.data = [1, 0, 0, 0, 1, 0, 0, 0, 1];
	}
};

Mat3x3.prototype.add = function(M) {
	for (var i=0; i<9; ++i)
		this.data[i] += M.data[i];
};

Mat3x3.prototype.mult = function(M) {
	var m11 = this.data[0]*M.data[0] + this.data[1]*M.data[3] + this.data[2]*M.data[6];
	var m12 = this.data[0]*M.data[1] + this.data[1]*M.data[4] + this.data[2]*M.data[7];
	var m13 = this.data[0]*M.data[2] + this.data[1]*M.data[5] + this.data[2]*M.data[8];

	var m21 = this.data[3]*M.data[0] + this.data[4]*M.data[3] + this.data[5]*M.data[6];
	var m22 = this.data[3]*M.data[1] + this.data[4]*M.data[4] + this.data[5]*M.data[7];
	var m23 = this.data[3]*M.data[2] + this.data[4]*M.data[5] + this.data[5]*M.data[8];

	var m31 = this.data[6]*M.data[0] + this.data[7]*M.data[3] + this.data[8]*M.data[6];
	var m32 = this.data[6]*M.data[1] + this.data[7]*M.data[4] + this.data[8]*M.data[7];
	var m33 = this.data[6]*M.data[2] + this.data[7]*M.data[5] + this.data[8]*M.data[8];

	this.data = [m11, m12, m13, m21, m22, m23, m31, m32, m33];
};

function mat3vec(M, v) {
	var x = M.data[0]*v.x + M.data[1]*v.y + M.data[2]*v.z;
	var y = M.data[3]*v.x + M.data[4]*v.y + M.data[5]*v.z;
	var z = M.data[6]*v.x + M.data[7]*v.y + M.data[8]*v.z;
	return new Vector3(x, y, z);
}

function mat3det(M) {
	var determinant = M.data[0]*M.data[4]*M.data[8];
	determinant += M.data[1]*M.data[5]*M.data[6];
	determinant += M.data[2]*M.data[3]*M.data[7];
	determinant -= M.data[2]*M.data[4]*M.data[6];
	determinant -= M.data[0]*M.data[5]*M.data[7];
	determinant -= M.data[1]*M.data[3]*M.data[8];
	return determinant;
}

function mat3inv(M) {
	var inv = new Mat3x3;
	var det = mat3det(M);

	inv.data[0] = (M.data[4]*M.data[8] - M.data[7]*M.data[5]) / det;
	inv.data[1] = (M.data[1]*M.data[8] - M.data[7]*M.data[2]) / det;
	inv.data[2] = (M.data[1]*M.data[5] - M.data[4]*M.data[2]) / det;

	inv.data[3] = (M.data[3]*M.data[8] - M.data[6]*M.data[5]) / det;
	inv.data[4] = (M.data[0]*M.data[8] - M.data[6]*M.data[2]) / det;
	inv.data[5] = (M.data[0]*M.data[5] - M.data[3]*M.data[2]) / det;

	inv.data[6] = (M.data[3]*M.data[7] - M.data[6]*M.data[4]) / det;
	inv.data[7] = (M.data[0]*M.data[7] - M.data[6]*M.data[4]) / det;
	inv.data[8] = (M.data[0]*M.data[4] - M.data[3]*M.data[1]) / det;
	
	return inv;
}

var Mat4x4 = function(m1x, m2x, m3x, m4x) {
	this.data = new Array(16);
	if (m1x !== undefined && m2x !== undefined) {
		this.data[0] = m1x[0]; this.data[1] = m1x[1]; this.data[2] = m1x[2]; this.data[3] = m1x[3];
		this.data[4] = m2x[0]; this.data[5] = m2x[1]; this.data[6] = m2x[2]; this.data[7] = m2x[3];
		this.data[8] = m3x[0]; this.data[9] = m3x[1]; this.data[10] = m3x[2]; this.data[11] = m3x[3];
		this.data[12] = m4x[0]; this.data[13] = m4x[1]; this.data[14] = m4x[2]; this.data[15] = m4x[3];
	} else {
		this.data = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	}
};

Mat4x4.prototype.add = function(M) {
	for (var i=0; i<16; ++i)
		this.data[i] += M.data[i];
};

Mat4x4.prototype.mult = function(M) {
	var m11 = this.data[0]*M.data[0] + this.data[1]*M.data[4] + this.data[2]*M.data[8] + this.data[3]*M.data[12];
	var m12 = this.data[0]*M.data[1] + this.data[1]*M.data[5] + this.data[2]*M.data[9] + this.data[3]*M.data[13];
	var m13 = this.data[0]*M.data[2] + this.data[1]*M.data[6] + this.data[2]*M.data[10] + this.data[3]*M.data[14];
	var m14 = this.data[0]*M.data[3] + this.data[1]*M.data[7] + this.data[2]*M.data[11] + this.data[3]*M.data[15];

	var m21 = this.data[4]*M.data[0] + this.data[5]*M.data[4] + this.data[6]*M.data[8] + this.data[7]*M.data[12];
	var m22 = this.data[4]*M.data[1] + this.data[5]*M.data[5] + this.data[6]*M.data[9] + this.data[7]*M.data[13];
	var m23 = this.data[4]*M.data[2] + this.data[5]*M.data[6] + this.data[6]*M.data[10] + this.data[7]*M.data[14];
	var m24 = this.data[4]*M.data[3] + this.data[5]*M.data[7] + this.data[6]*M.data[11] + this.data[7]*M.data[15];

	var m31 = this.data[8]*M.data[0] + this.data[9]*M.data[4] + this.data[10]*M.data[8] + this.data[11]*M.data[12];
	var m32 = this.data[8]*M.data[1] + this.data[9]*M.data[5] + this.data[10]*M.data[9] + this.data[11]*M.data[13];
	var m33 = this.data[8]*M.data[2] + this.data[9]*M.data[6] + this.data[10]*M.data[10] + this.data[11]*M.data[14];
	var m34 = this.data[8]*M.data[3] + this.data[9]*M.data[7] + this.data[10]*M.data[11] + this.data[11]*M.data[15];

	var m41 = this.data[12]*M.data[0] + this.data[13]*M.data[4] + this.data[14]*M.data[8] + this.data[15]*M.data[12];
	var m42 = this.data[12]*M.data[1] + this.data[13]*M.data[5] + this.data[14]*M.data[9] + this.data[15]*M.data[13];
	var m43 = this.data[12]*M.data[2] + this.data[13]*M.data[6] + this.data[14]*M.data[10] + this.data[15]*M.data[14];
	var m44 = this.data[12]*M.data[3] + this.data[13]*M.data[7] + this.data[14]*M.data[11] + this.data[15]*M.data[15];

	this.data = [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44];
};

function mat4vec(M, v) {
	var x = M.data[0]*v.x + M.data[1]*v.y + M.data[2]*v.z + M.data[3]*v.w;
	var y = M.data[4]*v.x + M.data[5]*v.y + M.data[6]*v.z + M.data[7]*v.w;
	var z = M.data[8]*v.x + M.data[9]*v.y + M.data[10]*v.z + M.data[11]*v.w;
	var w = M.data[12]*v.x + M.data[13]*v.y + M.data[14]*v.z + M.data[15]*v.w;
	return new Vector4(x, y, z, w);
}

function mat4det(M) {
	var determinant = M.data[0]*M.data[5]*M.data[10]*M.data[15];
	determinant += M.data[3]*M.data[4]*M.data[9]*M.data[14];
	determinant += M.data[2]*M.data[7]*M.data[8]*M.data[13];
	determinant += M.data[1]*M.data[6]*M.data[11]*M.data[12];
	determinant -= M.data[3]*M.data[6]*M.data[9]*M.data[12];
	determinant -= M.data[0]*M.data[7]*M.data[10]*M.data[13];
	determinant -= M.data[1]*M.data[4]*M.data[11]*M.data[14];
	determinant -= M.data[2]*M.data[5]*M.data[8]*M.data[15];
	return determinant;
}

function mat4inv(M) {
	var inv = new Mat4x4;
	var det = mat4det(M);

	var m = M.data;

	inv.data[0] = mat3det(new Mat3x3([m[5], m[9], m[13]], [m[6], m[10], m[14]], [m[7], m[11], m[15]])) / det;
	inv.data[1] = mat3det(new Mat3x3([m[1], m[9], m[13]], [m[2], m[10], m[14]], [m[3], m[11], m[15]])) / det;
	inv.data[2] = mat3det(new Mat3x3([m[1], m[5], m[13]], [m[2], m[6], m[14]],  [m[3], m[7], m[15]]))  / det;
	inv.data[3] = mat3det(new Mat3x3([m[1], m[5], m[9]],  [m[2], m[6], m[10]],  [m[3], m[7], m[11]]))  / det;

	inv.data[4] = mat3det(new Mat3x3([m[4], m[8], m[12]], [m[6], m[10], m[14]], [m[7], m[11], m[15]])) / det;
	inv.data[5] = mat3det(new Mat3x3([m[0], m[8], m[12]], [m[2], m[10], m[14]], [m[3], m[11], m[15]])) / det;
	inv.data[6] = mat3det(new Mat3x3([m[0], m[4], m[12]], [m[2], m[6], m[14]],  [m[3], m[7], m[15]]))  / det;
	inv.data[7] = mat3det(new Mat3x3([m[0], m[4], m[8]],  [m[2], m[6], m[10]],  [m[3], m[7], m[11]]))  / det;
	
	inv.data[8] = mat3det(new Mat3x3([m[4], m[8], m[12]], [m[5], m[9], m[13]], [m[7], m[11], m[15]])) / det;
	inv.data[9] = mat3det(new Mat3x3([m[0], m[8], m[12]], [m[1], m[9], m[13]], [m[3], m[11], m[15]])) / det;
	inv.data[10] = mat3det(new Mat3x3([m[0], m[4], m[12]], [m[1], m[5], m[13]], [m[3], m[7], m[15]])) / det;
	inv.data[11] = mat3det(new Mat3x3([m[0], m[4], m[8]],  [m[1], m[5], m[9]],  [m[3], m[7], m[11]])) / det;

	inv.data[12] = mat3det(new Mat3x3([m[4], m[8], m[12]], [m[5], m[9], m[13]], [m[6], m[10], m[14]])) / det;
	inv.data[13] = mat3det(new Mat3x3([m[0], m[8], m[12]], [m[1], m[9], m[13]], [m[2], m[10], m[14]])) / det;
	inv.data[14] = mat3det(new Mat3x3([m[0], m[4], m[12]], [m[1], m[5], m[13]], [m[2], m[6], m[14]]))  / det;
	inv.data[15] = mat3det(new Mat3x3([m[0], m[4], m[8]],  [m[1], m[5], m[9]],  [m[2], m[6], m[10]]))  / det;

	return inv;
}


function mat4transpose(M) {
	var transpose = new Mat4x4;

	var m = M.data;

	transpose.data[0] = m[0];  transpose.data[4] = m[1];  transpose.data[8] = m[2];   transpose.data[12] = m[3];
	transpose.data[1] = m[4];  transpose.data[5] = m[5];  transpose.data[9] = m[6];   transpose.data[13] = m[7];
	transpose.data[2] = m[8];  transpose.data[6] = m[9];  transpose.data[10] = m[10]; transpose.data[14] = m[11];
	transpose.data[3] = m[12]; transpose.data[7] = m[13]; transpose.data[11] = m[14]; transpose.data[15] = m[15];

	return transpose;
}

function cross(v1, v2) {
	var s1 = v1.y*v2.z - v1.z*v2.y;
	var s2 = v1.z*v2.x - v1.x*v2.z;
	var s3 = v1.x*v2.y - v1.y*v2.x;

	return new Vector3(s1, s2, s3);
}