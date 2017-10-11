// All credits go to Mike Bostock
// Source: https://bl.ocks.org/mbostock/7607535

let svg = d3.select('svg'),
  margin = 100,
  diameter = +svg.attr("width"),
  g = svg
    .append("g")
    .attr("transform", `translate(${diameter / 2},${diameter / 2})`); // make graph fit to screen

// set color range for colors
const color = d3
  .scaleLinear()
  .domain([0, 5])
  .range(["hsl(225,94%,51%)", "hsl(168,74%,60%)"]) // set custom color range
  .interpolate(d3.interpolateHcl);

// apply pack layout
const pack = d3
  .pack()
  .size([diameter - margin, diameter - margin])
  .padding(2);

// ok here we go, import data
d3.json('https://danoszz.github.io/fe3-assessment-2/assets/data/data-manual.json', (error, root) => {
  if (error) throw error;

  root = d3
    .hierarchy(root)
    .sum(d => d.Totaal_aantal) // pick this key value for the size for the graphy, and later nodes.
    .sort((a, b) => a.value - b.value);

  let focus = root,
    nodes = pack(root).descendants(), // nodes are declared to be the descendants of the root graph
    view;

  const circle = g // append circles
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr(
      "class",
      d =>
        d.parent ? (d.children ? "node" : "node node--leaf") : "node node--root" // give class to parent and to children, works dynamicly
    )
    .style("fill", d => (d.children ? color(d.depth) : null)) // style the nodes depending on the depth in the graph
    .on("click", d => {
      if (focus !== d) zoom(d), d3.event.stopPropagation(); //Calling stopPropagation will only prevent propagation of a single event at a time, and these are separate events. source; https://stackoverflow.com/questions/11674886/stoppropagation-with-svg-element-and-g#11679433
    });

  const text = g // create and append text labels
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .style("fill-opacity", d => (d.parent === root ? 1 : 0))
    .style("display", d => (d.parent === root ? "inline" : "none"))
    .text(d => `${d.data.name} ` + `(${d.data.Totaal_aantal})`); // Insert data from nodes

  const node = g.selectAll("circle,text");

  svg.style("background", color(-1)).on("click", () => {
    zoom(root); // change color depending on the depth of the visualization
  });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) { // create zoom function for smooth focus shifts
    const focus0 = focus;
    focus = d;

    const transition = d3
      .transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween("zoom", d => { // run costom code between transition aka tween
        const i = d3.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 + margin
        ]);
        return function(t) {
          zoomTo(i(t));
        };
      });

    transition // change visibility of the labels during the zoom
      .selectAll("text")
      .filter(function(d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .style("fill-opacity", d => (d.parent === focus ? 1 : 0))
      .on("start", function(d) {
        if (d.parent === focus) this.style.display = "inline";
      })
      .on("end", function(d) {
        if (d.parent !== focus) this.style.display = "none";
      });
  }

  function zoomTo(v) { // tell where the nodes should transform to when zooming
    const k = diameter / v[2];
    view = v;
    node.attr(
      "transform",
      d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    circle.attr("r", d => d.r * k);
  }
});
