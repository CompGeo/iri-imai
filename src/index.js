import * as bootstrap from 'bootstrap';
import * as d3 from 'd3';
import './styles/main.scss';
import cloneDeep from 'lodash/cloneDeep';
import {ShapeInfo, Intersection, IntersectionQuery} from "kld-intersections";
import "@babel/polyfill";


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
        .attr('refX', 50)
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
            if (!e.hasOwnProperty('shortestPath')){
                e.shortestPath = false;
            }
        });
    }

    function resetShortestPath(){
        data.edges.forEach(function (e) {
            e.shortestPath = false;
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
        // doesn't add nodes
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
        // doesn't add edges
        data.edges.forEach(function (n, idx, arr) {
            edgelist.forEach(function (u) {
                if (u.source === n.source && u.target === n.target) {

                    arr[idx] = Object.assign({}, n, cloneDeep(u));

                }
            });

        });

    }


    function gatherNeighbors(){
        /***
         * construct an adjacency list, prepare for a BFS
         */

        data.nodes.forEach(function(node, idx){
            let neighbors = [];

            data.edges.forEach(function(e){
                if (e.source === idx) {
                    if (!e.approx || e.show) {
                        neighbors.push(e.target);
                    }
                }
            });
            node.neighbors = neighbors;
            node.discovered = false;
        });

    }

    /***
     * adapted from stack overflow: https://stackoverflow.com/questions/32527026/shortest-path-in-javascript
     * @constructor
     */
    function bfs(){
        // reset edge state
        resetShortestPath();
        gatherNeighbors();
        //console.log(data.nodes);
        const source = 0;
        const target = data.nodes.length - 1;
        const queue = [source];

        let shortestPath = [];
        data.nodes[0].discovered = true;
        data.nodes[0].predecessor = {};
        let tail = 0;

        while (tail < queue.length){
            let u = queue[tail++];
            let neighbors = data.nodes[u].neighbors;
            neighbors.forEach(function(n){
                if (data.nodes[n].discovered){
                    return;
                }
                data.nodes[n].discovered = true;
                if (n === target){
                    let path = [n];
                    while (u !== source){
                        path.push(u);
                        u = data.nodes[u].predecessor;
                    }
                    path.push(u);
                    path.reverse();
                    shortestPath = path;
                    return;
                }
                data.nodes[n].predecessor = u;
                queue.push(n);
            })
        }

        return shortestPath;

    }

    function doShortestPath(){
        let shortestPath = bfs();
        //console.log(shortestPath);
        let path = [];
        for (let i = 0; i < shortestPath.length - 1; i++){
            path.push({
                source: shortestPath[i],
                target: shortestPath[i + 1],
                shortestPath: true
            })
        }

        updateEdges(path);

        drawGraph();
    }

    function generateAllApproxEdges() {

        const len = data.nodes.length;
        data.nodes.forEach(function (n, idx) {
            for (let i = 0; i < len; i++) {
                if (i > idx) {
                    let matches = data.edges.filter(function(e){
                        return e.source === idx && e.target === i;
                    });
                    if (matches.length === 0) {
                        data.edges.push({'source': idx, 'target': i, 'approx': true});
                    }
                }
            }
        });

        initializeFlags();
    }


    initializeFlags();

    function getEdges() {
        return data.edges.filter(function (e) {
            return (!e.approx) || (e.approx && e.show);
        });
    }

    function findEdgesToussaint() {
        const size = data.nodes.length;

        data.nodes.forEach(function (node, idx) {
            // maintain the intersection of all cones starting from this point
            // initialize with size of full screen
            let coneIntersection = [{x: xmin, y: ymin}, {x: xmin, y: ymax}, {x: xmax, y: ymax},
                {x: xmax, y: ymin}, {x: xmin, y: ymin}];
            if (idx < size) {
                for (let j = idx + 1; j < size; j++) {
                    let testNode = data.nodes[j];

                    // generate the new cone. for the visualization we want to include the cone that fails the test
                    let currentCone = generateDoubleCone(node, testNode);
                    if (node.hasOwnProperty('cones')) {
                        node.cones.push({"target": j, "geom": currentCone});
                    } else {
                        node.cones = [{"target": j, "geom": currentCone}];
                    }

                    // if data.nodes[j] intersects with currentCone, then add edge
                    let queryResult = IntersectionQuery.pointInPolygon(testNode.coordinates, coneIntersection);

                    if (!queryResult) {
                        break;
                    }
                    // add edge,if not already there
                    let matches = data.edges.filter(function (e) {
                        return e.source === idx && e.target === j;
                    });
                    if (matches.length === 0) {
                        data.edges.push({"source": idx, "target": j, "approx": true});
                    }

                    // intersect cone for node to data.nodes[j].
                    let intxResult = Intersection.intersectPolygonPolygon(coneIntersection, currentCone);
                    if (intxResult.status !== "Intersection") {
                        break;
                    }
                    coneIntersection = intxResult.points;
                }
            }
        });
    }

    function generateDoubleCone(node1, node2) {
        let p1 = node1.coordinates;
        let p2 = node2.coordinates;

        let points = [];
        let doubleCone = true;
        try {
            points = getDiscTangentPoints(p1, p2, node2.epsilon);
        } catch (e) {
            console.log('dont draw a cone');
            // one error disc intersects another
            doubleCone = false;
        }

        let polygon = [];
        if (!doubleCone) {
            // open cone == the whole plane
            polygon.push({x: xmin, y: ymin});
            polygon.push({x: xmin, y: ymax});
            polygon.push({x: xmax, y: ymax});
            polygon.push({x: xmax, y: ymin});
            polygon.push({x: xmin, y: ymin});

        } else {
            let pe1 = getExtremePointsForLine(p1, points[0]);
            let pe2 = getExtremePointsForLine(p1, points[1]);


            let ex_points = [pe1[0], pe1[1], pe2[0], pe2[1]];
            let forward = [];
            let backward = [];
            // gather segments on each side of p1 to construct cones as polylines
            ex_points.forEach(function (p) {
                if (pointIsOn(p1, p, points[0]) || pointIsOn(p1, p, points[1])) {

                    forward.push(p);
                } else {
                    backward.push(p);
                }
            });

            // need to maintain clockwise order, pair up points properly
            polygon.push({x: p1.x, y: p1.y});
            polygon.push({x: forward[0].x, y: forward[0].y});
            polygon.push({x: forward[1].x, y: forward[1].y});
            polygon.push({x: p1.x, y: p1.y});
            polygon.push({x: backward[0].x, y: backward[0].y});
            polygon.push({x: backward[1].x, y: backward[1].y});
            polygon.push({x: p1.x, y: p1.y});

        }

        return polygon;
    }

    function polygonToPolyline(polygon) {
        let pArr = [];
        polygon.forEach(function (pt) {
            pArr.push(xScale(pt.x) + ' ' + yScale(pt.y));
        });
        return pArr.join(', ');
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
                        if (d.shortestPath){
                            return "green";
                        } else if (d.approx) {
                            return "blue";
                        } else {
                            return "#000000";
                        }
                    })
                    .style("stroke-dasharray", function (d) {
                        if (d.approx && !d.shortestPath) {
                            return "2,2";
                        } else {
                            return "";
                        }
                    })
                    .style("stroke-width", function (d) {
                        if (d.approx && !d.shortestPath) {
                            return "1";
                        } else {
                            return "2";
                        }
                    })
                    .attr("marker-end", function (d) {
                        if (d.shortestPath){
                            return "";
                        } else if (d.approx) {
                            return "url(#bluearrow)";
                        } else {
                            return "url(#arrow)";
                        }
                    }),
                update => update
                    .attr("marker-end", "url(#arrow)"),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.remove())
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
                    .style("strokewidth", "1"),
                update => update
                    .attr("r", function (d) {
                        return d.disc ? d.epsilon : 0;
                    }),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.remove())
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
                    }),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.remove())
            );

        let coneData = data.edges.filter(function (i) {
            return i.cone
        });


        stripContainer.selectAll('polyline')
            .data(coneData)
            .join(
                enter => enter.append('polyline')
                    .attr('points', function (d) {
                        let sourceNode = data.nodes[d.source];
                        if (!sourceNode.hasOwnProperty('cones')) {
                            return "";
                        }
                        let polygon = "";
                        sourceNode.cones.forEach(function (c) {
                            if (c.target === d.target) {
                                polygon = c.geom;
                            }
                        });
                        return polygonToPolyline(polygon);
                    })
                    .style('stroke', 'black')
                    .style('stroke-width', "2")
                    .style('stroke-opacity', '100')
                    .style('fill', '#0000FF')
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

    /**
     * these 3 functions are ported and revised from python, Bryan Hayes's chapter in Beautiful Code
     * @param a
     * @param b
     * @param c
     */
    function pointIsBetween(a, b, c) {

        if (a.x !== b.x) {
            return within(a.x, c.x, b.x) && within(a.y, c.y, b.y);
        } else {
            return within(a.y, c.y, b.y);
        }
    }

    function pointIsOn(a, b, c) {
        //"Return true iff point c intersects the line segment from a to b.
        // (or the degenerate case that all 3 points are coincident)

        return (collinear(a, b, c) && pointIsBetween(a, b, c));
    }


    function collinear(a, b, c) {
        //"Return true iff a, b, and c all lie on the same line."
        let l1 = (b.x - a.x) * (c.y - a.y);
        let l2 = (c.x - a.x) * (b.y - a.y);
        return Math.abs(l1 - l2) < 1;
    }

    function within(p, q, r) {
        //"Return true iff q is between p and r (inclusive)."
        return ((p <= q) && (q <= r)) || ((r <= q) && (q <= p));
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

        let points = [];

        if (itx.top) {
            points.push({x: getXFromYForLine(p1, p2, eymax), y: eymax});
        }

        if (itx.bottom) {
            points.push({x: getXFromYForLine(p1, p2, eymin), y: eymin});
        }

        if (itx.left) {
            points.push({x: exmin, y: getYFromXForLine(p1, p2, exmin)});
        }

        if (itx.right) {
            points.push({x: exmax, y: getYFromXForLine(p1, p2, exmax)});
        }

        if (points.length !== 2) {
            console.log(points);
            throw new Error('wrong number of points!');
        }

        return points;
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
        let eps = xScale.invert(err);
        if (eps >= d) {
            throw new Error('circles are too close!');
        }
        let c1 = ShapeInfo.circle({center: {x: p1.x, y: p1.y}, radius: d});
        let c2 = ShapeInfo.circle({center: {x: p2.x, y: p2.y}, radius: eps});
        let itx = Intersection.intersect(c2, c1);

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

    function pruneIriImai(){
        hideApprox();
        drawGraph();
        data.edges.forEach(function(edge, idx){
            if (edge.approx){
                // if the edge is an approximate one, do iri-imai error test, mark show = false if failed.
                //console.log(edge);
                // should be the number of nodes skipped
                //console.log(edge.target - edge.source);
                let keep_edge = false;
                let num_skipped = edge.target - edge.source;
                let srcNode = data.nodes[edge.source];
                let tgtNode = data.nodes[edge.target];

                for (let i=1; i < num_skipped; i++){
                    //console.log('inner index');
                    //console.log(i);
                    // node skipped by edge
                    let skipped_idx = i + edge.source;
                    let node = data.nodes[skipped_idx];

                    let d = pointToLineDistance(node.coordinates, srcNode.coordinates, tgtNode.coordinates);
/*                    console.log('distance to edge');
                    console.log('srcNode:' + edge.source);
                    console.log('tgtNode:' + edge.target);
                    console.log('skipped node:' + skipped_idx);
                    console.log([d, edge.epsilon]);*/
                    if (d > edge.epsilon){
                        keep_edge = keep_edge && false;
                        break;
                    } else {
                        keep_edge = true;
                    }
                }

                if (keep_edge){
                    edge.show = true;
                } else {
                    edge.show = false;
                }

            }

        });

        drawGraph();
    }

    function drawDiscsFromSource(srcIdx) {
        data.nodes.forEach(function (n, idx) {
            if (idx > srcIdx) {
                n.disc = true;
            } else {
                n.disc = false;
            }
        });
    }

    function clearCones() {
        data.edges.forEach(function (e, idx) {
            e.cone = false;
        });
    }

    function drawConeFromSource(srcIdx, tgtIdx) {
        data.edges.forEach(function (e, idx) {
            if (e.source === srcIdx && e.target === tgtIdx){
                e.cone = true;
            }
        });
    }

    return {
        draw: drawGraph,
        updateNodes: updateNodes,
        updateEdges: updateEdges,
        updateError: updateError,
        showApproximation: showApprox,
        hideApproximation: hideApprox,
        getShortestPath: doShortestPath,
        generateAllApproxEdges: generateAllApproxEdges,
        pruneIriImai: pruneIriImai,
        resetShortestPath: resetShortestPath,
        drawDiscsFromSource: drawDiscsFromSource,
        clearCones: clearCones,
        drawConeFromSource: drawConeFromSource,
        findEdgesToussaint: findEdgesToussaint,
        data: data
    }
}


/**
 *
 * @param c     control set
 */
function setControlState(c) {

    if (!hasPrev(c)) {
        document.getElementById(c.backward).disabled = true;
        document.getElementById(c.rewind).disabled = true;

    } else {
        if (!c.allDisabled) {
            document.getElementById(c.backward).disabled = false;
            document.getElementById(c.rewind).disabled = false;
        }

    }
    if (!hasNext(c)) {
        document.getElementById(c.forward).disabled = true;
        document.getElementById(c.fastforward).disabled = true;

    } else {
        if (!c.allDisabled) {
            document.getElementById(c.forward).disabled = false;
            document.getElementById(c.fastforward).disabled = false;
        }

    }
}

/*
Step controls
 */

/**
 *
 * @param c
 * @param isDisabled
 */
function setAllControls(c, isDisabled) {
    c.allDisabled = isDisabled;
    document.getElementById(c.backward).disabled = isDisabled;
    document.getElementById(c.rewind).disabled = isDisabled;
    document.getElementById(c.forward).disabled = isDisabled;
    document.getElementById(c.fastforward).disabled = isDisabled;
}

/**
 *
 * @param c     control set
 */
function disableControls(c) {
    setAllControls(c, true);
}

function enableControls(c) {
    setAllControls(c, false);
}

function showStep(state) {
    return new Promise(function (resolve, reject) {
        let textCard = document.getElementById(state.messageEl);
        let step = state.steps[state.stepIndex];
        textCard.textContent = step.message;
        step.action.call();

        state.viz.draw();
        resolve();
    });
}

function incrStepIndex(controls) {
    controls.stepIndex += 1;
    let numSteps = controls.steps.length;
    if (controls.stepIndex >= numSteps - 1) {
        controls.stepIndex = numSteps - 1;
    } else if (controls.stepIndex < 0) {
        controls.stepIndex = 0;
    }
    return controls.stepIndex;
}

function decrStepIndex(controls) {
    controls.stepIndex -= 1;
    let numSteps = controls.steps.length;
    if (controls.stepIndex >= numSteps - 1) {
        controls.stepIndex = numSteps - 1;
    } else if (controls.stepIndex < 0) {
        controls.stepIndex = 0;
    }
    return controls.stepIndex;
}

function hasNext(controls) {
    return controls.stepIndex < controls.steps.length - 1;
}

function hasPrev(controls) {
    return controls.stepIndex > 0;
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function getSequence(viz) {
    let stepScript = [];
    if (viz.state.stepIndex < 0) {
        viz.state.stepIndex = 0;
    }
    viz.state.stepIndex += 1;

    do {
        stepScript.push(viz.state.stepIndex);


    } while (viz.hasNext() && (viz.state.stepIndex += 1));
    return stepScript;
}

function genericTransportHandler(e, viz) {
    let controls = viz.state;

    if (e.target && e.target.id === controls.forward) {
        if (viz.hasNext()) {
            viz.getNext();
        }
    }
    if (e.target && e.target.id === controls.backward) {
        if (viz.hasPrev()) {
            viz.getPrev();
        }
    }
    if (e.target && e.target.id === controls.rewind) {

        viz.showFirst();

    }
    if (e.target && e.target.id === controls.fastforward) {
        let stepScript = getSequence(viz);

        disableControls(controls);

        stepScript.reduce((promiseChain, currentIdx) => {
            return promiseChain.then(function (chainResults) {
                return sleep(2000).then(viz.getStep(currentIdx))
            });
        }, Promise.resolve([])).then(arrayOfResults => {
            enableControls(controls);
        });
    }
}


/*
viz 1 methods
 */

const DagVisualization = function (params) {

    let viz = drawExampleViz(params.vizEl, params.data, params.error, params.h, params.w);
    viz.generateAllApproxEdges();
    viz.draw();

    let self = this;


    this.getStep = function (idx) {
        self.state.stepIndex = idx;
        viz.resetShortestPath();
        return showStep(self.state);
    };

    this.hasNext = function () {
        return hasNext(self.state);
    };

    this.hasPrev = function () {
        return hasPrev(self.state);
    };

    this.getNext = function () {
        let nextIdx = incrStepIndex(self.state);
        setControlState(self.state);
        return self.getStep(nextIdx);
    };

    this.getPrev = function () {
        let prevIdx = decrStepIndex(self.state);
        setControlState(self.state);

        return self.getStep(prevIdx);
    };

    this.showFirst = function () {
        viz.resetShortestPath();
        self.state.stepIndex = 0;
        setControlState(self.state);
        return showStep(self.state);
    };


    this.clickHandler = function (e) {
        genericTransportHandler(e, self);
    };


    this.state = {
        rewind: "rewindDAGedges1",
        backward: "backwardDAGedges1",
        forward: "forwardDAGedges1",
        fastforward: "ffDAGedges1",
        allDisabled: false,
        stepIndex: 0,
        messageEl: "message-dag-1",
        viz: viz,
        steps: [
            {
                'step': 0,
                'message': 'Model the polygonal chain as a directed acyclic graph (DAG).',
                'action': viz.hideApproximation
            },
            {
                'step': 1,
                'message': 'Examine all possible edges (in blue) from each vertex in the chain. Notice that potential edges will skip some number of vertices.',
                'action': viz.showApproximation
            },
            {
                'step': 2,
                'message': 'Remove any potential edges that are too far away (greater than \u03B5) from any of the vertices that they skip. This example uses the perpendicular distance from a skipped point to a potential edge as a measure of error.',
                'action': viz.pruneIriImai
            },
            {
                'step': 3,
                'message': 'Calculate the shortest path using the remaining edges. This example uses a breadth first search to find the shortest path. The result (in green) is the simplified polygonal chain that minimizes the number of edges.',
                'action': viz.getShortestPath
            }
        ]
    };

    this.showFirst();
};


function parallelStripVisualization(params) {

    params.data.edges.push({"source": 2, "target": 7, "strip": true, "approx": true, "show": true});
    let viz = drawExampleViz(params.vizEl, params.data, params.error, params.h, params.w);
    //viz.draw();
    let stripNodes = [
        {"coordinates": {"x": 25, "y": 41}, "disc": true},
        {"coordinates": {"x": 40, "y": 45}, "disc": true},
        {"coordinates": {"x": 50, "y": 41}, "disc": true},
        {"coordinates": {"x": 60, "y": 45}, "disc": true}];
    viz.updateNodes(stripNodes);

    viz.draw();

    let striprange = document.getElementById('epsilonRange_strip');
    striprange.value = params.error;
    let stripeps = document.getElementById("strip-epsilon");
    stripeps.textContent = striprange.value;
    let updateStrips = function (e) {
        if (e.target) {
            stripeps.textContent = e.target.value;
            viz.updateError(e.target.value);
            viz.draw();
        }
    };

    ["input"].map(ev => striprange.addEventListener(ev, updateStrips, false));

}

const ConeVisualization = function (params) {

    let viz = drawExampleViz(params.vizEl, params.data, params.error, params.h, params.w);
    viz.findEdgesToussaint();
    console.log(viz.data);
    viz.draw();

    let self = this;

    this.getStep = function (idx) {
        self.state.stepIndex = idx;
        viz.resetShortestPath();
        return showStep(self.state);
    };

    this.hasNext = function () {
        return hasNext(self.state);
    };

    this.hasPrev = function () {
        return hasPrev(self.state);
    };

    this.getNext = function () {
        let nextIdx = incrStepIndex(self.state);
        setControlState(self.state);
        return self.getStep(nextIdx);
    };

    this.getPrev = function () {
        let prevIdx = decrStepIndex(self.state);
        setControlState(self.state);

        return self.getStep(prevIdx);
    };

    this.showFirst = function () {
        viz.resetShortestPath();
        self.state.stepIndex = 0;
        setControlState(self.state);
        return showStep(self.state);
    };


    this.clickHandler = function (e) {
        genericTransportHandler(e, self);
    };

    this.state = {
        rewind: "rewindConeedges1",
        backward: "backwardConeedges1",
        forward: "forwardConeedges1",
        fastforward: "ffConeedges1",
        allDisabled: false,
        stepIndex: 0,
        messageEl: "message-cone-1",
        viz: viz,
        steps: [
            {
                'step': 0,
                'message': 'Draw a double cone from the starting vertex that is defined by the tangent line from the vertex to error disc of the target vertex.',
                'action': function () {
                    viz.clearCones();
                    viz.drawConeFromSource(0, 1);
                }
            },
            {
                'step': 1,
                'message': 'Keep drawing cones from the starting vertex to each successive error disc. Keep an edge if all the vertices in between the source vertex and target vertex lie in the intersection of all the cones.',
                'action': function () {
                    viz.clearCones();
                    viz.drawConeFromSource(0, 1);
                    viz.drawConeFromSource(0, 2);
                }
            },
            {
                'step': 2,
                'message': 'Keep drawing cones from the starting vertex to each successive error disc. Keep an edge if all the vertices in between the source vertex and target vertex lie in the intersection of all the cones.',
                'action': function () {
                    viz.clearCones();
                    viz.drawConeFromSource(0, 1);
                    viz.drawConeFromSource(0, 2);
                    viz.drawConeFromSource(0, 3);
                }
            }
        ]
    }

    this.showFirst();

};


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

let dagViz = new DagVisualization({
    vizEl: "#vizDAG",
    data: cloneDeep(demoData),
    error: 10,
    h: 500,
    w: 500
});


/*
parallel strip viz
 */

let stripViz = parallelStripVisualization({
    vizEl: "#vizStrip",
    data: cloneDeep(demoData),
    error: 10,
    h: 500,
    w: 500
});


/*
cones viz
 */
let coneViz = new ConeVisualization({
    vizEl: "#vizCones",
    data: cloneDeep(demoData),
    error: 25,
    h: 500,
    w: 500
});

coneViz.state.viz.drawDiscsFromSource(0);
coneViz.state.viz.draw();


//let demo = drawExampleViz("#vizDemo", cloneDeep(demoData), error, 750, 1000);
//demo.draw();


/*
Event handlers
 */



document.addEventListener('click', function (e) {
    dagViz.clickHandler(e);
    coneViz.clickHandler(e);
});