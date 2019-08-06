import * as bootstrap from 'bootstrap';
import * as d3 from 'd3';
import './styles/main.scss';
import cloneDeep from 'lodash/cloneDeep';


function drawExampleViz(el, data, error, height, width) {

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);

    let epsilon = error;

    let svg = d3.select(el)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "border: 1px solid black");

    let defs = svg.append("svg:defs");

    defs.append("svg:marker")
        .attr('id', 'arrow')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#000')
        .style('stroke', 'none');

    defs.append("svg:marker")
        .attr('id', 'bluearrow')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 30)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', 'blue')
        .style('stroke', 'none');

    defs.append("svg:pattern")
        .attr('id', "lightstripe")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 5)
        .attr("height", 5)
        .append("image")
        .attr("xlink:href", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgogIDxyZWN0IHdpZHRoPSc1JyBoZWlnaHQ9JzUnIGZpbGw9J3doaXRlJy8+CiAgPHBhdGggZD0nTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVonIHN0cm9rZT0nIzg4OCcgc3Ryb2tlLXdpZHRoPScxJy8+Cjwvc3ZnPg==")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 5)
        .attr("height", 5);


    const vizContainer = svg.append("g")
        .attr("transform", function (d, i) {
            return "translate(0,0)";
        });

    const t = svg.transition()
        .duration(750);

    let stripContainer = vizContainer.append("g");
    let edgeContainer = vizContainer.append("g");
    let vertexContainer = vizContainer.append("g");

    function initializeFlags() {
        data.nodes.forEach(function (e) {
            if (!e.hasOwnProperty('disc')) {
                e.disc = false;
            }
            if (!e.hasOwnProperty('epsilon')) {
                e.epsilon = epsilon;
            }

        });
        data.edges.forEach(function (e) {
            if (!e.hasOwnProperty('approx')) {
                e.approx = false;
            } else if (e.approx && !e.hasOwnProperty('show')) {
                e.show = false;
            }
            if (!e.hasOwnProperty('strip')) {
                e.strip = false;
            }
            if (!e.hasOwnProperty('epsilon')) {
                e.epsilon = epsilon;
            }
        });
    }

    function updateError(error) {
        epsilon = error;
        data.nodes.forEach(function (e) {

            e.epsilon = epsilon;

        });
        data.edges.forEach(function (e) {

            e.epsilon = epsilon;

        });
    }

    function updateNodes(nodelist) {
        data.nodes.forEach(function (n, idx, arr) {
            nodelist.forEach(function (u) {
                let nc = n.coordinates;
                let uc = u.coordinates;
                if (uc.x === nc.x && uc.y === nc.y) {
                    arr[idx] = Object.assign({}, n, cloneDeep(u));
                }
            });

        });
    }

    function updateEdges(edgelist) {
        data.edges.forEach(function (n, idx, arr) {
            edgelist.forEach(function (u) {
                if (u.source === n.source && u.target === n.target) {

                    arr[idx] = Object.assign({}, n, cloneDeep(u));

                }
            });

        });

    }


    function generateApproxEdges() {

        const len = data.nodes.length;
        data.nodes.forEach(function (n, idx) {
            for (let i = 0; i < len; i++) {
                if (i > idx) {
                    data.edges.push({'source': idx, 'target': i, 'approx': true});
                }
            }
        });

    }

    generateApproxEdges();

    initializeFlags();


    function getEdges() {
        return data.edges.filter(function (e) {
            return (!e.approx) || (e.approx && e.show);
        })
    }

    function drawGraph() {

        let edges = edgeContainer.selectAll("line")
            .data(getEdges(), d => d)
            .join(
                enter => enter.append("line")
                    .attr("x1", function (d) {
                        return xScale(data.nodes[d.source].coordinates.x);
                    })
                    .attr("y1", function (d) {
                        return yScale(data.nodes[d.source].coordinates.y);
                    })
                    .attr("x2", function (d) {
                        return xScale(data.nodes[d.target].coordinates.x);
                    })
                    .attr("y2", function (d) {
                        return yScale(data.nodes[d.target].coordinates.y);
                    })
                    .style("stroke", function (d) {
                        if (d.approx) {
                            return "blue";
                        } else {
                            return "#000000";
                        }
                    })
                    .style("stroke-dasharray", function (d) {
                        if (d.approx) {
                            return "2,2";
                        } else {
                            return "";
                        }
                    })
                    .style("stroke-width", function (d) {
                        if (d.approx) {
                            return "1";
                        } else {
                            return "2";
                        }
                    })
                    .attr("marker-end", function (d) {
                        if (d.approx) {
                            return "url(#bluearrow)";
                        } else {
                            return "url(#arrow)";
                        }
                    })
                    .call(enter => enter.transition(t)
                        .attr("y", 0)),
                update => update
                    .attr("marker-end", "url(#arrow)")
                    .attr("y", 0)
                    .call(update => update.transition(t)
                        .attr("x", (d, i) => i * 16)),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.transition(t)
                        .attr("y", 30)
                        .remove())
            );


        let vertices = vertexContainer
            .selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return xScale(d.coordinates.x);
            })
            .attr("cy", function (d) {
                return yScale(d.coordinates.y);
            })
            .attr("r", 5)
            .style("fill", function (d) {
                return "#FF0000";
            });

        updateErrorDiscs();

    }


    function updateErrorDiscs() {
        let discs = stripContainer.selectAll("circle")
            .data(data.nodes)
            .join(
                enter => enter.append("circle")
                    .attr("cx", function (d) {
                        return xScale(d.coordinates.x);
                    })
                    .attr("cy", function (d) {
                        return yScale(d.coordinates.y);
                    })
                    .attr("r", function (d) {
                        return d.disc ? d.epsilon : 0;
                    })
                    .style("fill", "url(#lightstripe)")
                    .style("stroke", "#000")
                    .style("strokewidth", "1")
                    .call(enter => enter.transition(t)
                        .attr("y", 0)),
                update => update
                    .attr("r", function (d) {
                        return d.disc ? d.epsilon : 0;
                    })
                    .call(update => update.transition(t)
                        .attr("x", (d, i) => i * 16)),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.transition(t)
                        .attr("y", 30)
                        .remove())
            );


        let strips = stripContainer.selectAll("line")
            .data(data.edges)
            .join(
                enter => enter.append("line")
                    .attr("x1", function (d) {
                        if (!d.strip) return null;
                        return xScale(data.nodes[d.source].coordinates.x);
                    })
                    .attr("y1", function (d) {
                        if (!d.strip) return null;
                        return yScale(data.nodes[d.source].coordinates.y);
                    })
                    .attr("x2", function (d) {
                        if (!d.strip) return null;
                        return xScale(data.nodes[d.target].coordinates.x);
                    })
                    .attr("y2", function (d) {
                        if (!d.strip) return null;
                        return yScale(data.nodes[d.target].coordinates.y);
                    })
                    .style("stroke", function (d) {
                        if (d.strip) {
                            return "#00EE00";
                        } else {
                            return "#000000";
                        }
                    })
                    .style("stroke-width", function (d) {
                        if (d.strip) {
                            return 2 * d.epsilon;
                        } else {
                            return 1;
                        }
                    })
                    .style("stroke-opacity", function (d) {
                        if (d.strip) {
                            return 0.5;
                        } else {
                            return 1;
                        }
                    }),
                update => update
                    .style("stroke-width", function (d) {
                        if (d.strip) {
                            return 2 * d.epsilon;
                        } else {
                            return 1;
                        }
                    })
                    .call(update => update.transition(t)
                        .attr("x", (d, i) => i * 16)),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.transition(t)
                        .attr("y", 30)
                        .remove())
            );
    }


    function isVertical(p1, p2) {
        return (p2.x - p1.x) === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }


    function getDiscTangentPoints(p1, p2) {
        if (isVertical(p1, p2)) {
            // perpendicular line is horizontal
            return [{'x': p2.x - error, 'y': p2.y}, {'x': p2.x + error, 'y': p2.y}];
        }
        let slope = getSlope(p1, p2);
        if (slope === 0) {
            // perpendicular line is vertical
            return [{'x': p2.x, 'y': p2.y - error}, {'x': p2.x, 'y': p2.y + error}];
        } else {
            // y = mx + b
            let newSlope = -1 / slope;
        }
    }

    function generateCone(p1, p2) {
        let trianglePoints = xScale(p1.x) + ' ' + yScale(p1.y) + ', ' + xScale(50) + ' ' + yScale(55) + ', ';
        trianglePoints += xScale(50) + ' ' + yScale(45) + ' ' + xScale(p1.x) + ', ' + yScale(p1.y);
        svg.append('polyline')
            .attr('points', trianglePoints)
            .style('stroke', 'blue')
            .style('stroke-width', "1")
            .style('stroke-opacity', '1')
            .style('fill', 'blue')
            .style('opacity', '0.2');
    }

    function showApprox() {
        data.edges.forEach(function (i) {
            if (i.approx) {
                i.show = true;
            }
        })
    }

    function hideApprox() {
        data.edges.forEach(function (i) {
            if (i.approx) {
                i.show = false;
            }
        })
    }

    return {
        drawGraph: drawGraph,
        updateNodes: updateNodes,
        updateEdges: updateEdges,
        updateError: updateError,
        showApproximation: showApprox,
        hideApproximation: hideApprox
    }
}


