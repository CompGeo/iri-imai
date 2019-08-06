"use strict";

var bootstrap = _interopRequireWildcard(require("bootstrap"));

var d3 = _interopRequireWildcard(require("d3"));

require("./styles/main.scss");

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj["default"] = obj;
        return newObj;
    }
}

function drawDAG() {
    var data = {
        "nodes": [{
            "coordinates": {
                "x": 30,
                "y": 70
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 20,
                "y": 55
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 19,
                "y": 37
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 25,
                "y": 41
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 40,
                "y": 45
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 50,
                "y": 41
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 60,
                "y": 45
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 80,
                "y": 40
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 70,
                "y": 80
            },
            "disc": false
        }],
        "edges": [{
            "source": 0,
            "target": 1,
            "strip": false,
            "approx": false
        }, {
            "source": 0,
            "target": 2,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 3,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 4,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 2,
            "strip": false,
            "approx": false
        }, {
            "source": 1,
            "target": 3,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 4,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 3,
            "strip": false,
            "approx": false
        }, {
            "source": 2,
            "target": 4,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 4,
            "strip": false,
            "approx": false
        }, {
            "source": 3,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 4,
            "target": 5,
            "strip": false,
            "approx": false
        }, {
            "source": 4,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 4,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 4,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 5,
            "target": 6,
            "strip": false,
            "approx": false
        }, {
            "source": 5,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 5,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 6,
            "target": 7,
            "strip": false,
            "approx": false
        }, {
            "source": 6,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 7,
            "target": 8,
            "strip": false,
            "approx": false
        }]
    };
    var error = 20; // todo: dynamic height and width (so range should also be dynamic)

    var height = 500;
    var width = 500;
    var xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    var yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);
    var svg = d3.select("#vizDAG > svg").attr("width", width).attr("height", height).attr("style", "border: 1px solid black").append("g").attr("transform", function (d, i) {
        return "translate(0,0)";
    });
    var stripContainer = svg.append("g").attr("id", "strip-container");
    var chainContainer = svg.append("g").attr("id", "chain-container-1");

    function drawGraph() {
        var edges = chainContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.approx) {
                return "blue";
            } else {
                return "#000000";
            }
        }).style("stroke-dasharray", function (d) {
            if (d.approx) {
                return "2,2";
            } else {
                return "";
            }
        }).style("stroke-width", function (d) {
            if (d.approx) {
                return "1";
            } else {
                return "2";
            }
        });
        var vertices = chainContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", 5).style("fill", function (d) {
            return "#FF0000";
        });
    }

    function updateErrorDiscs() {
        var discs = stripContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", function (d) {
            return d.disc ? 2 * error : 0;
        }).style("fill", "url(#lightstripe)").style("stroke", "#000").style("strokewidth", "1");
        var strips = stripContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            if (!d.strip) return null;
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            if (!d.strip) return null;
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            if (!d.strip) return null;
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            if (!d.strip) return null;
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.strip) {
                return "#00EE00";
            } else {
                return "#000000";
            }
        }).style("stroke-width", function (d) {
            if (d.strip) {
                return xScale(error);
            } else {
                return 1;
            }
        }).style("stroke-opacity", function (d) {
            if (d.strip) {
                return 0.5;
            } else {
                return 1;
            }
        });
    }

    function isVertical(p1, p2) {
        return p2.x - p1.x === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }

    function getDiscTangentPoints(p1, p2) {
        if (isVertical(p1, p2)) {
            // perpendicular line is horizontal
            return [{
                'x': p2.x - error,
                'y': p2.y
            }, {
                'x': p2.x + error,
                'y': p2.y
            }];
        }

        var slope = getSlope(p1, p2);

        if (slope === 0) {
            // perpendicular line is vertical
            return [{
                'x': p2.x,
                'y': p2.y - error
            }, {
                'x': p2.x,
                'y': p2.y + error
            }];
        } else {
            // y = mx + b
            var newSlope = -1 / slope;
        }
    }

    drawGraph();
    updateErrorDiscs();
}

