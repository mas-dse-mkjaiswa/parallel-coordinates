pc.shadows = function() {
	flags.shadows = true;
	if (__.data.length > 0) {
		paths(__.data, ctx.shadows);
	}
	return this;
};

// draw little dots on the axis line where data intersects
pc.axisDots = function() {
	var ctx = pc.ctx.marks;
	ctx.globalAlpha = d3.min([ 1 / Math.pow(data.length, 1 / 2), 1 ]);
	__.data.forEach(function(d) {
		__.dimensions.map(function(p, i) {
			ctx.fillRect(position(p) - 0.75, yscale[p](d[p]) - 0.75, 1.5, 1.5);
		});
	});
	return this;
};

// draw single cubic bezier curve
function single_curve(d, ctx) {

	var centroids = compute_centroids(d);
	var cps = compute_control_points(centroids);

	ctx.moveTo(cps[0].e(1), cps[0].e(2));
	for (var i = 1; i < cps.length; i += 3) {
		if (__.showControlPoints) {
			for (var j = 0; j < 3; j++) {
				ctx.fillRect(cps[i+j].e(1), cps[i+j].e(2), 2, 2);
				}
		}
		ctx.bezierCurveTo(cps[i].e(1), cps[i].e(2), cps[i+1].e(1), cps[i+1].e(2), cps[i+2].e(1), cps[i+2].e(2));
	}
};

function compute_centroids(d) {
	var centroids = [];

	var p = __.dimensions;
	var cols = p.length;
	var a = 0.5;			// center between axes
	for (var i = 0; i < cols; ++i) {
		var x = position(p[i]);
		var y = yscale[p[i]](d[p[i]]);
		centroids.push($V([x, y]));

		if (i < cols - 1) {
			var cx = x + a * (position(p[i+1]) - x);
			var cy = y + a * (yscale[p[i+1]](d[p[i+1]]) - y);
			centroids.push($V([cx, cy]));
		}
	}

	return centroids;
}

function compute_control_points(centroids) {

	var cols = centroids.length;
	var a = __.smoothness;
	var cps = [];

	cps.push(centroids[0]);
	cps.push($V([centroids[0].e(1) + a*2*(centroids[1].e(1)-centroids[0].e(1)), centroids[0].e(2)]));
	for (var col = 1; col < cols - 1; ++col) {
		var mid = centroids[col];
		var left = centroids[col - 1];
		var right = centroids[col + 1];

		var diff = left.subtract(right);
		cps.push(mid.add(diff.x(a)));
		cps.push(mid);
		cps.push(mid.subtract(diff.x(a)));
	}
	cps.push($V([centroids[cols-1].e(1) + a*2*(centroids[cols-2].e(1)-centroids[cols-1].e(1)), centroids[cols-1].e(2)]));
	cps.push(centroids[cols - 1]);

	return cps;

};

// draw single polyline
function color_path(d, ctx) {
	ctx.strokeStyle = d3.functor(__.color)(d);
	ctx.beginPath();
	if (__.bundleDimension === null) {
		single_path(d, ctx);
	} else {
		single_curve(d, ctx);
	}
	ctx.stroke();
};

// draw many polylines of the same color
function paths(data, ctx) {
	ctx.clearRect(-1, -1, w() + 2, h() + 2);
	ctx.beginPath();
	data.forEach(function(d) {
		if (__.bundleDimension === null) {
			single_path(d, ctx);
		} else {
			single_curve(d, ctx);
		}
	});
	ctx.stroke();
};

function single_path(d, ctx) {
	__.dimensions.map(function(p, i) {
		if (i == 0) {
			ctx.moveTo(position(p), yscale[p](d[p]));
		} else {
			ctx.lineTo(position(p), yscale[p](d[p]));
		}
	});
}

function path_foreground(d) {
	return color_path(d, ctx.foreground);
};

function path_highlight(d) {
	return color_path(d, ctx.highlight);
};
