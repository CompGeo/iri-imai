import * as bootstrap from 'bootstrap';
import * as d3 from 'd3';
import './styles/main.scss';
import cloneDeep from 'lodash/cloneDeep';
import {ShapeInfo, Intersection} from "kld-intersections";


function drawExampleViz(el, data, error, height, width) {
    const ymin = 0;
    const xmin = 0;
    const ymax = 100;
    const xmax = 100;
    const xScale = d3.scaleLinear().domain([xmin, xmax]).range([0, width]);
    const yScale = d3.scaleLinear().domain([ymax, ymin]).range([0, height]);

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
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return xScale(pts[0][0]);
                    })
                    .attr("y1", function (d) {
                        if (!d.strip) return null;
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return yScale(pts[0][1]);
                    })
                    .attr("x2", function (d) {
                        if (!d.strip) return null;
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return xScale(pts[1][0]);
                    })
                    .attr("y2", function (d) {
                        if (!d.strip) return null;
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return yScale(pts[1][1]);
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

        let coneData = data.edges.filter(function (i) {
            return i.cone
        });


        stripContainer.selectAll('polyline')
            .data(coneData)
            .join(
                enter => enter.append('polyline')
                    .attr('points', function (d) {
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;
                        let points = getDiscTangentPoints(p1, p2, d.epsilon);

                        let pe1 = getExtremePointsForLine(p1, points[0]);
                        let pe2 = getExtremePointsForLine(p1, points[1]);

                        console.log('extreme points!!!!!');
                        console.log(pe1);
                        console.log(pe2);
                        let trianglePoints = xScale(p1.x) + ' ' + yScale(p1.y) + ', ' + xScale(pe1[1].x) + ' ' + yScale(pe1[1].y) + ', ';
                        trianglePoints += xScale(pe2[1].x) + ' ' + yScale(pe2[1].y) + ', ' + xScale(p1.x) + ' ' + yScale(p1.y);
                        // let trianglePoints2 = xScale(p1.x) + ' ' + yScale(p1.y) + ', ';
                        trianglePoints += ', ' + xScale(pe1[0].x) + ' ' + yScale(pe1[0].y) + ', ';
                        trianglePoints += xScale(pe2[0].x) + ' ' + yScale(pe2[0].y) + ', ' + xScale(p1.x) + ' ' + yScale(p1.y);
                        console.log(trianglePoints);
                        return trianglePoints;
                    })
                    .style('stroke', 'blue')
                    .style('stroke-width', "1")
                    .style('stroke-opacity', '1')
                    .style('fill', 'blue')
                    .style('opacity', '0.2'),
                update => update
                    .call(update => update.transition(t)
                        .attr("x", (d, i) => i * 16)),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.transition(t)
                        .attr("y", 30)
                        .remove())
            );

    }

    function testEdgeIntersections(p1, p2) {
        // which borders does the line given by these points intersect?
        let leftX = false;
        let rightX = false;
        let topY = false;
        let bottomY = false;

        let xTopY = getXFromYForLine(p1, p2, ymax);
        console.log(xTopY);
        if ((xTopY <= xmax) && (xTopY >= xmin)) {
            // intersect top boundary in range
            topY = true;
        }

        let xBottomY = getXFromYForLine(p1, p2, ymin);
        console.log(xBottomY);
        if (((xBottomY <= xmax) && (xBottomY >= xmin))) {
            // intersects bottom boundary in range
            bottomY = true;
        }

        let yLeftX = Math.floor(getYFromXForLine(p2, p1, xmin));
        console.log(yLeftX);
        if (((yLeftX <= ymax) && (yLeftX >= ymin))) {
            // intersect left boundary in range
            leftX = true;
        }

        let yRightX = Math.floor(getYFromXForLine(p1, p2, xmax));
        console.log(yRightX);
        if (((yRightX <= ymax) && (yRightX >= ymin))) {
            // intersect right boundary in range
            rightX = true;
        }

        return {
            left: leftX,
            right: rightX,
            top: topY,
            bottom: bottomY
        }

    }

    function getYFromXForLine(p1, p2, x) {
        return (x * (p1.y - p2.y) - (p2.x * p1.y) + (p1.x * p2.y)) / (p1.x - p2.x)
    }

    function getXFromYForLine(p1, p2, y) {
        return (y * (p1.x - p2.x) - (p1.x * p2.y) + (p2.x * p1.y)) / (p1.y - p2.y);
    }


    function getEdgePointsForLine(p1, p2) {
        let eymin = ymin;
        let exmin = xmin;
        let eymax = ymax;
        let exmax = xmax;

        if (isVertical(p1, p2)) {
            return [[p1.x, eymin], [p1.x, eymax]];
        }
        if (isHorizontal(p1, p2)) {
            return [[exmin, p1.y], [exmax, p1.y]];
        }

        let itx = testEdgeIntersections(p1, p2);
        if (itx.top && itx.left) {
            return [[exmin, getYFromXForLine(p1, p2, exmin)], [getXFromYForLine(p1, p2, eymax), eymax]];
        } else if (itx.top && itx.right) {
            return [[getXFromYForLine(p1, p2, eymax), eymax], [exmax, getYFromXForLine(p1, p2, exmax)]];
        } else if (itx.top & itx.bottom) {
            return [[getXFromYForLine(p1, p2, eymax), eymax], [getXFromYForLine(p1, p2, eymin), eymin]];
        } else if (itx.left && itx.right) {
            return [[exmin, getYFromXForLine(p1, p2, exmin)], [xmax, getYFromXForLine(p1, p2, exmax)]];
        } else if (itx.left && itx.bottom) {
            return [[exmin, getYFromXForLine(p1, p2, exmin)], [getXFromYForLine(p1, p2, eymin), eymin]];
        } else if (itx.right && itx.bottom) {
            return [[getXFromYForLine(p1, p2, eymin), eymin], [exmax, getYFromXForLine(p1, p2, exmax)]];
        } else {
            console.log('no itx?');
            console.log(itx);
        }
    }

    function getExtremePointsForLine(p1, p2) {

        let eymin = -100;
        let exmin = -100;
        let eymax = 200;
        let exmax = 200;

        if (isVertical(p1, p2)) {
            return [{x: p1.x, y: eymin}, {x: p1.x, y: eymax}];
        }
        if (isHorizontal(p1, p2)) {
            return [{x: exmin, y: p1.y}, {x: exmax, y: p1.y}];
        }

        let itx = testEdgeIntersections(p1, p2);
        console.log(itx);
        // todo: order matters here. think it through.
        if (itx.top && itx.left) {
            return [{x: getXFromYForLine(p1, p2, eymax), y: eymax}, {x: exmin, y: getYFromXForLine(p1, p2, exmin)}];
        } else if (itx.top && itx.right) {
            return [{x: getXFromYForLine(p1, p2, eymax), y: eymax}, {x: exmax, y: getYFromXForLine(p1, p2, exmax)}];
        } else if (itx.top & itx.bottom) {
            return [{x: getXFromYForLine(p1, p2, eymax), y: eymax}, {x: getXFromYForLine(p1, p2, eymin), y: eymin}];
        } else if (itx.left && itx.right) {
            return [{x: exmin, y: getYFromXForLine(p1, p2, exmin)}, {x: xmax, y: getYFromXForLine(p1, p2, exmax)}];
        } else if (itx.left && itx.bottom) {
            return [{x: exmin, y: getYFromXForLine(p1, p2, exmin)}, {x: getXFromYForLine(p1, p2, eymin), y: eymin}];
        } else if (itx.right && itx.bottom) {
            return [{x: getXFromYForLine(p1, p2, eymin), y: eymin}, {x: exmax, y: getYFromXForLine(p1, p2, exmax)}];
        } else {
            console.log('no itx?');
            console.log(itx);
        }
    }

    function isVertical(p1, p2) {
        return (p2.x - p1.x) === 0;
    }

    function isHorizontal(p1, p2) {
        return (p2.y - p1.y) === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }

    function pointToLineDistance(pd, p1, p2) {
        /**
         * pd is the point not on the line
         * p1 and p2 are points that define the line.
         * @type {number}
         */
            // ax + by + c  = 0
            //
        const a = p1.y - p2.y;
        const b = p2.x - p1.x;
        const c = (p1.x * p2.y) - (p2.x * p1.y);

        return Math.abs((a * pd.x + b * pd.y + c)) / (Math.sqrt(a * a + b * b))
    }

    function euclideanDistance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    }


    function getDiscTangentPoints(p1, p2, err) {
        /**
         *
         */
            //console.log('inv error');
            //console.log(xScale.invert(err));
        let d = euclideanDistance(p1, p2);
        let c1 = ShapeInfo.circle({center: {x: p1.x, y: p1.y}, radius: d});
        let c2 = ShapeInfo.circle({center: {x: p2.x, y: p2.y}, radius: xScale.invert(err)});
        let itx = Intersection.intersect(c2, c1);
        console.log('int');
        console.log(itx);
        console.log(d);
        console.log(err);
        return itx.points;
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

let striprange = document.getElementById('epsilonRange_strip');
striprange.value = error;
let stripeps = document.getElementById("strip-epsilon");
stripeps.textContent = striprange.value;
let updateStrips = function (e) {
    if (e.target) {
        stripeps.textContent = e.target.value;
        strip.updateError(e.target.value);
        strip.drawGraph();
    }
};
striprange.addEventListener('change', updateStrips);
striprange.addEventListener('input', updateStrips);


let dataCones = cloneDeep(demoData);
let updateCones = {
    "nodes": [
        {"coordinates": {"x": 20, "y": 55}, "disc": true},
        {"coordinates": {"x": 19, "y": 37}, "disc": true},
        {"coordinates": {"x": 25, "y": 41, "disc": true}}

    ],
    "edges": [
        {"source": 0, "target": 1, "cone": true, "show": true},
        {"source": 1, "target": 2, "cone": true, "show": true}
    ]
};

let cones = drawExampleViz("#vizCones", dataCones, 25, height, width);
cones.updateNodes(updateCones.nodes);
cones.updateEdges(updateCones.edges);
cones.drawGraph();
//drawDiscsCones();

let demo = drawExampleViz("#vizDemo", cloneDeep(demoData), error, 750, 1000);
demo.drawGraph();