function drawParallelStrip() {
    var data = {
        "nodes": [{
            "coordinates": {
                "x": 30,
                "y": 70
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 20,
                "y": 55
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 19,
                "y": 37
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 25,
                "y": 41
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 40,
                "y": 45
            },
            "disc": true
        }, {
            "coordinates": {
                "x": 50,
                "y": 41
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 60,
                "y": 45
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 80,
                "y": 40
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 70,
                "y": 80
            },
            "disc": false
        }],
        "edges": [{
            "source": 0,
            "target": 1,
            "strip": false,
            "approx": false
        }, {
            "source": 1,
            "target": 2,
            "strip": false,
            "approx": false
        }, {
            "source": 2,
            "target": 3,
            "strip": false,
            "approx": false
        }, {
            "source": 3,
            "target": 4,
            "strip": false,
            "approx": false
        }, {
            "source": 4,
            "target": 5,
            "strip": false,
            "approx": false
        }, {
            "source": 5,
            "target": 6,
            "strip": false,
            "approx": false
        }, {
            "source": 6,
            "target": 7,
            "strip": false,
            "approx": false
        }, {
            "source": 7,
            "target": 8,
            "strip": false,
            "approx": false
        }, {
            "source": 2,
            "target": 7,
            "strip": true,
            "approx": true
        }]
    };
    var error = 20; // todo: dynamic height and width (so range should also be dynamic)

    var height = 500;
    var width = 500;
    var xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    var yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);
    var svg = d3.select("#vizStrip > svg").attr("width", width).attr("height", height).attr("style", "border: 1px solid black").append("g").attr("transform", function (d, i) {
        return "translate(0,0)";
    });
    var stripContainer = svg.append("g").attr("id", "strip-container");
    var chainContainer = svg.append("g").attr("id", "chain-container-1");

    function drawGraph() {
        var edges = chainContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.approx) {
                return "blue";
            } else {
                return "#000000";
            }
        }).style("stroke-dasharray", function (d) {
            if (d.approx) {
                return "2,2";
            } else {
                return "";
            }
        }).style("stroke-width", function (d) {
            if (d.approx) {
                return "1";
            } else {
                return "2";
            }
        });
        var vertices = chainContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", 5).style("fill", function (d) {
            return "#FF0000";
        });
    }

    function updateErrorDiscs() {
        var discs = stripContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", function (d) {
            return d.disc ? 2 * error : 0;
        }).style("fill", "url(#lightstripe)").style("stroke", "#000").style("strokewidth", "1");
        var strips = stripContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            if (!d.strip) return null;
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            if (!d.strip) return null;
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            if (!d.strip) return null;
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            if (!d.strip) return null;
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.strip) {
                return "#00EE00";
            } else {
                return "#000000";
            }
        }).style("stroke-width", function (d) {
            if (d.strip) {
                return xScale(error);
            } else {
                return 1;
            }
        }).style("stroke-opacity", function (d) {
            if (d.strip) {
                return 0.5;
            } else {
                return 1;
            }
        });
    }

    function isVertical(p1, p2) {
        return p2.x - p1.x === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }

    function getDiscTangentPoints(p1, p2) {
        if (isVertical(p1, p2)) {
            // perpendicular line is horizontal
            return [{
                'x': p2.x - error,
                'y': p2.y
            }, {
                'x': p2.x + error,
                'y': p2.y
            }];
        }

        var slope = getSlope(p1, p2);

        if (slope === 0) {
            // perpendicular line is vertical
            return [{
                'x': p2.x,
                'y': p2.y - error
            }, {
                'x': p2.x,
                'y': p2.y + error
            }];
        } else {
            // y = mx + b
            var newSlope = -1 / slope;
        }
    }

    drawGraph();
    updateErrorDiscs();
}

