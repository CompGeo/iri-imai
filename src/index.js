import * as bootstrap from 'bootstrap';
import * as d3 from 'd3';
import './styles/main.scss';

function drawDAG() {
    let data = {
        "nodes": [
            {"coordinates": {"x": 30, "y": 70}, "disc": false},
            {"coordinates": {"x": 20, "y": 55}, "disc": false},
            {"coordinates": {"x": 19, "y": 37}, "disc": false},
            {"coordinates": {"x": 25, "y": 41}, "disc": false},
            {"coordinates": {"x": 40, "y": 45}, "disc": false},
            {"coordinates": {"x": 50, "y": 41}, "disc": false},
            {"coordinates": {"x": 60, "y": 45}, "disc": false},
            {"coordinates": {"x": 80, "y": 40}, "disc": false},
            {"coordinates": {"x": 70, "y": 80}, "disc": false}

        ],
        "edges": [
            {"source": 0, "target": 1, "strip": false, "approx": false},
            {"source": 1, "target": 2, "strip": false, "approx": false},
            {"source": 2, "target": 3, "strip": false, "approx": false},
            {"source": 3, "target": 4, "strip": false, "approx": false},
            {"source": 4, "target": 5, "strip": false, "approx": false},
            {"source": 5, "target": 6, "strip": false, "approx": false},
            {"source": 6, "target": 7, "strip": false, "approx": false},
            {"source": 7, "target": 8, "strip": false, "approx": false}
        ]
    };


    const error = 20;

    let height = 500;
    let width = 500;
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);

    let svg = d3.select("#vizDAG")
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

    const vizContainer = svg.append("g")
        .attr("transform", function (d, i) {
            return "translate(0,0)";
        });

    const t = svg.transition()
        .duration(750);

    let stripContainer = vizContainer.append("g");
    let edgeContainer = vizContainer.append("g");
    let vertexContainer = vizContainer.append("g");

    function generateApproxEdges() {
        data.edges.forEach(function (e) {
            e.approx = false;
        });
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

    function getEdges(showApprox) {
        return data.edges.filter(function (e) {
            if (showApprox) {
                return true;
            } else {
                return !e.approx;
            }

        });
    }

    function drawGraph(showApprox) {

        let edges = edgeContainer.selectAll("line")
            .data(getEdges(showApprox), d => d)
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

    }


    function updateErrorDiscs() {
        let discs = stripContainer.selectAll("circle")
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

        let strips = stripContainer.selectAll("line")
            .data(data.edges)
            .enter()
            .append("line")
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
                    return xScale(error);
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
            });
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


    updateErrorDiscs();

    return {
        drawGraph: drawGraph
    }
}

function drawParallelStrip() {
    let data = {
        "nodes": [
            {"coordinates": {"x": 30, "y": 70}, "disc": false},
            {"coordinates": {"x": 20, "y": 55}, "disc": false},
            {"coordinates": {"x": 19, "y": 37}, "disc": false},
            {"coordinates": {"x": 25, "y": 41}, "disc": false},
            {"coordinates": {"x": 40, "y": 45}, "disc": true},
            {"coordinates": {"x": 50, "y": 41}, "disc": false},
            {"coordinates": {"x": 60, "y": 45}, "disc": false},
            {"coordinates": {"x": 80, "y": 40}, "disc": false},
            {"coordinates": {"x": 70, "y": 80}, "disc": false}

        ],
        "edges": [
            {"source": 0, "target": 1, "strip": false, "approx": false},
            {"source": 1, "target": 2, "strip": false, "approx": false},
            {"source": 2, "target": 3, "strip": false, "approx": false},
            {"source": 3, "target": 4, "strip": false, "approx": false},
            {"source": 4, "target": 5, "strip": false, "approx": false},
            {"source": 5, "target": 6, "strip": false, "approx": false},
            {"source": 6, "target": 7, "strip": false, "approx": false},
            {"source": 7, "target": 8, "strip": false, "approx": false},
            {"source": 2, "target": 7, "strip": true, "approx": true}

        ]
    };

    let error = 20;

// todo: dynamic height and width (so range should also be dynamic)
    let height = 500;
    let width = 500;
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);

    let svg = d3.select("#vizStrip > svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "border: 1px solid black")
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0,0)";
        });

    let stripContainer = svg
        .append("g")
        .attr("id", "strip-container");

    let chainContainer = svg.append("g")
        .attr("id", "chain-container-1");

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
        let discs = stripContainer.selectAll("circle")
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

        let strips = stripContainer.selectAll("line")
            .data(data.edges)
            .enter()
            .append("line")
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
                    return xScale(error);
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
            });
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


    drawGraph();
    updateErrorDiscs();
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


