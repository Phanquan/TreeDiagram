const width = 1200
const height = 800
let rootTree

let force = d3.layout.force()
    .linkDistance(100)
    .charge(-150)
    .gravity(0.05)
    .size([width, height])
    .on('tick', function(e) {
        let k = 6 * e.alpha
        link.each(function(d) {
                d.source.y -= k, d.target.y += k
            })
            .attr('x1', function(d) {
                return d.source.x
            })
            .attr('y1', function(d) {
                return d.source.y
            })
            .attr('x2', function(d) {
                return d.target.x
            })
            .attr('y2', function(d) {
                return d.target.y
            })


        node.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')'
        })
    })

let svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)

let link = svg.selectAll('.link'),
    node = svg.selectAll('.node')

d3.json('graph.json', function(error, json) {
    if (error) throw error

    rootTree = json
    update()
})

function update() {
    let nodes = flatten(rootTree),
        links = d3.layout.tree().links(nodes)

    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .start()

    // Update links.
    link = link.data(links, function(d) {
        return d.target.id
    })

    link.exit().remove()

    link.enter().insert('line', '.node')
        .attr('class', 'link')

    // Update nodes.
    node = node.data(nodes, function(d) {
        return d.id
    })

    node.exit().remove()

    let nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .on('click', click)
        .call(force.drag)

    nodeEnter.append('circle')

    .attr('r', 20)

    nodeEnter.append('text')
        .attr('style', 'font-size: 14px;')
        .attr('dy', '0.35em')
        .text(function(d) {
            return d.name
        })

    node.select('circle')
        .style('fill', function(d) {
            return d.root ? '#00ff1e' : d._children ? '#3182bd' // collapsed package
                : d.children ? '#c6dbef' // expanded package
                : '#fd8d3c' // leaf node
        })

}


// Toggle children on click.
function click(d) {
    if (d3.event.defaultPrevented) return // ignore drag
    if (d.children) {
        d._children = d.children
        d.children = null
    } else {
        d.children = d._children
        d._children = null
    }
    update()
}

// Returns a list of all nodes under the root.
function flatten(rootTree) {
    let nodes = [],
        i = 0

    function recurse(node) {
        if (node.children) {
            node.children.forEach(recurse)
        }
        if (!node.id) {
            node.id = ++i
        }
        nodes.push(node)
    }

    recurse(rootTree)
    return nodes
}