/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

function categoryChart(options) {
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
  data = Object.assign(
    data
      .map(({ label, annotated }) => ({ name: label, value: +annotated }))
      .sort((a, b) => b.value - a.value),
  );
  container = options.container;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom)
    .call(zoom);

  tip = options.tip;
  tip
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

  svg.call(tip);

  x = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  xAxis = (g) =>
    g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('transform', 'rotate(20 -10 10)');

  yAxis = (g) =>
    g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.select('.domain'));

  svg
    .append('g')
    .attr('class', 'bars')
    .attr('fill', 'steelblue')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d) => x(d.name))
    .attr('y', (d) => y(d.value))
    .attr('height', (d) => y(0) - y(d.value))
    .attr('width', x.bandwidth())
    .on('mouseover', function (event, d) {
      tip.show(event, d);
      d3.select(this).style('opacity', 0.5);
    })
    .on('mouseout', function (event, d) {
      tip.hide();
      d3.select(this).style('opacity', 1);
    });

  svg.append('g').attr('class', 'x-axis').call(xAxis);

  svg.append('g').attr('class', 'y-axis').call(yAxis);

  return svg.node();

  function zoom(svg) {
    const extent = [
      [margin.left, margin.top],
      [width - margin.right, height - margin.top],
    ];

    svg.call(
      d3.zoom().scaleExtent([1, 45]).translateExtent(extent).extent(extent).on('zoom', zoomed),
    );
    function zoomed(event, d) {
      x.range([margin.left, width - margin.right].map((d) => event.transform.applyX(d)));
      svg
        .selectAll('.bars rect')
        .attr('x', (d) => x(d.name))
        .attr('width', x.bandwidth());
      svg.selectAll('.x-axis').call(xAxis);
    }
  }
}
