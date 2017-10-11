let svg = d3.select('svg'),
  margin = 100,
  diameter = +svg.attr("width"),
  g = svg
    .append("g")
    .attr("transform", `translate(${diameter / 2},${diameter / 2})`); // make graph fit to screen

// set color range for colors
const color = d3
  .scaleLinear()
  .domain([-1, 5])
  .range(["hsl(225,94%,51%)", "hsl(168,74%,60%)"]) // //(290,60%,61
  .interpolate(d3.interpolateHcl);

// apply pack layout
const pack = d3
  .pack()
  .size([diameter - margin, diameter - margin])
  .padding(2);

// Set different kind of children nodes
const childrenNodes = {
  aantal_18_35: "18 tot 35",
  aantal_35_50: "35 tot 50",
  aantal_50_60: "50 tot 60",
  aantal_60plus: "60 plus"
};

// ok here we go, import data
d3.json('../assets/data/data-manual.json', (error, root) => {
  if (error) throw error;

  root = d3
    .hierarchy(root)
    .sum(d => d.Totaal_aantal)
    .sort((a, b) => a.value - b.value);

  let focus = root,
    nodes = pack(root).descendants(),
    view;

  const circle = g
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr(
      "class",
      d =>
        d.parent ? (d.children ? "node" : "node node--leaf") : "node node--root"
    )
    .style("fill", d => (d.children ? color(d.depth) : null))
    .on("click", d => {
      if (focus !== d) zoom(d), d3.event.stopPropagation();
    });

  const text = g
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .style("fill-opacity", d => (d.parent === root ? 1 : 0))
    .style("display", d => (d.parent === root ? "inline" : "none"))
    .text(d => `${d.data.name} ${d.data.Totaal_aantal}`); // Insert custom data

  const node = g.selectAll("circle,text");

  svg.style("background", color(-1)).on("click", () => {
    zoom(root);
  });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    const focus0 = focus;
    focus = d;

    const transition = d3
      .transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween("zoom", d => {
        const i = d3.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 + margin
        ]);
        return function(t) {
          zoomTo(i(t));
        };
      });

    transition
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

  function zoomTo(v) {
    const k = diameter / v[2];
    view = v;
    node.attr(
      "transform",
      d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    circle.attr("r", d => d.r * k);
  }
});
