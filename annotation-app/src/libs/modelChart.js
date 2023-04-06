/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

function modelChart(options) {
  model_height = null;
  model_width = null;
  data = null;
  container = null;
  d3.selectAll('.modelChartBar svg').remove();
  d3.selectAll('.d3-tip-model').remove();

  model_height = 390;
  model_width = options.width;
  frequency = options.frequency;
  threshold = options.threshold;
  estimator = options.estimator;
  (samplingStrategy = options.samplingStrategy),
    (model_margin = { top: 50, right: 250, bottom: 10, left: 40 });
  data = options.data;
  data = Object.assign(
    data.map(({ index, accuracy }) => ({ name: index, value: +accuracy })),
    { y: 'Accuracy' },
  );
  container = options.container;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', model_width)
    .attr('height', model_height + model_margin.top + model_margin.bottom)
    .style('margin-top', '8')
    .call(zoom);

  line = (x) =>
    d3
      .line()
      .defined((data) => !isNaN(data.value))
      .x((data) => x(data.name))
      .y((data) => y(data.value))
      .curve(d3.curveLinear);

  //  NOTE: xAxis can auto combined!!!!!!!
  var x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.name))
    .nice()
    .range([model_margin.left, model_width - model_margin.right - 110]);
  //  NOTE: xAxis not auto combined,will list every ticket!!!!!!!
  //  var x = d3.scaleBand()
  // 	.domain(data.map(d => d.name))
  // 	.range([margin.left, width - margin.right])
  // 	.padding(1)
  //  NOTE: 3 point then 3 x tickets, xAxis is very short!!!!!!!
  //  var x = d3.scaleOrdinal()
  // 	.domain(data.map(d => d.name))
  // 	// .range([margin.left, width - margin.right])
  // 	.range(data.map(d => d.name))

  var y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .nice()
    .range([model_height - model_margin.bottom, model_margin.top]);

  var xAxis = svg
    .append('g')
    .attr('transform', `translate(0,${model_height - model_margin.bottom})`)
    .call(d3.axisBottom(x).ticks(10).tickSizeOuter(0));

  var yAxis = svg
    .append('g')
    .attr('transform', `translate(${model_margin.left},0)`)
    .call(d3.axisLeft(y));

  // Add X axis label:
  svg
    .append('text')
    .attr('text-anchor', 'end')
    .attr('x', model_width - model_margin.right - 110)
    .attr('y', model_height + 35)
    .text('# Annotated Tickets');

  // Add Y axis label:
  svg
    .append('text')
    .attr('text-anchor', 'end')
    .attr('x', model_margin.left)
    .attr('y', 30)
    .text(data.y)
    .attr('text-anchor', 'start');

  // Handmade legend
  svg
    .append('circle')
    .attr('cx', model_width - model_margin.right - 10)
    .attr('cy', 100)
    .attr('r', 4)
    .style('fill', 'steelblue');
  svg
    .append('circle')
    .attr('cx', model_width - model_margin.right - 10)
    .attr('cy', 160)
    .attr('r', 4)
    .style('fill', 'steelblue');
  svg
    .append('circle')
    .attr('cx', model_width - model_margin.right - 10)
    .attr('cy', 220)
    .attr('r', 4)
    .style('fill', 'steelblue');
  svg
    .append('circle')
    .attr('cx', model_width - model_margin.right - 10)
    .attr('cy', 250)
    .attr('r', 4)
    .style('fill', 'steelblue');

  svg
    .append('text')
    .attr('x', model_width - model_margin.right)
    .attr('y', 100)
    .text('Estimator: ')
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle');

  svg
    .append('text')
    .attr('x', model_width - model_margin.right)
    .attr('y', 130)
    .text(estimator)
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle');

  svg
    .append('text')
    .attr('x', model_width - model_margin.right)
    .attr('y', 160)
    .text('Sampling Strategy: ')
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle');

  svg
    .append('text')
    .attr('x', model_width - model_margin.right)
    .attr('y', 190)
    .text(samplingStrategy)
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle');

  svg
    .append('text')
    .attr('x', model_width - model_margin.right)
    .attr('y', 220)
    .text('Threshold: ' + threshold)
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle');
  svg
    .append('text')
    .attr('x', model_width - model_margin.right)
    .attr('y', 250)
    .text('Frequency: ' + frequency)
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle');

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg
    .append('defs')
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', model_width - model_margin.right + 6)
    .attr('height', model_height);

  var grid = svg.selectAll('.grid').data(y.ticks(10)).enter().append('g').attr('class', 'grid');

  grid
    .append('line')
    .attr('y1', y)
    .attr('y2', y)
    .attr('x1', model_margin.left)
    .attr('x2', model_width - model_margin.right - 110)
    .attr('stroke', '#000000')
    .attr('stroke-width', 0.1)
    .attr('shape-rendering', 'crispEdges');
  // .attr("stroke-dasharray", 5, 5)
  // .attr("stroke-opacity", 5)

  linePath = svg.append('g').attr('transform', `translate(0, 0)`);

  const path = linePath
    .append('g')
    .attr('clip-path', 'url(#clip)')
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', line(x));

  var Tooltip = d3
    .select(container)
    .append('div')
    .style('position', 'fixed')
    .style('z-index', '10')
    .style('color', 'white')
    .style('background-color', 'black')
    .style('border-radius', '5px')
    .style('padding', '5px')
    .style('visibility', 'hidden')
    .style('font-size', '12px')
    .style('font-weight', 'bold');

  // Hover line.
  var hoverLineGroup = svg.append('g').attr('class', 'hover-line');
  var hoverLine = hoverLineGroup
    .append('line')
    .attr('x1', 50)
    .attr('x2', 10)
    .attr('y1', 0)
    .attr('y2', model_height - model_margin.bottom)
    .attr('stroke', '#000000')
    .attr('stroke-width', 0.1)
    .attr('shape-rendering', 'crispEdges')
    .style('visibility', 'hidden');

  // Hide hover line by default.
  hoverLineGroup.style('opacity', 1e-6);

  var clipDot = svg
    .append('defs')
    .append('clipPath')
    .attr('id', 'clipDot')
    .append('rect')
    .attr('width', model_width - model_margin.right + 6)
    .attr('height', model_height)
    .attr('x', 0)
    .attr('y', 0);

  lineDot = svg.append('g').attr('clip-path', 'url(#clipDot)').attr('transform', `translate(0, 0)`);

  lineDot
    .append('g')
    .selectAll('dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'myCircle')
    .attr('cx', function (d) {
      return x(d.name);
    })
    .attr('cy', function (d) {
      return y(d.value);
    })
    .attr('r', 4)
    .attr('fill', 'white')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .on('mouseover', function (event, d) {
      d3.select(this).style('fill', 'steelblue');
      d3.select(this).attr('r', 7);
      Tooltip.style('visibility', 'visible').html(
        'Annotated Tickets: ' + d.name + '<br/>' + 'Accuracy: ' + d.value,
      );
      hoverLine.style('visibility', 'visible');
      return;
    })
    .on('mousemove', function (event, d) {
      Tooltip.style('top', event.pageY - 30 + 'px').style('left', event.pageX + 10 + 'px');
      var mouse_x = d3.pointer(event)[0];
      hoverLine.attr('x1', mouse_x).attr('x2', mouse_x);
      hoverLineGroup.style('opacity', 1);
      return;
    })
    .on('mouseout', function (event, d) {
      d3.select(this).style('fill', 'white');
      d3.select(this).attr('r', 4);
      hoverLine.style('visibility', 'hidden');
      Tooltip.style('visibility', 'hidden');
      return;
    });

  return svg.node();

  function zoom(svg, data) {
    const extent = [
      [model_margin.left, model_margin.top],
      [model_width - model_margin.right, model_height - model_margin.top],
    ];
    svg.call(
      d3
        .zoom()
        .scaleExtent([1, options.data.length - 1])
        .translateExtent(extent)
        .extent(extent)
        .on('zoom', zoomed),
    );

    function zoomed(event) {
      // recover the new scale
      var newX = event.transform.rescaleX(x);
      // update axes with these new boundaries
      xAxis.call(d3.axisBottom(newX).ticks(10).tickSizeOuter(0));
      svg.selectAll('.myCircle').attr('cx', function (d) {
        return newX(d.name);
      });
      path.attr('d', line(newX));
    }
  }
}
