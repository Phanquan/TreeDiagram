const w = 960
const h = 500
let rootTree

let svg = d3.select('body').append('svg')
	.attr('width', w)
	.attr('height', h)

let link = svg.selectAll('.link')

let node = svg.selectAll('.node')


let force = d3.layout.force()
	.linkDistance(75)
	.charge(-120)
	.gravity(0.05)
	.size([w, h])
	.on('tick', function() {
		link.attr('x1', function(d) { return d.source.x })
			.attr('y1', function(d) { return d.source.y	})
			.attr('x2', function(d) { return d.target.x	})
			.attr('y2', function(d) { return d.target.y	})
		node.attr('transform', function(d) {
			return `translate(${d.x} , ${d.y})`
		})
	})


d3.json('treeData.json', function(error, json) {
	if (error) throw error

	rootTree = json
	update()
})

function update() {
	let nodes = flatten(rootTree)
	let links = d3.layout.tree().links(nodes)
	console.log('links after tree-d:', links)
	console.log('nodes after flatten:', nodes)

	force.nodes(nodes)
		.links(links)
		.start()

	//update links
	link = link.data(links, function(d) {
		return d.target.id
	})

	link.exit().remove()

	link.enter().insert('line', '.node')
		.attr('class', 'link')

	//update nodes
	node = node.data(nodes, function(d) {
		console.log('data of nodes:', d)
		return d.id
	})

	node.exit().remove()

	//start creating the node
	let nodeEnter = node.enter().append('g')
		.attr('class', 'node')
		.on('click', function(d) {
			if (d3.event.defaultPrevented) {
				return
			}
			if (d.children) {
				d._children = d.children
				d.children = null
			} else {
				d.children = d._children
				d._children = null
			}
			update()
		})
		.call(force.drag)

	nodeEnter.append('circle')
		.attr('r', 20)
	node.append('text')
		.attr('dy', '.35em')
		.text(function(d) {
			return d.name
		})
	node.select('circle')
		.style('fill', function(d) {
			if (d.children) {
				return '#c6dbef'
			} else {
				return '#fd8d3c'
			}
		})
}

function flatten(rootTree) {
	let nodes = [],
		i = 0

	function recurseNode(node) {
		if (node.children) {
			node.children.forEach(recurseNode)
		}
		if (!node.id) {
			node.id = ++i
		}
		nodes.push(node)
	}
	recurseNode(rootTree)
	return nodes
}