function drawDemo() {
    let data = {
        "nodes": [
            {"coordinates": {"x": 30, "y": 70}, "disc": false},
            {"coordinates": {"x": 20, "y": 55}, "disc": false},
            {"coordinates": {"x": 19, "y": 37}, "disc": false},
            {"coordinates": {"x": 25, "y": 41}, "disc": false},
            {"coordinates": {"x": 40, "y": 45}, "disc": false},
            {"coordinates": {"x": 50, "y": 41}, "disc": false},
            {"coordinates": {"x": 60, "y": 45}, "disc": false},
            {"coordinates": {"x": 80, "y": 40}, "disc": false},
            {"coordinates": {"x": 70, "y": 80}, "disc": false}

        ],
        "edges": [
            {"source": 0, "target": 1, "strip": false, "approx": false},
            {"source": 0, "target": 2, "strip": false, "approx": true},
            {"source": 0, "target": 3, "strip": false, "approx": true},
            {"source": 0, "target": 4, "strip": false, "approx": true},
            {"source": 0, "target": 5, "strip": false, "approx": true},
            {"source": 0, "target": 6, "strip": false, "approx": true},
            {"source": 0, "target": 7, "strip": false, "approx": true},
            {"source": 0, "target": 8, "strip": false, "approx": true},
            {"source": 1, "target": 2, "strip": false, "approx": false},
            {"source": 1, "target": 3, "strip": false, "approx": true},
            {"source": 1, "target": 4, "strip": false, "approx": true},
            {"source": 1, "target": 5, "strip": false, "approx": true},
            {"source": 1, "target": 6, "strip": false, "approx": true},
            {"source": 1, "target": 7, "strip": false, "approx": true},
            {"source": 1, "target": 8, "strip": false, "approx": true},
            {"source": 2, "target": 3, "strip": false, "approx": false},
            {"source": 2, "target": 4, "strip": false, "approx": true},
            {"source": 2, "target": 5, "strip": false, "approx": true},
            {"source": 2, "target": 6, "strip": false, "approx": true},
            {"source": 2, "target": 7, "strip": false, "approx": true},
            {"source": 2, "target": 8, "strip": false, "approx": true},
            {"source": 3, "target": 4, "strip": false, "approx": false},
            {"source": 3, "target": 5, "strip": false, "approx": true},
            {"source": 3, "target": 6, "strip": false, "approx": true},
            {"source": 3, "target": 7, "strip": false, "approx": true},
            {"source": 3, "target": 8, "strip": false, "approx": true},
            {"source": 4, "target": 5, "strip": false, "approx": false},
            {"source": 4, "target": 6, "strip": false, "approx": true},
            {"source": 4, "target": 7, "strip": false, "approx": true},
            {"source": 4, "target": 8, "strip": false, "approx": true},
            {"source": 5, "target": 6, "strip": false, "approx": false},
            {"source": 5, "target": 7, "strip": false, "approx": true},
            {"source": 5, "target": 8, "strip": false, "approx": true},
            {"source": 6, "target": 7, "strip": false, "approx": false},
            {"source": 6, "target": 8, "strip": false, "approx": true},
            {"source": 7, "target": 8, "strip": false, "approx": false}
        ]
    };

    let error = 20;

// todo: dynamic height and width (so range should also be dynamic)
    let height = 750;
    let width = 1000;
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);

    let svg = d3.select("#vizDemo > svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "border: 1px solid black")
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(0,0)";
        });

    let stripContainer = svg
        .append("g")
        .attr("id", "strip-container");

    let chainContainer = svg.append("g")
        .attr("id", "chain-container-1");

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
        let discs = stripContainer.selectAll("circle")
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

        let strips = stripContainer.selectAll("line")
            .data(data.edges)
            .enter()
            .append("line")
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
                    return xScale(error);
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
            });
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


    drawGraph();
    updateErrorDiscs();
}


let dag = drawDAG();
let dagShowEdges = false;
dag.drawGraph(dagShowEdges);

drawParallelStrip();
drawDiscsCones();
drawDemo();

function toggleDAGedges1() {
    dagShowEdges = !dagShowEdges;
    dag.drawGraph(dagShowEdges);
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'toggleDAGedges1') {
        toggleDAGedges1();
    }
});