function drawDiscsCones() {
    var data = {
        "nodes": [{
            "coordinates": {
                "x": 5,
                "y": 10
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 50,
                "y": 50
            },
            "disc": true
        }, {
            "coordinates": {
                "x": 60,
                "y": 40
            },
            "disc": true
        }],
        "edges": [{
            "source": 0,
            "target": 1,
            "cone": true
        }, {
            "source": 1,
            "target": 2,
            "cone": true
        }]
    };
    var error = 8; // todo: dynamic height and width (so range should also be dynamic)

    var height = 500;
    var width = 500;
    var xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    var yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);
    var svg = d3.select("#vizCones > svg").attr("width", width).attr("height", height).attr("style", "border: 1px solid black").append("g").attr("transform", function (d, i) {
        return "translate(0,0)";
    });
    var discContainer = svg.append("g").attr("id", "disc-container");
    var chainContainer = svg.append("g").attr("id", "chain-container");

    function drawGraph() {
        var edges = chainContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.approx) {
                return "blue";
            } else {
                return "#000000";
            }
        }).style("stroke-dasharray", function (d) {
            if (d.approx) {
                return "2,2";
            } else {
                return "";
            }
        }).style("stroke-width", function (d) {
            if (d.approx) {
                return "1";
            } else {
                return "2";
            }
        });
        var vertices = chainContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", 5).style("fill", function (d) {
            return "#FF0000";
        });
    }

    function updateErrorDiscs() {
        var discs = discContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", function (d) {
            return d.disc ? 2 * error : 0;
        }).style("fill", "url(#lightstripe)").style("stroke", "#000").style("strokewidth", "1");
    }

    function isVertical(p1, p2) {
        return p2.x - p1.x === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }

    function getDiscTangentPoints(p1, p2) {
        if (isVertical(p1, p2)) {
            // perpendicular line is horizontal
            return [{
                'x': p2.x - error,
                'y': p2.y
            }, {
                'x': p2.x + error,
                'y': p2.y
            }];
        }

        var slope = getSlope(p1, p2);

        if (slope === 0) {
            // perpendicular line is vertical
            return [{
                'x': p2.x,
                'y': p2.y - error
            }, {
                'x': p2.x,
                'y': p2.y + error
            }];
        } else {
            // y = mx + b
            var newSlope = -1 / slope;
        }
    }

    function generateCone(p1, p2) {
        var trianglePoints = xScale(p1.x) + ' ' + yScale(p1.y) + ', ' + xScale(50) + ' ' + yScale(55) + ', ';
        trianglePoints += xScale(50) + ' ' + yScale(45) + ' ' + xScale(p1.x) + ', ' + yScale(p1.y);
        svg.append('polyline').attr('points', trianglePoints).style('stroke', 'blue').style('stroke-width', "1").style('stroke-opacity', '1').style('fill', 'blue').style('opacity', '0.2');
    }

    drawGraph();
    generateCone(data.nodes[0].coordinates, data.nodes[1].coordinates);
    updateErrorDiscs();
}