function drawDiscsCones() {
    let data = {
        "nodes": [
            {"coordinates": {"x": 5, "y": 10}, "disc": false},
            {"coordinates": {"x": 50, "y": 50}, "disc": true},
            {"coordinates": {"x": 60, "y": 40}, "disc": true}

        ],
        "edges": [
            {"source": 0, "target": 1, "cone": true},
            {"source": 1, "target": 2, "cone": true}
        ]
    };

    let error = 8;

// todo: dynamic height and width (so range should also be dynamic)
    let height = 500;
    let width = 500;
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);

    let svg = d3.select("#vizCones > svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "border: 1px solid black")
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0,0)";
        });

    let discContainer = svg
        .append("g")
        .attr("id", "disc-container");

    let chainContainer = svg.append("g")
        .attr("id", "chain-container");

    function drawGraph() {

        let edges = chainContainer.selectAll("line")
            .data(data.edges)
            .enter()
            .append("line")
            .attr("x1", function (d) {
                return xScale(data.nodes[d.source].coordinates.x);
            })
            .attr("y1", function (d) {
                return yScale(data.nodes[d.source].coordinates.y);
            })
            .attr("x2", function (d) {
                return xScale(data.nodes[d.target].coordinates.x);
            })
            .attr("y2", function (d) {
                return yScale(data.nodes[d.target].coordinates.y);
            })
            .style("stroke", function (d) {
                if (d.approx) {
                    return "blue";
                } else {
                    return "#000000";
                }
            })
            .style("stroke-dasharray", function (d) {
                if (d.approx) {
                    return "2,2";
                } else {
                    return "";
                }
            })
            .style("stroke-width", function (d) {
                if (d.approx) {
                    return "1";
                } else {
                    return "2";
                }
            });

        let vertices = chainContainer
            .selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return xScale(d.coordinates.x);
            })
            .attr("cy", function (d) {
                return yScale(d.coordinates.y);
            })
            .attr("r", 5)
            .style("fill", function (d) {
                return "#FF0000";
            });
    }


    function updateErrorDiscs() {
        let discs = discContainer.selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return xScale(d.coordinates.x);
            })
            .attr("cy", function (d) {
                return yScale(d.coordinates.y);
            })
            .attr("r", function (d) {
                return d.disc ? 2 * error : 0;
            })
            .style("fill", "url(#lightstripe)")
            .style("stroke", "#000")
            .style("strokewidth", "1");
    }


    function isVertical(p1, p2) {
        return (p2.x - p1.x) === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }


    function getDiscTangentPoints(p1, p2) {
        if (isVertical(p1, p2)) {
            // perpendicular line is horizontal
            return [{'x': p2.x - error, 'y': p2.y}, {'x': p2.x + error, 'y': p2.y}];
        }
        let slope = getSlope(p1, p2);
        if (slope === 0) {
            // perpendicular line is vertical
            return [{'x': p2.x, 'y': p2.y - error}, {'x': p2.x, 'y': p2.y + error}];
        } else {
            // y = mx + b
            let newSlope = -1 / slope;
        }
    }

    function generateCone(p1, p2) {
        let trianglePoints = xScale(p1.x) + ' ' + yScale(p1.y) + ', ' + xScale(50) + ' ' + yScale(55) + ', ';
        trianglePoints += xScale(50) + ' ' + yScale(45) + ' ' + xScale(p1.x) + ', ' + yScale(p1.y);
        svg.append('polyline')
            .attr('points', trianglePoints)
            .style('stroke', 'blue')
            .style('stroke-width', "1")
            .style('stroke-opacity', '1')
            .style('fill', 'blue')
            .style('opacity', '0.2');
    }

    drawGraph();
    generateCone(data.nodes[0].coordinates, data.nodes[1].coordinates);
    updateErrorDiscs();
}


