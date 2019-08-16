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

    function mousedown() {
        let point = d3.mouse(this);
        let node = {"coordinates": {"x": xScale.invert(point[0]), "y": yScale.invert(point[1])}};
        let prevLen = data.nodes.length;
        data.nodes.push(node);

        // add edges
        if (data.nodes.length > 1) {
            let test = {"source": prevLen - 1, "target": prevLen};
            let match = data.edges.filter(function (e) {
                return e.source === test.source && e.target === test.target;
            });
            if (match.length === 0) {
                data.edges.push(test);
            }
        }

        drawGraph();
    }

    function enableInput() {
        svg.on('click', mousedown);
    }

    function disableInput() {
        initializeFlags();
        svg.on('click', null);
    }

    function clearNodes() {
        data = {
            "nodes": [],
            "edges": []
        };
        drawGraph();
    }

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

    function dotProduct(a, b, c) {
        // (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax)
        return ((b.x - a.x) * (c.y - a.y)) - ((b.y - a.y) * (c.y - a.y));
    }

    function isPointBetweenLines(line1pt1, line1pt2, line2pt1, line2pt2, testPoint, validationPoint) {
        // (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax)
        let a = dotProduct(line1pt1, line1pt2, validationPoint) < 0;
        let b = dotProduct(line2pt1, line2pt2, validationPoint) < 0;

        let a2 = dotProduct(line1pt1, line1pt2, testPoint) < 0;
        let b2 = dotProduct(line2pt1, line2pt2, testPoint) < 0;

        return a === a2 && b === b2;
    }

    function intersectCones(cone1, cone2) {
        if (cone1.empty || cone2.empty) {
            return cone2;
        }
        if (cone1.isPlane && cone2.isPlane) {
            return cone2;
        }
        if (cone1.isPlane) {
            return cone2;
        }
        if (cone2.isPlane) {
            return cone1;
        }

        let cone2_1_between = isPointBetweenLines(cone1.source, cone1.tanPts[0],
            cone1.source, cone1.tanPts[1],
            cone2.tanPts[0], cone1.validator);
        let cone2_2_between = isPointBetweenLines(cone1.source, cone1.tanPts[0],
            cone1.source, cone1.tanPts[1],
            cone2.tanPts[0], cone1.validator);

        if (cone2_1_between && cone2_2_between) {
            // case 1. cone2 is within cone1.
            return cloneDeep(cone2);
        } else if (cone2_1_between || cone2_2_between) {

            let cone1_1_between = isPointBetweenLines(cone1.source, cone2.tanPts[0],
                cone1.source, cone2.tanPts[1],
                cone1.tanPts[0], cone2.validator);
            let cone1_2_between = isPointBetweenLines(cone1.source, cone2.tanPts[0],
                cone1.source, cone2.tanPts[1],
                cone1.tanPts[1], cone2.validator);

            let newValid = {
                x: (cone1.validator.x + cone2.validator.x) / 2,
                y: (cone1.validator.y + cone2.validator.y) / 2
            };
            let coneOut = {source: cone2.source, validator: newValid, tanPts: [], isPlane: false};
            if (cone2_1_between) {
                // the first cone2 line is between the cone 1 lines. we need to determine which of the cone 1 lines is
                // between the cone 2 lines
                coneOut.tanPts.push(cone2.tanPts[0]);

            } else {
                coneOut.tanPts.push(cone2.tanPts[1]);
            }

            if (cone1_1_between) {
                coneOut.tanPts.push(cone1.tanPts[0]);

                return coneOut;
            } else if (cone1_2_between) {
                coneOut.tanPts.push(cone1.tanPts[1]);
                return coneOut;
            }

        } else {
            // no intersection
            return {empty: true}
        }
    }

    function findEdgesToussaint() {

        // clear any previous cone values
        data.nodes.forEach(function (node) {
            if (node.hasOwnProperty('cones')) {
                node.cones = [];
            }
        });
        const size = data.nodes.length;

        data.nodes.forEach(function (node, sourceIdx) {

            //let bConeIntersection = null;
            //let fConeIntersection = null;

            // start with open cone
            let currentCone = {isPlane: true};
            let currentConeGeom = [];

            // maintain all cones starting from this point, so we can test intersection
            let allfCones = [];
            let allbCones = [];

            // don't process the last point as a source
            if (sourceIdx < size) {
                // index of target points
                for (let j = sourceIdx + 1; j < size; j++) {

                    // we will test this node to see if it is in the intersection of all cones
                    let targetNode = data.nodes[j];

                    let queryResultF = true;
                    let queryResultB = true;

                    if (currentCone.isPlane) {
                        // plane intersects with everything, but we don't need to add to the all cones list
                        queryResultF = true;
                    } else {
                        // we're storing the geometry of current cone in all cones
                        allfCones.forEach(function (fcone) {
                            queryResultF = queryResultF && IntersectionQuery.pointInPolygon(targetNode.coordinates, fcone);
                        });
                    }

                    if (currentCone.isPlane) {
                        queryResultB = true;
                    } else {
                        allbCones.forEach(function (bcone) {
                            queryResultB = queryResultB && IntersectionQuery.pointInPolygon(targetNode.coordinates, bcone);
                        });
                    }

                    let geom = getGeomFromCone(currentCone);
                    let displayGeom = cloneDeep(geom);
                    if (!currentCone.isPlane) {
                        displayGeom[0].pop();
                        if (node.hasOwnProperty('cones')) {
                            node.cones.push({
                                "target": j,
                                "geom": displayGeom[0].concat(displayGeom[1]),
                                "intx": queryResultF || queryResultB,
                                "coneInt": []
                            });
                        } else {
                            node.cones = [{
                                "target": j,
                                "geom": displayGeom[0].concat(displayGeom[1]),
                                "intx": queryResultF || queryResultB,
                                "coneInt": []
                            }];
                        }
                    } else {
                        //console.log('plane');
                        //console.log(displayGeom[0]);
                        // don't show planes
                        if (node.hasOwnProperty('cones')) {
                            node.cones.push({
                                "target": j,
                                "geom": [],
                                "intx": true,
                                "coneInt": []
                            });
                        } else {
                            node.cones = [{
                                "target": j,
                                "geom": [],
                                "intx": true,
                                "coneInt": []
                            }];
                        }
                    }


                    if (!queryResultF && !queryResultB) {
                        break;
                    }
                    // add edge, if intersection and not already there
                    let matches = data.edges.filter(function (e) {
                        return e.source === sourceIdx && e.target === j;
                    });
                    if (matches.length === 0) {
                        data.edges.push({
                            "source": sourceIdx,
                            "target": j,
                            "approx": true,
                            "keep": true,
                            "show": false
                        });
                    }

                    // generate the new cone. for the visualization we want to include the cone that fails the test
                    // update the current cone
                    currentCone = generateDoubleCone(node, targetNode);

                    if (!currentCone.isPlane) {
                        allfCones.push(cloneDeep(currentCone.geom[0]));
                        allbCones.push(cloneDeep(currentCone.geom[1]));
                    }
                    // intersect cone for node to data.nodes[j].
                    /*                    let bIntxResult = false;
                                        if (bConeIntersection === null) {
                                            bIntxResult = {
                                                status: "Intersection",
                                                points: currentCone.geom[0]
                                            };
                                        } else {
                                            bIntxResult = Intersection
                                                .intersect(ShapeInfo.polygon(bConeIntersection), ShapeInfo.polygon(currentCone.geom[1]));
                                        }

                                        let fIntxResult = false;
                                        if (fConeIntersection === null) {
                                            fIntxResult = {
                                                status: "Intersection",
                                                points: currentCone.geom[1]
                                            };
                                        } else {
                                            fIntxResult = Intersection
                                                .intersect(ShapeInfo.polygon(fConeIntersection), ShapeInfo.polygon(currentCone.geom[0]));
                                        }
                                        if (bIntxResult.status === "No Intersection" && fIntxResult.status === "No Intersection") {
                                            break;
                                        }
                                        bConeIntersection = bIntxResult.points;
                                        fConeIntersection = fIntxResult.points;

                                        allfCones.push(currentCone.geom[0]);
                                        allbCones.push(currentCone.geom[1]);*/
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
            console.log(e);
            // one error disc intersects another
            doubleCone = false;
        }

        let geom = getGeomFromCone({
            source: p1,
            validator: p2,
            tanPts: points,
            isPlane: !doubleCone,
            empty: false
        });

        return {
            source: p1,
            validator: p2,
            tanPts: points,
            isPlane: !doubleCone,
            empty: false,
            geom: geom
        };
    }

    /*    let reflected = [];
        function getRefl(){
            data.edges.forEach(function(e){
                if (e.approx){
                    return;
                }
                let extended = getExtremePointsForLine(data.nodes[e.source].coordinates, data.nodes[e.target].coordinates);
               reflected.push(getReflectedPoint(data.nodes[e.source].coordinates, data.nodes[e.target].coordinates, extended));
            });
        }
        getRefl();
        let refvertices = vizContainer.append('g')
            .selectAll("circle")
            .data(reflected)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return xScale(d.x);
            })
            .attr("cy", function (d) {
                return yScale(d.y);
            })
            .attr("r", 5)
            .style("fill", function (d) {
                return "#00ffff";
            });*/


    function getWedges(coneInfo) {
        let pe1 = getEdgePointsForLine(coneInfo.source, coneInfo.tanPts[0]);
        let pe2 = getEdgePointsForLine(coneInfo.source, coneInfo.tanPts[1]);

        console.log(pe1);
        let ex_points = [pe1[0], pe1[1], pe2[0], pe2[1]];
        let forward = [];
        let backward = [];
        // gather segments on each side of p1 to construct cones as polylines
        ex_points.forEach(function (p) {
            if (pointIsOn(coneInfo.source, p, coneInfo.tanPts[0]) ||
                pointIsOn(coneInfo.source, p, coneInfo.tanPts[1])) {

                forward.push(p);
            } else {
                backward.push(p);
            }
        });
        let forw_sorted = [];
        let a = (dotProduct(coneInfo.source, forward[0], coneInfo.validator)) < 0 ? -1 : 1;
        let b = (dotProduct(forward[0], forward[1], coneInfo.validator)) < 0 ? -1 : 1;
        let c = (dotProduct(forward[1], coneInfo.source, coneInfo.validator)) < 0 ? -1 : 1;
        console.log(a + b + c);
        if (((a + b + c) === 3) || ((a + b + c) === -3)) {
            forw_sorted = forward;
        } else {
            console.log('reversed forward');
            forw_sorted = [forward[1], forward[0]];
            let a2 = (dotProduct(coneInfo.source, forw_sorted[0], coneInfo.validator)) < 0 ? -1 : 1;
            let b2 = (dotProduct(forw_sorted[0], forw_sorted[1], coneInfo.validator)) < 0 ? -1 : 1;
            let c2 = (dotProduct(forw_sorted[1], coneInfo.source, coneInfo.validator)) < 0 ? -1 : 1;

            if (((a2 + b2 + c2) === 3) || ((a2 + b2 + c2) === -3)) {
            } else {
                console.log(a2 + b2 + c2);
                console.log(coneInfo);
                console.log(forw_sorted);
            }
        }

        let back_sorted = [];
        let extended = getEdgePointsForLine(coneInfo.source, coneInfo.validator);

        let pt = getOppositePoint(coneInfo.source, coneInfo.validator, extended);

        let x = (dotProduct(coneInfo.source, backward[0], pt)) < 0 ? -1 : 1;
        let y = (dotProduct(backward[0], backward[1], pt)) < 0 ? -1 : 1;
        let z = (dotProduct(backward[1], coneInfo.source, pt)) < 0 ? -1 : 1;
        console.log(x + y + z);
        if (((x + y + z) === 3) || ((x + y + z) === -3)) {
            back_sorted = backward;
        } else {
            console.log('reversed backward');
            back_sorted = [backward[1], backward[0]];
            let x2 = (dotProduct(coneInfo.source, back_sorted[0], pt)) < 0 ? -1 : 1;
            let y2 = (dotProduct(back_sorted[0], back_sorted[1], pt)) < 0 ? -1 : 1;
            let z2 = (dotProduct(back_sorted[1], coneInfo.source, pt)) < 0 ? -1 : 1;
            if (((x2 + y2 + z2) === 3) || ((x2 + y2 + z2) === -3)) {

            } else {
                console.log(x2 + y2 + z2);
                console.log(coneInfo);
                console.log(back_sorted);
            }

        }


        return {
            source: coneInfo.source,
            forward: forw_sorted,
            backward: back_sorted
        }
    }

    function getSign(polygon, interiorPt) {
        let sign = 1;
        if (dotProduct(polygon[0], polygon[1], interiorPt) < 0) {
            sign = -1;
        }
        for (let i = 0; i < polygon.length - 1; i++) {

            if (sign === 1) {
                if (dotProduct(polygon[i], polygon[i + 1], interiorPt) < 0) {
                    console.log('segment');
                    console.log(polygon[i], polygon[i + 1]);
                    console.log(interiorPt);
                    throw new Error('point shoud be interior');
                }
            } else {
                if (dotProduct(polygon[i], polygon[i + 1], interiorPt) > 0) {
                    console.log('segment');
                    console.log(polygon[i], polygon[i + 1]);
                    console.log(interiorPt);
                    throw new Error('point shoud be interior');
                }
            }

        }
        return sign;
    }

    function getGeomFromCone(coneInfo) {
        let polygon = [];
        if (coneInfo.isPlane) {
            // open cone == the whole plane
            let plane = [{x: xmin, y: ymin},
                {x: xmin, y: ymax},
                {x: xmax, y: ymax},
                {x: xmax, y: ymin},
                {x: xmin, y: ymin}];

            polygon = ([plane, plane]);

            let planeQuery = IntersectionQuery.pointInPolygon({x: xmax / 2, y: ymax / 2}, plane);
            if (!planeQuery) {
                console.log('plane query');
                throw new Error('point should be in polygon');
            }

        } else {
            let pe1 = getEdgePointsForLine(coneInfo.source, coneInfo.tanPts[0]);
            let pe2 = getEdgePointsForLine(coneInfo.source, coneInfo.tanPts[1]);

            let guideLine = getEdgePointsForLine(coneInfo.source, coneInfo.validator);

            let ex_points = [pe1[0], pe1[1], pe2[0], pe2[1]];
            let forward = [];
            let backward = [];
            // gather segments on each side of p1 to construct cones as polylines
            ex_points.forEach(function (p) {
                if (pointIsOn(coneInfo.source, p, coneInfo.tanPts[0]) ||
                    pointIsOn(coneInfo.source, p, coneInfo.tanPts[1])) {

                    forward.push(p);
                } else {
                    backward.push(p);
                }
            });

            let forwGuide = null;
            let backGuide = null;
            if (pointIsOn(coneInfo.source, guideLine[0], coneInfo.validator)) {
                forwGuide = guideLine[0];
                backGuide = guideLine[1];
            } else {
                forwGuide = guideLine[1];
                backGuide = guideLine[0];
            }

            let getFacingEdge = function (guidePt) {
                let facingEdge = '';
                if (guidePt.x === xmin) {
                    facingEdge = 'left';
                } else if (guidePt.x === xmax) {
                    facingEdge = 'right';
                } else if (guidePt.y === ymax) {
                    facingEdge = 'top';
                } else if (guidePt.y === ymin) {
                    facingEdge = 'bottom';
                }
                return facingEdge;
            };

            let forwEdge = getFacingEdge(forwGuide);
            let backEdge = getFacingEdge(backGuide);

            //let wedges = getWedges(coneInfo);



            let forwCorner = {};
            let forwCorner2 = {};

            if (forwEdge === 'top') {
                // contains no corners.
                if (forward[0].y === ymax && forward[1].y === ymax) {
                    // add no corners
                } else if (forward[0].y === ymax) {
                    if (forward[1].x === xmax) {
                        // include topright corner
                        forwCorner = {x: xmax, y: ymax};
                    } else if (forward[1].x === xmin) {
                        // include topleft
                        forwCorner = {x: xmin, y: ymax};
                    }

                } else if (forward[1].y === ymax) {
                    if (forward[0].x === xmax) {
                        // include topright corner
                        forwCorner = {x: xmax, y: ymax};
                    } else if (forward[0].x === xmin) {
                        // include topleft
                        forwCorner = {x: xmin, y: ymax};
                    }
                } else {
                    forwCorner = {x: xmin, y: ymax};
                    forwCorner2 = {x: xmax, y: ymax};
                }
            } else if (forwEdge === 'bottom') {
                // contains no corners.
                if (forward[0].y === ymin && forward[1].y === ymin) {
                    // add no corners
                } else if (forward[0].y === ymin) {
                    if (forward[1].x === xmax) {
                        // include bottom right corner
                        forwCorner = {x: xmax, y: ymin};
                    } else if (forward[1].x === xmin) {
                        // include bottom left
                        forwCorner = {x: xmin, y: ymin};
                    }

                } else if (forward[1].y === ymax) {
                    if (forward[0].x === xmax) {
                        // include bottom right corner
                        forwCorner = {x: xmax, y: ymin};
                    } else if (forward[0].x === xmin) {
                        // include bottom left
                        forwCorner = {x: xmin, y: ymin};
                    }
                } else {
                    forwCorner = {x: xmax, y: ymin};
                    forwCorner2 = {x: xmin, y: ymin};
                }
            } else if (forwEdge === 'left') {
                // no corners
                if (forward[0].x === xmin && forward[1].x === xmin) {
                    // add no corners
                } else if (forward[0].x === xmin) {
                    if (forward[1].y === ymax) {
                        // include top left corner
                        forwCorner = {x: xmin, y: ymax};
                    } else if (forward[1].y === ymin) {
                        // include bottom left
                        forwCorner = {x: xmin, y: ymin};
                    }
                } else if (forward[1].x === xmin) {
                    if (forward[0].y === ymax) {
                        // include top left corner
                        forwCorner = {x: xmin, y: ymax};
                    } else if (forward[0].y === ymin) {
                        // include bottom left
                        forwCorner = {x: xmin, y: ymin};
                    }
                } else {
                    forwCorner = {x: xmin, y: ymin};
                    forwCorner2 = {x: xmin, y: ymax};
                }
            } else if (forwEdge === 'right') {
                // no corners
                if (forward[0].x === xmax && forward[1].x === xmax) {
                    // add no corners
                } else if (forward[0].x === xmax) {
                    if (forward[1].y === ymax) {
                        // include top right corner
                        forwCorner = {x: xmax, y: ymax};
                    } else if (forward[1].y === ymin) {
                        // include bottom right
                        forwCorner = {x: xmax, y: ymin};
                    }
                } else if (forward[1].x === xmax) {
                    if (forward[0].y === ymax) {
                        // include top right corner
                        forwCorner = {x: xmax, y: ymax};
                    } else if (forward[0].y === ymin) {
                        // include bottom right
                        forwCorner = {x: xmax, y: ymin};
                    }
                } else {
                    forwCorner = {x: xmax, y: ymax};
                    forwCorner2 = {x: xmax, y: ymin};
                }

            }

            let backCorner = {};
            let backCorner2 = {};

            if (backEdge === 'top') {
                // contains no corners.
                if (backward[0].y === ymax && backward[1].y === ymax) {
                    // add no corners
                } else if (backward[0].y === ymax) {
                    if (backward[1].x === xmax) {
                        // include topright corner
                        backCorner = {x: xmax, y: ymax};
                    } else if (backward[1].x === xmin) {
                        // include topleft
                        backCorner = {x: xmin, y: ymax};
                    }

                } else if (backward[1].y === ymax) {
                    if (backward[0].x === xmax) {
                        // include topright corner
                        backCorner = {x: xmax, y: ymax};
                    } else if (backward[0].x === xmin) {
                        // include topleft
                        backCorner = {x: xmin, y: ymax};
                    }
                } else {
                    backCorner = {x: xmin, y: ymax};
                    backCorner2 = {x: xmax, y: ymax};
                }
            } else if (backEdge === 'bottom') {
                // contains no corners.
                if (backward[0].y === ymin && backward[1].y === ymin) {
                    // add no corners
                } else if (backward[0].y === ymin) {
                    if (backward[1].x === xmax) {
                        // include bottom right corner
                        backCorner = {x: xmax, y: ymin};
                    } else if (backward[1].x === xmin) {
                        // include bottom left
                        backCorner = {x: xmin, y: ymin};
                    }

                } else if (backward[1].y === ymax) {
                    if (backward[0].x === xmax) {
                        // include bottom right corner
                        backCorner = {x: xmax, y: ymin};
                    } else if (backward[0].x === xmin) {
                        // include bottom left
                        backCorner = {x: xmin, y: ymin};
                    }
                } else {
                    backCorner = {x: xmax, y: ymin};
                    backCorner2 = {x: xmin, y: ymin};
                }
            } else if (backEdge === 'left') {
                // no corners
                if (backward[0].x === xmin && backward[1].x === xmin) {
                    // add no corners
                } else if (backward[0].x === xmin) {
                    if (backward[1].y === ymax) {
                        // include top left corner
                        backCorner = {x: xmin, y: ymax};
                    } else if (backward[1].y === ymin) {
                        // include bottom left
                        backCorner = {x: xmin, y: ymin};
                    }
                } else if (backward[1].x === xmin) {
                    if (backward[0].y === ymax) {
                        // include top left corner
                        backCorner = {x: xmin, y: ymax};
                    } else if (backward[0].y === ymin) {
                        // include bottom left
                        backCorner = {x: xmin, y: ymin};
                    }
                } else {
                    backCorner = {x: xmin, y: ymin};
                    backCorner2 = {x: xmin, y: ymax};
                }
            } else if (backEdge === 'right') {
                // no corners
                if (backward[0].x === xmax && backward[1].x === xmax) {
                    // add no corners
                } else if (backward[0].x === xmax) {
                    if (backward[1].y === ymax) {
                        // include top right corner
                        backCorner = {x: xmax, y: ymax};
                    } else if (backward[1].y === ymin) {
                        // include bottom right
                        backCorner = {x: xmax, y: ymin};
                    }
                } else if (backward[1].x === xmax) {
                    if (backward[0].y === ymax) {
                        // include top right corner
                        backCorner = {x: xmax, y: ymax};
                    } else if (backward[0].y === ymin) {
                        // include bottom right
                        backCorner = {x: xmax, y: ymin};
                    }
                } else {
                    backCorner = {x: xmax, y: ymax};
                    backCorner2 = {x: xmax, y: ymin};
                }

            }


            /*            if ((forward[0].x === xmax && forward[1].x !== xmax) ||
                            (forward[1].x !== xmax && forward[0].x === xmax) ||
                            (forward[1].x === xmax && forward[0].x !== xmax) ||
                            (forward[0].x !== xmax && forward[1].x === xmax)) {
                            forwCorner.x = xmax;
                        } else if ((forward[0].x === xmin && forward[1].x !== xmin) ||
                            (forward[1].x !== xmin && forward[0].x === xmin) ||
                            (forward[1].x === xmin && forward[0].x !== xmin) ||
                            (forward[0].x !== xmin && forward[1].x === xmin)) {
                            forwCorner.x = xmin;
                        }*/

            /*           if ((forward[0].y === ymax && forward[1].y !== ymax) ||
                           (forward[1].y !== ymax && forward[0].y === ymax) ||
                           (forward[1].y === ymax && forward[0].y !== ymax) ||
                           (forward[0].y !== ymax && forward[1].y === ymax)) {
                           forwCorner.y = ymax;
                       } else if ((forward[0].y === ymin && forward[1].y !== ymin) ||
                           (forward[1].y !== ymin && forward[0].y === ymin) ||
                           (forward[1].y === ymin && forward[0].y !== ymin) ||
                           (forward[0].y !== ymin && forward[1].y === ymin)) {
                           forwCorner.y = ymin;
                       }

                       if (forward[0].x === xmax && forward[1].x === xmin){
                           forwCorner.x = xmax;
                           forwCorner2.x = xmin;
                           forwCorner2.y = forwCorner.y;
                       } else if (forward[1].x === xmax && forward[0].x === xmin){
                           forwCorner.x = xmin;
                           forwCorner2.x = xmax;
                           forwCorner2.y = forwCorner.y;
                       }*/
            console.log('forward cone');
            console.log(forward);
            console.log(forwCorner);

            // need to maintain ccw winding order, pair up points properly
            let forw_poly = [{x: coneInfo.source.x, y: coneInfo.source.y},
                {x: forward[0].x, y: forward[0].y}];

            if (forwCorner.hasOwnProperty('x') && forwCorner.hasOwnProperty('y')) {
                forw_poly.push(forwCorner);
            }

            if (forwCorner2.hasOwnProperty('x') && forwCorner2.hasOwnProperty('y')) {
                forw_poly.push(forwCorner2);
            }

            forw_poly.push({x: forward[1].x, y: forward[1].y});
            forw_poly.push({x: coneInfo.source.x, y: coneInfo.source.y});

            console.log('args');
            console.log([coneInfo.validator, forw_poly]);
            let forwQuery = IntersectionQuery.pointInPolygon(coneInfo.validator, forw_poly);
            console.log(forwQuery);
            if (!forwQuery) {
                throw new Error('point should be in polygon');
            }


            let back_poly = [{x: coneInfo.source.x, y: coneInfo.source.y}];
            back_poly.push({x: backward[0].x, y: backward[0].y});

            /*            let bCorner = {};
                        if ((backward[0].x === xmax && backward[1].x !== xmax) ||
                            (backward[1].x !== xmax && backward[0].x === xmax) ||
                            (backward[1].x === xmax && backward[0].x !== xmax) ||
                            (backward[0].x !== xmax && backward[1].x === xmax)) {
                            bCorner.x = xmax;
                        } else if ((backward[0].x === xmin && backward[1].x !== xmin) ||
                            (backward[1].x !== xmin && backward[0].x === xmin) ||
                            (backward[1].x === xmin && backward[0].x !== xmin) ||
                            (backward[0].x !== xmin && backward[1].x === xmin)) {
                            bCorner.x = xmin;
                        }


                        if ((backward[0].y === ymax && backward[1].y !== ymax) ||
                            (backward[1].y !== ymax && backward[0].y === ymax) ||
                            (backward[1].y === ymax && backward[0].y !== ymax) ||
                            (backward[0].y !== ymax && backward[1].y === ymax)) {
                            bCorner.y = ymax;
                        } else if ((backward[0].y === ymin && backward[1].y !== ymin) ||
                            (backward[1].y !== ymin && backward[0].y === ymin) ||
                            (backward[1].y === ymin && backward[0].y !== ymin) ||
                            (backward[0].y !== ymin && backward[1].y === ymin)) {
                            bCorner.y = ymin;
                        }*/

            if (backCorner.hasOwnProperty('x') && backCorner.hasOwnProperty('y')) {
                back_poly.push(backCorner);
            }
            if (backCorner2.hasOwnProperty('x') && backCorner2.hasOwnProperty('y')) {
                back_poly.push(backCorner2);
            }

            back_poly.push({x: backward[1].x, y: backward[1].y});
            back_poly.push({x: coneInfo.source.x, y: coneInfo.source.y});
            let extended = getEdgePointsForLine(coneInfo.source, coneInfo.validator);
            let testPt = getOppositePoint(coneInfo.source, coneInfo.validator, extended);

            console.log('back args');
            console.log([testPt, back_poly]);
            let backQuery = IntersectionQuery.pointInPolygon(testPt, back_poly);
            console.log(backQuery);
            if (!backQuery) {
                throw new Error('point should be in polygon');
            }

            polygon = [forw_poly, back_poly];
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
                        return d.disc ? xScale(d.epsilon) : 0;
                    })
                    .style("fill", "url(#lightstripe)")
                    .style("stroke", "#000")
                    .style("strokewidth", "1"),
                update => update
                    .attr("r", function (d) {
                        return d.disc ? xScale(d.epsilon) : 0;
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
                        return xScale(pts[0].x);
                    })
                    .attr("y1", function (d) {
                        if (!d.strip) return null;
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return yScale(pts[0].y);
                    })
                    .attr("x2", function (d) {
                        if (!d.strip) return null;
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return xScale(pts[1].x);
                    })
                    .attr("y2", function (d) {
                        if (!d.strip) return null;
                        let p1 = data.nodes[d.source].coordinates;
                        let p2 = data.nodes[d.target].coordinates;

                        let pts = getEdgePointsForLine(p1, p2);
                        return yScale(pts[1].y);
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
                            return 2 * xScale(d.epsilon);
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
                            return 2 * xScale(d.epsilon);
                        } else {
                            return 1;
                        }
                    }),
                exit => exit
                    .attr("fill", "brown")
                    .call(exit => exit.remove())
            );


        let coneData = function () {
            let cones = [];
            data.nodes.forEach(function (node, idx) {
                if (node.hasOwnProperty('cones')) {
                    node.cones.forEach(function (cone) {
                        if (cone.hasOwnProperty('show') && cone.show) {
                            cones.push({
                                source: idx,
                                target: cone.target,
                                geom: cone.geom,
                                coneInt: cone.coneInt,
                                intx: cone.intx,
                                show: cone.show
                            });
                        }
                    });
                }
            });
            return cones;
        };

        //let coneContainer = stripContainer.append('g');

        stripContainer.selectAll('polyline')
            .data(coneData)
            .join(
                enter => enter.append('polyline')
                    .attr('points', function (d) {

                        return polygonToPolyline(d.geom);
                    })
                    .style('stroke', 'black')
                    .style('stroke-width', "2")
                    .style('stroke-opacity', '100')
                    .style('fill-opacity', '20')
                    .style('fill', function (d) {
                        if (d.intx) {
                            return '#55FF55';
                        } else {
                            return '#AA2222';
                        }

                    })
                    .style('opacity', '0.2'),
                update => update
                    .attr('points', function (d) {

                        return polygonToPolyline(d.geom);
                    }),
                exit => exit
                    .attr('points', function (d) {

                        return polygonToPolyline(d.geom);
                    })
                    .remove()
            );


        /*       stripContainer.selectAll('polyline')
                   .data(coneData)
                   .join(
                       enter => enter.append('polyline')
                           .attr('points', function (d) {
                               return polygonToPolyline(d.coneInt);
                           })
                           .style('stroke', 'black')
                           .style('stroke-width', "2")
                           .style('stroke-opacity', '100')
                           .style('fill-opacity', '10')
                           .style('fill', function(d){
                               if (d.intx){
                                   return '#5555FF';
                               } else {
                                   return '#AA2222';
                               }

                           })
                           .style('opacity', '.4'),
                       update => update
                           .attr('points', function (d) {

                               return polygonToPolyline(d.coneInt);
                           }),
                       exit => exit
                           .attr('points', function (d) {

                               return polygonToPolyline(d.coneInt);
                           })
                           .remove()
                   );
       */
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
        //console.log(xTopY);
        if ((xTopY <= xmax) && (xTopY >= xmin)) {
            // intersect top boundary in range
            topY = true;
        }

        let xBottomY = getXFromYForLine(p1, p2, ymin);
        //console.log(xBottomY);
        if (((xBottomY <= xmax) && (xBottomY >= xmin))) {
            // intersects bottom boundary in range
            bottomY = true;
        }

        let yLeftX = getYFromXForLine(p2, p1, xmin);
        //console.log(yLeftX);
        if (((yLeftX <= ymax) && (yLeftX >= ymin))) {
            // intersect left boundary in range
            leftX = true;
        }

        let yRightX = getYFromXForLine(p1, p2, xmax);
        //console.log(yRightX);
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


    /*    function getEdgePointsForLine(p1, p2) {
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
        }*/

    function getEdgePointsForLine(p1, p2) {

        let eymin = ymin;
        let exmin = xmin;
        let eymax = ymax;
        let exmax = xmax;

        if (isVertical(p1, p2)) {
            console.log('is vertical');
            return [{x: p1.x, y: eymin}, {x: p1.x, y: eymax}];
        }
        if (isHorizontal(p1, p2)) {
            console.log('is horizontal');
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
            console.log(itx);
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
        let eps = err;
        if (eps >= d) {
            throw new Error('circles are too close!');
        }
        let c1 = ShapeInfo.circle({center: {x: p1.x, y: p1.y}, radius: d});
        let c2 = ShapeInfo.circle({center: {x: p2.x, y: p2.y}, radius: eps});
        let itx = Intersection.intersect(c2, c1);

        return itx.points;
    }

    /**
     * get a point on the other side of the starting point, to test if interior to back half of double cone
     * @param p1
     * @param p2
     * @param line
     * @returns {*}
     */
    function getOppositePoint(p1, p2, line) {
        let d = euclideanDistance(p1, p2);
        let c1 = ShapeInfo.circle({center: {x: p1.x, y: p1.y}, radius: 1});
        let c2 = ShapeInfo.circle({center: {x: p2.x, y: p2.y}, radius: d - 1});
        let itx1 = Intersection.intersect(c1, ShapeInfo.line(line));
        let pts1 = itx1.points;
        let itx2 = Intersection.intersect(c2, ShapeInfo.line(line));
        let pts2 = itx2.points;
        // each set of intersections should share one point. we want to return the point from intx1 that is not shared
        let e = 0.2;
        if (pts2.length === 2) {
            if ((Math.abs(pts1[0].x - pts2[0].x) < e) && (Math.abs(pts1[0].y - pts2[0].y) < e) ||
                (Math.abs(pts1[0].x - pts2[1].x) < e) && (Math.abs(pts1[0].y - pts2[1].y) < e)) {
                return pts1[1];
            } else {
                return pts1[0];
            }
        } else if (pts2.length === 1) {
            if ((Math.abs(pts1[0].x - pts2[0].x) < e) && (Math.abs(pts1[0].y - pts2[0].y) < e)) {
                return pts1[1];
            } else {
                return pts1[0];
            }
        }
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

    function hideDiscs() {
        data.nodes.forEach(function (n, idx) {
            n.disc = false;
        });
    }

    function clearCones() {
        data.nodes.forEach(function (n, idx) {
            if (n.hasOwnProperty('cones')) {
                n.cones.forEach(function (c) {
                    c.show = false;
                })
            }
        });
    }

    // todo: should be able to generate this by iterating over nodes and edges.
    // todo: show cones from each starting point, place edges
    // todo: should just hard code for the cone viz
    function drawConeFromSource(srcIdx, tgtIdx) {
        /*        console.log('drawconefromsource');
                console.log(srcIdx);
                console.log(tgtIdx);*/
        data.nodes.forEach(function (n, idx) {
            if (srcIdx === idx) {
                if (n.hasOwnProperty('cones')) {
                    n.cones.forEach(function (c) {
                        if (c.target === tgtIdx) {
                            c.show = true;
                            data.edges.forEach(function (e) {
                                if (e.source === idx && e.target === c.target) {
                                    e.show = true;
                                }
                            })
                        }
                    })
                }
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
        data: data,
        enableInput: enableInput,
        disableInput: disableInput,
        clearNodes: clearNodes,
        hideDiscs: hideDiscs
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

    this.generateSteps = function () {
        console.log('generate steps');
        let steps = [];
        viz.data.nodes.forEach(function (n, srcIdx) {
            if (n.hasOwnProperty('cones')) {
                let targets = [];
                n.cones.forEach(function (c, cIdx) {
                    let source = srcIdx;

                    targets.push(c.target);
                    let targetCopy = cloneDeep(targets);

                    let action = function () {
                        viz.clearCones();
                        viz.hideApproximation();

                        targetCopy.forEach(function (i) {
                            viz.drawConeFromSource(source, i);
                        });
                        console.log(viz.data);
                        viz.draw();
                    };

                    if (source === 0 && c.target === 1) {

                    } else {
                        steps.push(
                            {
                                'step': (srcIdx + 1) * (cIdx + 1),
                                'message': 'Draw cones from the starting vertex to each successive error disc. ' +
                                    'Keep a DAG edge (dotted blue line) if all the vertices in between the source vertex and target vertex ' +
                                    'lie in the intersection of all the cones. In the illustration, red cones indicate ' +
                                    'that no more edges can be added from a particular vertex. For clarity, ' +
                                    'DAG edges found from prior vertices are hidden here.',
                                'action': action
                            });
                    }


                })
            }
        });

        let action = function () {
            viz.clearCones();
            viz.showApproximation();
            viz.draw();
        };
        let stepVal = steps.length;
        steps.push(
            {
                'step': stepVal,
                'message': 'Finally, you have a DAG which is comprised of all valid potential approximate edges.',
                'action': action
            });

        steps.push(
            {
                'step': stepVal + 1,
                'message': 'Calculate the shortest path using the remaining edges. This example uses a breadth first search to find the shortest path. The result (in green) is the simplified polygonal chain that minimizes the number of edges with a given error \u03B5.',
                'action': viz.getShortestPath
            });

        return steps;
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
        steps: []
    };

    this.state.steps = this.generateSteps();
    this.showFirst();

};


const DemoVisualization = function (params) {

    let viz = drawExampleViz(params.vizEl, params.data, params.error, params.h, params.w);
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
        viz.hideApproximation();
        viz.clearCones();
        viz.hideDiscs();
        //viz.clearNodes();
        this.state.steps = introSteps;

        self.state.stepIndex = 0;
        setControlState(self.state);
        return showStep(self.state);
    };

    let demorange = document.getElementById('epsilonRange_demo');
    demorange.value = params.error;
    let demoeps = document.getElementById("demo-epsilon");
    demoeps.textContent = demorange.value;
    let updateDiscs = function (e) {
        if (e.target) {
            demoeps.textContent = e.target.value;
            viz.updateError(parseFloat(e.target.value));
            viz.draw();
        }
    };

    ["input"].map(ev => demorange.addEventListener(ev, updateDiscs, false));


    this.clickHandler = function (e) {
        genericTransportHandler(e, self);
    };

    this.generateSteps = function () {
        console.log('generate demo steps');
        viz.findEdgesToussaint();
        let steps = [];
        viz.data.nodes.forEach(function (n, srcIdx) {
            if (n.hasOwnProperty('cones')) {
                let targets = [];
                n.cones.forEach(function (c, cIdx) {
                    let source = srcIdx;

                    targets.push(c.target);
                    let targetCopy = cloneDeep(targets);

                    let action = function () {
                        viz.clearCones();
                        viz.hideApproximation();

                        targetCopy.forEach(function (i) {
                            if (source === 0 && i === 1) {

                            } else {
                                viz.drawConeFromSource(source, i);
                            }
                        });
                        console.log(viz.data);
                        viz.draw();
                    };

                    if (source === 0 && c.target === 1) {

                    } else {
                        steps.push(
                            {
                                'step': (srcIdx + 1) * (cIdx + 1),
                                'message': 'Draw cones from the starting vertex to each successive error disc. ' +
                                    'Keep a DAG edge (dotted blue line) if all the vertices in between the source vertex and target vertex ' +
                                    'lie in the intersection of all the cones. In the illustration, red cones indicate ' +
                                    'that no more edges can be added from a particular vertex. For clarity, ' +
                                    'DAG edges found from prior vertices are hidden here.',
                                'action': action
                            });
                    }


                })
            }
        });

        let action = function () {
            viz.clearCones();
            viz.showApproximation();
            viz.draw();
        };
        let stepVal = steps.length;
        steps.push(
            {
                'step': stepVal,
                'message': 'Finally, you have a DAG which is comprised of all valid potential approximate edges.',
                'action': action
            });

        steps.push(
            {
                'step': stepVal + 1,
                'message': 'Calculate the shortest path using the remaining edges. This example uses a breadth first search to find the shortest path. The result (in green) is the simplified polygonal chain that minimizes the number of edges with a given error \u03B5.',
                'action': viz.getShortestPath
            });

        return steps;
    };


    this.state = {
        rewind: "rewindDemoedges1",
        backward: "backwardDemoedges1",
        forward: "forwardDemoedges1",
        fastforward: "ffDemoedges1",
        allDisabled: false,
        stepIndex: 0,
        messageEl: "message-demo-1",
        viz: viz,
        steps: []
    };

    this.state.steps = [];
    let clickAction = function () {
        viz.enableInput();
    };

    let epsilonAction = function () {
        viz.disableInput();

        viz.drawDiscsFromSource(0);
        console.log(viz.data);
        viz.draw();
    };

    let generateConesAction = function () {
        self.state.steps = self.state.steps.concat(self.generateSteps());
        console.log('state');
        console.log(self.state);
        console.log(self.state.steps.length);
        setControlState(self.state);
    };

    let introSteps = [
        {
            'step': 0,
            'message': 'Click to add points to a polygonal chain.',
            'action': clickAction
        },
        {
            'step': 1,
            'message': 'Select an epsilon value for your simplification.',
            'action': epsilonAction
        },
        {
            'step': 1,
            'message': 'Click next to step through cones.',
            'action': generateConesAction
        }];


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
    error: 5,
    h: 500,
    w: 500
});


/*
cones viz
 */
let coneViz = new ConeVisualization({
    vizEl: "#vizCones",
    data: cloneDeep(demoData),
    error: 5,
    h: 500,
    w: 500
});
coneViz.state.viz.drawDiscsFromSource(0);
coneViz.state.viz.draw();


let demoViz = new DemoVisualization({
    vizEl: "#vizDemo",
    data: {"nodes": [], "edges": []},
    error: 5,
    h: 750,
    w: 750
});
demoViz.state.viz.drawDiscsFromSource(0);
demoViz.state.viz.draw();



/*
Event handlers
 */


document.addEventListener('click', function (e) {
    dagViz.clickHandler(e);
    coneViz.clickHandler(e);
    demoViz.clickHandler(e);
});