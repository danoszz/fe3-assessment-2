// https://bl.ocks.org/mcgovey/e59b5542b628fab4c356223b3505f0c0

const margin = {
  top: 100,
  right: 100,
  bottom: 100,
  left: 100,
};

let width = 960,
  height = 500,
  padding = 1.5, // separation between same-color circles
  clusterPadding = 6, // separation between different-color circles
  maxRadius = height * 0.1;

let n = 200, // total number of nodes
  m = 10, // number of distinct clusters
  z = d3.scaleOrdinal(d3.schemeCategory20),
  clusters = new Array(m);

const svg = d3
  .select("body")
  .append("svg")
  .attr("height", height)
  .attr("width", width)
  .append("g")
  .attr("transform", `translate(${width / 2},${height / 2})`);

// Define the div for the tooltip
const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// load college major data
d3.csv('../assets/data/data-1.2-herkomstleeftijd.csv', d => {
  const radiusScale = d3
    .scaleLinear()
    .domain(d3.extent(d, d => +d.Totaal_aantal))
    .range([4, maxRadius]);

  console.log(radiusScale(300000));

  const nodes = d.map((d) => {
    // scale radius to fit on the screen
    let scaledRadius = radiusScale(+d.Totaal_aantal),
      forcedCluster = +d.Totaal_percentage;

    // add cluster id and radius to array
    d = {
      cluster: forcedCluster,
      r: scaledRadius,
      aantal: d.Totaal_aantal,
      land_herkomst: d.Herkomst,
    };
    // add to clusters array if it doesn't exist or the radius is larger than another radius in the cluster
    if (!clusters[forcedCluster] || scaledRadius > clusters[forcedCluster].r) {
      clusters[forcedCluster] = d;
    }

    return d;
  });

  // append the circles to svg then style
  // add functions for interaction
  const circles = svg
    .append('g')
    .datum(nodes)
    .selectAll('.circle')
    .data(d => d)
    .enter()
    .append('circle')
    .attr('r', d => d.r)
    .attr('fill', d => z(d.cluster))
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .call(d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended),
    )
    // add tooltips to each circle
    .on('mouseover', (d) => {
      div
        .transition()
        .duration(200)
        .style("opacity", 0.9);
      div
        .html(`Er zijn ${ d.aantal } wanbetalers die komen uit<br/>In the category ${d.land_herkomst}`)
        .style("left", `${d3.event.pageX}px`)
        .style("top", `${d3.event.pageY - 28}px`);
    })
    .on('mouseout', (d) => {
      div
        .transition()
        .duration(500)
        .style("opacity", 0);
    });

  // create the clustering/collision force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .velocityDecay(0.05)
    .force('x', d3.forceX().strength(0.0008))
    .force('y', d3.forceY().strength(0.0008))
    .force('collide', collide)
    .force('cluster', clustering)
    .on('tick', ticked);

  function ticked() {
    circles.attr('cx', d => d.x).attr('cy', d => d.y);
  }

  // Drag functions used for interactivity
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

  // These are implementations of the custom forces.
  function clustering(alpha) {
    nodes.forEach((d) => {
      let cluster = clusters[d.cluster];
      if (cluster === d) return;
      let x = d.x - cluster.x,
        y = d.y - cluster.y,
        l = Math.sqrt(x * x + y * y),
        r = d.r + cluster.r;
      if (l !== r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    });
  }

  function collide(alpha) {
    const quadtree = d3
      .quadtree()
      .x(d => d.x)
      .y(d => d.y)
      .addAll(nodes);

    nodes.forEach((d) => {
      let r = d.r + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
      quadtree.visit((quad, x1, y1, x2, y2) => {
        if (quad.data && quad.data !== d) {
          var x = d.x - quad.data.x,
            y = d.y - quad.data.y,
            l = Math.sqrt(x * x + y * y),
            r = d.r + quad.data.r + (d.cluster === quad.data.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.data.x += x;
            quad.data.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    });
  }
});