const demoData = {
    "nodes": [
        {"coordinates": {"x": 30, "y": 70}},
        {"coordinates": {"x": 20, "y": 55}},
        {"coordinates": {"x": 19, "y": 37}},
        {"coordinates": {"x": 25, "y": 41}},
        {"coordinates": {"x": 40, "y": 45}},
        {"coordinates": {"x": 50, "y": 41}},
        {"coordinates": {"x": 60, "y": 45}},
        {"coordinates": {"x": 80, "y": 40}},
        {"coordinates": {"x": 70, "y": 80}}

    ],
    "edges": [
        {"source": 0, "target": 1, "strip": false},
        {"source": 1, "target": 2, "strip": false},
        {"source": 2, "target": 3, "strip": false},
        {"source": 3, "target": 4, "strip": false},
        {"source": 4, "target": 5, "strip": false},
        {"source": 5, "target": 6, "strip": false},
        {"source": 6, "target": 7, "strip": false},
        {"source": 7, "target": 8, "strip": false}
    ]
};

const error = 10;
const height = 500;
const width = 500;
//viz 1
let dataDag = cloneDeep(demoData);
let dag = drawExampleViz("#vizDAG", dataDag, error, height, width);
let dagShowEdges = false;
dag.drawGraph();

function toggleDAGedges1() {
    dagShowEdges = !dagShowEdges;
    if (dagShowEdges) {
        dag.showApproximation();
    } else {
        dag.hideApproximation();
    }
    dag.drawGraph();
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'toggleDAGedges1') {
        toggleDAGedges1();
    }
});

