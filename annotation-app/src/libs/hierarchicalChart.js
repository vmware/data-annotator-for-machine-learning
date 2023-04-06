/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
function hierarchicalChart(options) {
  height = null;
  width = null;
  data = null;
  container = null;
  d3.selectAll('.categoryChartBar svg').remove();
  d3.selectAll('.d3-tip-category').remove();
  height = 350;
  width = options.width;
  margin = { top: 20, right: 20, bottom: 50, left: 40 };
  data = options.data;
  container = options.container;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', options.width)
    .attr('height', height + margin.top + margin.bottom).call(zoom);;

  root = d3
    .hierarchy(options.data)
    .sum((d) => d.annotated)
    .sort((a, b) => b.value - a.value)
    .eachAfter((d) => (d.index = d.parent ? (d.parent.index = d.parent.index + 1 || 0) : 0));

  var y = d3
    .scaleLinear()
    .domain([0, d3.max(root.children, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  var yAxis = (g) => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call((g) => g.select('.domain'));

  var x = d3
    .scaleBand()
    .domain(root.children.map((d) => d.data.name))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  var xAxis = (g) =>
    g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('transform', 'rotate(20 -10 10)');

  svg
    .append('rect')
    .attr('class', 'background')
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .attr('width', width)
    .attr('height', height)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => up(svg, d));

  color = d3.scaleOrdinal([true, false], ['steelblue', '#aaa']);

  duration = 0;

  svg.append('g').attr('class', 'y-axis').call(yAxis);

  svg.append('g').attr('class', 'x-axis').call(xAxis);

  down(svg, root);

  return svg.node();

  function down(svg, d) {
    if (!d.children || d3.active(svg.node())) return;

    // Rebind the current node to the background.
    svg.select('.background').datum(d);

    // Mark any currently-displayed bars as exiting.
    const exit = svg.selectAll('.enter').attr('class', 'exit');

    // Entering nodes immediately obscure the clicked-on bar, so hide it.
    exit.selectAll('rect').attr('fill-opacity', (p) => (p === d ? 0 : null));

    // Transition exiting bars to fade out.
    exit.attr('fill-opacity', 0).remove();

    // Update the x-scale domain.
    y.domain([0, d3.max(d.children, (d) => d.value)]);

    // Update the x-axis.
    svg.selectAll('.y-axis').call(yAxis);

    // Enter the new bars for the clicked-on data.
    // Per above, entering bars are immediately visible.
    const enter = bar(svg, down, d, '.x-axis').attr('fill-opacity', 0);

    // Have the text fade-in, even though the bars are visible.
    enter.attr('fill-opacity', 1);

    // Color the bars as parents; they will fade to children if appropriate.
    enter
      .selectAll('rect')
      .attr('fill', color(true))
      .attr('fill-opacity', 1)
      .attr('fill', (d) => color(!!d.children))
      .attr('height', (d) => y(0) - y(d.value));
  }

  function bar(svg, down, d, selector) {
    const g = svg
      .insert('g', selector)
      .attr('class', 'enter')
      .attr('text-anchor', 'end')
      .style('font', '10px sans-serif');

    const bar = g
      .selectAll('g')
      .data(d.children)
      .join('g')
      .attr('cursor', (d) => (!d.children ? null : 'pointer'))
      .on('click', (event, d) => (d.value ? down(svg, d) : null));

    x = d3
      .scaleBand()
      .domain(d.children.map((d) => d.data.name))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    svg.selectAll('.x-axis').call(xAxis);

    bar.attr('class', 'bars')
      .append('rect')
      .attr('x', (d) => x(d.data.name) + (x.bandwidth() - d3.min([x.bandwidth(), 150])) / 2)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => y(0) - y(d.value))
      .attr('width', d3.min([x.bandwidth(), 150]));

    hierTip = options.tip;
    hierTip
      .attr('class', 'd3-tip')
      .attr('class', 'd3-tip-category')
      .style('color', 'white')
      .style('background-color', '#333333')
      .style('padding', '0px 5px 0px 5px')
      .style('border-radius', '4px')
      .style('font-size', '10px')
      .offset([-10, 0])
      .html(function (event, d) {
        return '<span>' + d.value + '</span>';
      });

    bar.call(hierTip);

    bar
      .selectAll('rect')
      .on('mouseover', function (event, d) {
        if (d.value) {
          hierTip.show(event, d);
          d3.select(this).style('opacity', 0.5);
        }
      })
      .on('mouseout', function () {
        hierTip.hide();
        d3.select(this).style('opacity', 1);
      });

    return g;
  }

  function up(svg, d) {
    if (!d.parent || !svg.selectAll('.exit').empty()) return;

    // Rebind the current node to the background.
    svg.select('.background').datum(d.parent);

    // Mark any currently-displayed bars as exiting.
    const exit = svg.selectAll('.enter').attr('class', 'exit');

    // Update the x-scale domain.
    y.domain([0, d3.max(d.parent.children, (d) => d.value)]);

    // Update the x-axis.
    svg.selectAll('.y-axis').call(yAxis);


    // Transition exiting rects to the new scale and fade to parent color.
    exit
      .selectAll('rect')
      .attr('width', (d) => d3.min([x.bandwidth(), 150]))
      .attr('fill', color(true));

    // Transition exiting text to fade out.
    // Remove exiting nodes.
    exit.attr('fill-opacity', 0).remove();

    // Enter the new bars for the clicked-on data's parent.
    const enter = bar(svg, down, d.parent, '.exit').attr('fill-opacity', 0);

    enter.attr('fill-opacity', 1);

    enter
      .selectAll('rect')
      .attr('fill', (d) => color(!!d.children))
      .attr('height', (d) => y(0) - y(d.value))
      .on('end', function (p) {
        d3.select(this).attr('fill-opacity', 1);
      });
  }

  function zoom(svg) {
    const extent = [
      [margin.left, margin.top],
      [width - margin.right, height - margin.top],
    ];

    svg.call(
      d3.zoom().scaleExtent([1, 5]).translateExtent(extent).extent(extent).on('zoom', zoomed),
    );

    function zoomed(event, d) {
      x.range([margin.left, width - margin.right].map((d) => event.transform.applyX(d)));
      svg
        .selectAll('.bars rect')
        .attr('x', (d) => x(d.data.name))
        .attr('width', x.bandwidth());
      svg.selectAll('.x-axis').call(xAxis);
    }
  }

}