function drawDemo() {
    var data = {
        "nodes": [{
            "coordinates": {
                "x": 30,
                "y": 70
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 20,
                "y": 55
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 19,
                "y": 37
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 25,
                "y": 41
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 40,
                "y": 45
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 50,
                "y": 41
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 60,
                "y": 45
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 80,
                "y": 40
            },
            "disc": false
        }, {
            "coordinates": {
                "x": 70,
                "y": 80
            },
            "disc": false
        }],
        "edges": [{
            "source": 0,
            "target": 1,
            "strip": false,
            "approx": false
        }, {
            "source": 0,
            "target": 2,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 3,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 4,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 0,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 2,
            "strip": false,
            "approx": false
        }, {
            "source": 1,
            "target": 3,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 4,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 1,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 3,
            "strip": false,
            "approx": false
        }, {
            "source": 2,
            "target": 4,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 2,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 4,
            "strip": false,
            "approx": false
        }, {
            "source": 3,
            "target": 5,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 3,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 4,
            "target": 5,
            "strip": false,
            "approx": false
        }, {
            "source": 4,
            "target": 6,
            "strip": false,
            "approx": true
        }, {
            "source": 4,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 4,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 5,
            "target": 6,
            "strip": false,
            "approx": false
        }, {
            "source": 5,
            "target": 7,
            "strip": false,
            "approx": true
        }, {
            "source": 5,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 6,
            "target": 7,
            "strip": false,
            "approx": false
        }, {
            "source": 6,
            "target": 8,
            "strip": false,
            "approx": true
        }, {
            "source": 7,
            "target": 8,
            "strip": false,
            "approx": false
        }]
    };
    var error = 20; // todo: dynamic height and width (so range should also be dynamic)

    var height = 750;
    var width = 1000;
    var xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    var yScale = d3.scaleLinear().domain([100, 0]).range([0, height]);
    var svg = d3.select("#vizDemo > svg").attr("width", width).attr("height", height).attr("style", "border: 1px solid black").append("g").attr("transform", function (d, i) {
        return "translate(0,0)";
    });
    var stripContainer = svg.append("g").attr("id", "strip-container");
    var chainContainer = svg.append("g").attr("id", "chain-container-1");

    function drawGraph() {
        var edges = chainContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.approx) {
                return "blue";
            } else {
                return "#000000";
            }
        }).style("stroke-dasharray", function (d) {
            if (d.approx) {
                return "2,2";
            } else {
                return "";
            }
        }).style("stroke-width", function (d) {
            if (d.approx) {
                return "1";
            } else {
                return "2";
            }
        });
        var vertices = chainContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", 5).style("fill", function (d) {
            return "#FF0000";
        });
    }

    function updateErrorDiscs() {
        var discs = stripContainer.selectAll("circle").data(data.nodes).enter().append("circle").attr("cx", function (d) {
            return xScale(d.coordinates.x);
        }).attr("cy", function (d) {
            return yScale(d.coordinates.y);
        }).attr("r", function (d) {
            return d.disc ? 2 * error : 0;
        }).style("fill", "url(#lightstripe)").style("stroke", "#000").style("strokewidth", "1");
        var strips = stripContainer.selectAll("line").data(data.edges).enter().append("line").attr("x1", function (d) {
            if (!d.strip) return null;
            return xScale(data.nodes[d.source].coordinates.x);
        }).attr("y1", function (d) {
            if (!d.strip) return null;
            return yScale(data.nodes[d.source].coordinates.y);
        }).attr("x2", function (d) {
            if (!d.strip) return null;
            return xScale(data.nodes[d.target].coordinates.x);
        }).attr("y2", function (d) {
            if (!d.strip) return null;
            return yScale(data.nodes[d.target].coordinates.y);
        }).style("stroke", function (d) {
            if (d.strip) {
                return "#00EE00";
            } else {
                return "#000000";
            }
        }).style("stroke-width", function (d) {
            if (d.strip) {
                return xScale(error);
            } else {
                return 1;
            }
        }).style("stroke-opacity", function (d) {
            if (d.strip) {
                return 0.5;
            } else {
                return 1;
            }
        });
    }

    function isVertical(p1, p2) {
        return p2.x - p1.x === 0;
    }

    function getSlope(p1, p2) {
        return (p2.y - p1.y) / (p2.x - p1.x);
    }

    function getDiscTangentPoints(p1, p2) {
        if (isVertical(p1, p2)) {
            // perpendicular line is horizontal
            return [{
                'x': p2.x - error,
                'y': p2.y
            }, {
                'x': p2.x + error,
                'y': p2.y
            }];
        }

        var slope = getSlope(p1, p2);

        if (slope === 0) {
            // perpendicular line is vertical
            return [{
                'x': p2.x,
                'y': p2.y - error
            }, {
                'x': p2.x,
                'y': p2.y + error
            }];
        } else {
            // y = mx + b
            var newSlope = -1 / slope;
        }
    }

    drawGraph();
    updateErrorDiscs();
}

drawDAG();
drawParallelStrip();
drawDiscsCones();
drawDemo();