// viz 2
let dataStrip = cloneDeep(demoData);

let strip = drawExampleViz("#vizStrip", dataStrip, error, height, width);

let stripNodes = [
    {"coordinates": {"x": 25, "y": 41}, "disc": true},
    {"coordinates": {"x": 40, "y": 45}, "disc": true},
    {"coordinates": {"x": 50, "y": 41}, "disc": true},
    {"coordinates": {"x": 60, "y": 45}, "disc": true}];
let stripEdges = [{"source": 2, "target": 7, "strip": true, "show": true}];
strip.updateNodes(stripNodes);
strip.updateEdges(stripEdges);

strip.drawGraph();

document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'epsilonRange_strip') {
        strip.updateError(e.target.value);
        strip.drawGraph(false);
    }
});

let dataCones = {
    "nodes": [
        {"coordinates": {"x": 5, "y": 10}, "disc": false},
        {"coordinates": {"x": 50, "y": 50}, "disc": true},
        {"coordinates": {"x": 60, "y": 40}, "disc": true}

    ],
    "edges": [
        {"source": 0, "target": 1, "cone": true},
        {"source": 1, "target": 2, "cone": true}
    ]
};

let cones = drawExampleViz("#vizCones", dataCones, error, height, width);
cones.updateNodes(dataCones.nodes);
cones.updateEdges(dataCones.edges);
cones.drawGraph();
//drawDiscsCones();

let demo = drawExampleViz("#vizDemo", cloneDeep(demoData), error, 750, 1000);
demo.drawGraph();
