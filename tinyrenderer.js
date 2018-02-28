var canvas, ctx;
canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

var test_image = new TGA();
test_image.open( "images/african_head_diffuse.tga", function(data){
	var imageData = ctx.createImageData(test_image.header.width, test_image.header.height);

	canvas.width = test_image.header.width;
	canvas.height = test_image.header.height;

	ctx.putImageData(test_image.getImageData(imageData), 0, 0);
});
