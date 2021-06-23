/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

function userChart(options) {
  height = null;
  width = null;
  data = null;
  container = null;
  d3.selectAll('.userChartBar svg').remove();
  d3.selectAll('.d3-tip-user').remove();

  height = 350;
  width = options.width;
  margin = { top: 20, right: 20, bottom: 50, left: 40 };
  data = options.data;
  data = Object.assign(
    data
      .map(({ fullName, completeCase }) => ({ name: fullName, value: +completeCase }))
      .sort((a, b) => b.value - a.value),
  );
  container = options.container;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom)
    .call(zoom);

  let tip = d3
    .tip()
    .attr('class', 'd3-tip')
    .attr('class', 'd3-tip-user')
    .style('color', 'white')
    .style('background-color', '#333333')
    .style('padding', '0px 5px 0px 5px')
    .style('border-radius', '4px')
    .style('font-size', '10px')
    .offset([-10, 0])
    .html(function (d) {
      return '<span>' + d.value + '</span>';
    });

  svg.call(tip);

  var x = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  var y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  var xAxis = (g) =>
    g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('transform', 'rotate(20 -10 10)');

  var yAxis = (g) =>
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
    .attr('x', (d) => x(d.name) + (x.bandwidth() - d3.min([x.bandwidth(), 150])) / 2)
    .attr('y', (d) => y(d.value))
    .attr('height', (d) => y(0) - y(d.value))
    .attr('width', d3.min([x.bandwidth(), 150]))
    .on('mouseover', function (d) {
      tip.show(d, this);
      d3.select(this).style('opacity', 0.5);
    })
    .on('mouseout', function (d) {
      tip.hide();
      d3.select(this).style('opacity', 1);
    });

  svg.append('g').attr('class', 'x-axis').call(xAxis);

  svg.append('g').attr('class', 'y-axis').call(yAxis);

  // return svg.node();
  function zoom(svg) {
    const extent = [
      [margin.left, margin.top],
      [width - margin.right, height - margin.top],
    ];

    svg.call(
      d3.zoom().scaleExtent([1, 5]).translateExtent(extent).extent(extent).on('zoom', zoomed),
    );

    function zoomed() {
      x.range([margin.left, width - margin.right].map((d) => d3.event.transform.applyX(d)));
      svg
        .selectAll('.bars rect')
        .attr('x', (d) => x(d.name))
        .attr('width', x.bandwidth());
      svg.selectAll('.x-axis').call(xAxis);
    }
  }
}
