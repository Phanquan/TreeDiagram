const width = 1200
const height = 800
let rootTree

let force = d3.layout.force()
    .linkDistance(100)
    .charge(-200)
    .gravity(0.05)
    .size([width, height])
    .on('tick', tick)

let svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)

let link = svg.selectAll('.link'),
    node = svg.selectAll('.node')

d3.json('graph.json', function( json) {
    // if (error) throw error

    rootTree = json
    rootTree.fixed = true;
    rootTree.px = rootTree.py = 0;
    update();
})

function tick() {
    // apply the constraints

    force.nodes().forEach(function(d) {
        if (!d.fixed) {
            let r = 15,
                dx, dy, ly = 30

            //
            if (d.children || d._children) {
                let py = 0;
                if (d.parent) {
                    py = d.parent.y
                }
                d.py = d.y = py + d.depth * ly + r
            }

            dx = Math.min(0, width - r - d.x) + Math.max(0, r - d.x);
            dy = Math.min(0, height - r - d.y) + Math.max(0, r - d.y);
            d.x += 2 * Math.max(-ly, Math.min(ly, dx));
            d.y += 2 * Math.max(-ly, Math.min(ly, dy));
            // #1b: constraint all nodes to the visible screen: charges ('repulse')
            dx = Math.min(0, width - r - d.px) + Math.max(0, r - d.px);
            dy = Math.min(0, height - r - d.py) + Math.max(0, r - d.py);
            d.px += 2 * Math.max(-ly, Math.min(ly, dx));
            d.py += 2 * Math.max(-ly, Math.min(ly, dy));

            // #2: hierarchy means childs must be BELOW parents in Y direction:
            if (d.parent) {
                d.y = Math.max(d.y, d.parent.y + ly);
                d.py = Math.max(d.py, d.parent.py + ly);
            }
        }
    })

    link.attr('x1', function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });

    node.attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        });


}


function update(nodes) {
    nodes = flatten(rootTree)
    links = d3.layout.tree().links(nodes)


    if (!rootTree.px) {
        // root have not be set / dragged / moved: set initial root position
        rootTree.px = rootTree.x = width / 2;
        rootTree.py = rootTree.y = 15 + 2;
    }

    // Restart the force layout.
    force.nodes(nodes)
        .links(links)
        .start()


    // Update links.
    link = link.data(links, function(d) {
        return d.target.id
    })

    link.enter().insert('line', '.node')
        .attr('class', 'link')
        .attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });
    link.exit().remove()
        // Update nodes.
    node = node.data(nodes, function(d) {
        return d.id
    })
    node.transition()
        .attr("cy", function(d) {
            return d.y;
        })
        .attr("r", function(d) {
            return 15;
        });

    node.append('circle')
        .attr('r', 20)
        .attr('class', 'node')
        .on('click', click)
        .call(force.drag)

    node.append('text')
        .attr('style', 'font-size: 14px;')
        .attr('dy', '0.35em')
        .text(function(d) {
            return d.name
        })
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        })
        .attr("r", function(d) {
            return 25;
        })

    node.select('circle')
        .style('fill', function(d) {
            return d.root ? '#00ff1e' : d._children ? '#3182bd' // collapsed package
                : d.children ? '#c6dbef' // expanded package
                : '#fd8d3c' // leaf node
        })
    node.exit().remove()
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
        i = 0,
        depth = 0,
        level_widths = [1],
        max_width, max_depth = 1,
        kx, ky;

    function recurse(node, parent, depth, x) {
        if (node.children) {
            let w = level_widths[depth + 1] || 0
            level_widths[depth + 1] = w + node.children.length
            max_depth = Math.max(max_depth, depth + 1);
            node.size = node.children.reduce(function(p, v, i) {
                return p + recurse(v, node, depth + 1, w + i);
            });
        }
        if (!node.id) {
            node.id = ++i
        }

        node.parent = parent
        node.depth = depth

        if (!node.px) {
            node.y = depth
            node.x = x
        }


        nodes.push(node)
        return node.size
    }

    rootTree.size = recurse(rootTree, null, 0);

    // now correct/balance the x positions:
    max_width = 1;
    for (i = level_widths.length; --i > 0;) {
        max_width = Math.max(max_width, level_widths[i]);
    }
    kx = (width - 20) / max_width;
    ky = (height - 20) / max_depth;
    for (i = nodes.length; --i >= 0;) {
        var node = nodes[i];
        if (!node.px) {
            node.y *= ky;
            node.y += 10 + ky / 2;
            node.x *= kx;
            node.x += 10 + kx / 2;
        }
    }

    return nodes;
}