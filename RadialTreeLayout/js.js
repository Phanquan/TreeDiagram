
var diameter = 960;

var radius_scale = d3.scale.sqrt()
	.domain([0, 50000])
	.range([0, 10]);

var rho_scale = d3.scale.pow()
	.exponent(0.8)
	.domain([0, diameter / 2])
	.range([0, diameter / 2]);


var tree = d3.layout.tree()
	.size([360, diameter / 2 - 80])
	.separation(function(a, b) {
		return (a.parent == b.parent ? 1 : 2) / a.depth;
	});

var diagonal = d3.svg.diagonal.radial()
	.projection(function(d) {
		return [d.y, d.x / 180 * Math.PI];
	});

var svg = d3.select("body").append("svg")
	.attr("width", diameter)
	.attr("height", diameter - 150)
	.append("g")
	.attr("transform", "translate(" + (diameter / 2 + 30) + "," + (diameter / 2 - 40) + ")");

var flare

d3.json('flare.json', function(error, json) {
	if (error) {
		throw error
	}

	flare = json
	console.log(flare)
})

var nodes = tree.nodes(flare),
	links = tree.links(nodes);

function jitter(node) {
	if (node.children === undefined)
		return;

	node.children.forEach(function(n, i) {
		if (n.size !== undefined) {
			if (i % 2 === 0)
				n.y = n.y + radius_scale(n.size);
			else
				n.y = n.y - radius_scale(n.size);
		}
		n.y = rho_scale(n.y);
		jitter(n);
	});
}
jitter(flare);

var link = svg.selectAll(".link")
	.data(links.filter(function(l) {
		return l.source.depth > 0;
	}));

link
	.enter().append("path")
	.attr("class", "link")
	.attr("d", diagonal);

var root_link = svg.selectAll(".root_link")
	.data(links.filter(function(l) {
		return l.source.depth === 0;
	}));

root_link
	.enter().append("path")
	.attr("class", "root_link")
	.attr("d", function(d) {
		var theta = (d.target.x - 90) / 180 * Math.PI;
		var x1 = Math.cos(theta) * d.source.y;
		var y1 = Math.sin(theta) * d.source.y;
		var x2 = Math.cos(theta) * d.target.y;
		var y2 = Math.sin(theta) * d.target.y;
		return 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2;
	});

var node = svg.selectAll(".node")
	.data(nodes)
	.enter().append("circle")
	.attr("class", "node")
	.attr("transform", function(d) {
		return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
	})
	.attr("r", function(d) {
		if (d.size === undefined)
			return 2;
		return radius_scale(d.size);
	})
	.classed('internal', function(d) {
		return d.size === undefined;
	});

node.append("title")
	.text(function(d) {
		if (d.size === undefined)
			return d.name;
		else
			return d.name + ' (' + d3.format(',')(d.size) + ')';
	});

d3.select(self.frameElement).style('height', '810px');