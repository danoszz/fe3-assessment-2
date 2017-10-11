// All the credits go to the allmighty Mike Bostock
// Source: https://bl.ocks.org/mbostock/7882658, edited by @danoszz for styling purposes

let width = 960,
  height = 500,
  padding = 1.5, // separation between same-color nodes
  clusterPadding = 6, // separation between different-color nodes
  maxRadius = 12;

let n = 200, // total number of nodes
  m = 10; // number of distinct clusters

const color = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(m));

// The largest node for each cluster.
const clusters = new Array(m);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));


const nodes = d3.range(n).map(() => {
  let i = Math.floor(Math.random() * m),
    r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
    d = { cluster: i, radius: r };
  if (!clusters[i] || r > clusters[i].radius) clusters[i] = d;
  return d;
});

// Use the pack layout to initialize node positions.
d3.pack(nodes)
    .size([width, height])
    .radius(function(d) { return d.radius * d.radius; });

    var force = d3.forceSimulation(nodes)
    	.force('manybody', d3.forceManyBody())
    	.force('cluster', cluster)
    	.force('collide', collide)
      .on("tick", tick);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const node = svg
  .selectAll("circle")
  .data(nodes)
  .enter()
  .append("circle")
  .style("fill", d => color(d.cluster))
  .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

node
  .transition()
  .duration(750)
  .delay((d, i) => i * 5)
  .attrTween("r", d => {
    const i = d3.interpolate(0, d.radius);
    return function (t) {
      return (d.radius = i(t));
    };
  });

function tick(e) {
  node
    .each(cluster(10 * e.alpha * e.alpha))
    .each(collide(0.5))
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
}

// Move d to be adjacent to the cluster node.
function cluster(alpha) {
  return function(d) {
    const cluster = clusters[d.cluster];
    if (cluster === d) return;
    let x = d.x - cluster.x,
      y = d.y - cluster.y,
      l = Math.sqrt(x * x + y * y),
      r = d.radius + cluster.radius;
    if (l != r) {
      l = (l - r) / l * alpha;
      d.x -= x *= l;
      d.y -= y *= l;
      cluster.x += x;
      cluster.y += y;
    }
  };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
  var quadtree = d3.quadtree(nodes);
  return function(d) {
    let r = d.radius + maxRadius + Math.max(padding, clusterPadding),
      nx1 = d.x - r,
      nx2 = d.x + r,
      ny1 = d.y - r,
      ny2 = d.y + r;
    quadtree.visit((quad, x1, y1, x2, y2) => {
      if (quad.point && quad.point !== d) {
        let x = d.x - quad.point.x,
          y = d.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r =
            d.radius +
            quad.point.radius +
            (d.cluster === quad.point.cluster ? padding : clusterPadding);
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
