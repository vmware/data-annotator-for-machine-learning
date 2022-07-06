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
    .attr('height', height + margin.top + margin.bottom);

  x = d3.scaleLinear().range([39, height - margin.top]);

  root = d3
    .hierarchy(options.data)
    .sum((d) => d.annotated)
    .sort((a, b) => b.value - a.value)
    .eachAfter((d) => (d.index = d.parent ? (d.parent.index = d.parent.index + 1 || 0) : 0));

  x.domain([0, root.value]);

  xAxis = (g) =>
    g
      .attr('class', 'x-axis')
      .attr('transform', `translate(40, 340) rotate(-90)`)
      .call(d3.axisTop(x).ticks(height / 80))
      .call((g) => (g.selection ? g.selection() : g).append('line').select('.domain').remove())
      .selectAll('text')
      .attr('transform', `rotate(90)`)
      .attr('x', -20)
      .attr('y', 0)
      .attr('dy', '.35em');

  yAxis = (g) =>
    g
      .attr('class', 'y-axis')
      .attr('transform', `translate(0,300) rotate(-90)`)
      .call((g) =>
        g
          .append('line')
          .attr('stroke', 'currentColor')
          .attr('y1', margin.left)
          .attr('y2', width - margin.right),
      );

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

  svg.append('g').call(yAxis);

  svg.append('g').call(xAxis);

  down(svg, root);

  return svg.node();

  function down(svg, d) {
    if (!d.children || d3.active(svg.node())) return;

    // Rebind the current node to the background.
    svg.select('.background').datum(d);

    // Define two sequenced transitions.
    const transition1 = svg.transition().duration(duration);
    const transition2 = transition1.transition();

    // Mark any currently-displayed bars as exiting.
    const exit = svg.selectAll('.enter').attr('class', 'exit');

    // Entering nodes immediately obscure the clicked-on bar, so hide it.
    exit.selectAll('rect').attr('fill-opacity', (p) => (p === d ? 0 : null));

    // Transition exiting bars to fade out.
    exit.transition(transition1).attr('fill-opacity', 0).remove();

    // Enter the new bars for the clicked-on data.
    // Per above, entering bars are immediately visible.
    const enter = bar(svg, down, d, '.y-axis').attr('fill-opacity', 0);

    // Have the text fade-in, even though the bars are visible.
    enter.transition(transition1).attr('fill-opacity', 1);

    // Transition entering bars to their new y-position.
    enter
      .selectAll('g')
      .attr('transform', stack(d.index))
      .transition(transition1)
      .attr('transform', stagger());

    // Update the x-scale domain.
    x.domain([0, d3.max(d.children, (d) => d.value)]);

    // Update the x-axis.
    svg.selectAll('.x-axis').transition(transition2).call(xAxis);

    // Transition entering bars to the new x-scale.
    enter
      .selectAll('g')
      .transition(transition2)
      .attr('transform', (d, i) => `translate(0,${barStep * i})`);

    // Color the bars as parents; they will fade to children if appropriate.
    enter
      .selectAll('rect')
      .attr('fill', color(true))
      .attr('fill-opacity', 1)
      .transition(transition2)
      .attr('fill', (d) => color(!!d.children))
      .attr('width', (d) => x(d.value) - x(0));
  }

  function bar(svg, down, d, selector) {
    barStep = (width - margin.left - margin.right) / d.children.length;
    barPadding = 0.4;
    const g = svg
      .insert('g', selector)
      .attr('class', 'enter')
      .attr('transform', `translate(60,340) rotate(-90)`)
      .attr('text-anchor', 'end')
      .style('font', '10px sans-serif');

    const bar = g
      .selectAll('g')
      .data(d.children)
      .join('g')
      .attr('cursor', (d) => (!d.children ? null : 'pointer'))
      .on('click', (event, d) =>(d.value ? down(svg, d) : null));

    bar
      .append('text')
      .attr('x', barStep / 8)
      .attr('y', -barPadding - 15)
      .attr('dy', '.35em')
      .text((d) => d.data.name)
      .style('text-anchor', 'start')
      .attr('transform', 'rotate(120 10 10)');

    bar
      .append('rect')
      .attr('x', x(0))
      .attr('width', (d) => x(d.value) - x(0))
      .attr('height', barStep * (1 - barPadding));

    let tip = d3
      .tip()
      .attr('class', 'd3-tip')
      .attr('class', 'd3-tip-category')
      .style('color', 'white')
      .style('background-color', '#333333')
      .style('padding', '0px 5px 0px 5px')
      .style('border-radius', '4px')
      .style('font-size', '10px')
      .offset([-155, barStep / 4 - barPadding])
      .html(function (event, d) {
        return '<span>' + d.value + '</span>';
      });

    bar.call(tip);

    bar
      .on('mouseover', function (event, d) {
        if (d.value) {
          tip.show(event, d);
          d3.select(this).style('opacity', 0.5);
        }
      })
      .on('mouseout', function () {
        tip.hide();
        d3.select(this).style('opacity', 1);
      });

    return g;
  }

  function up(svg, d) {
    if (!d.parent || !svg.selectAll('.exit').empty()) return;

    // Rebind the current node to the background.
    svg.select('.background').datum(d.parent);

    // Define two sequenced transitions.
    const transition1 = svg.transition().duration(duration);
    const transition2 = transition1.transition();

    // Mark any currently-displayed bars as exiting.
    const exit = svg.selectAll('.enter').attr('class', 'exit');

    // Update the x-scale domain.
    x.domain([0, d3.max(d.parent.children, (d) => d.value)]);

    // Update the x-axis.
    svg.selectAll('.x-axis').transition(transition1).call(xAxis);

    // Transition exiting bars to the new x-scale.
    exit.selectAll('g').transition(transition1).attr('transform', stagger());

    // Transition exiting bars to the parent’s position.
    exit.selectAll('g').transition(transition2).attr('transform', stack(d.index));

    // Transition exiting rects to the new scale and fade to parent color.
    exit
      .selectAll('rect')
      .transition(transition1)
      .attr('width', (d) => x(d.value) - x(0))
      .attr('fill', color(true));

    // Transition exiting text to fade out.
    // Remove exiting nodes.
    exit.transition(transition2).attr('fill-opacity', 0).remove();

    // Enter the new bars for the clicked-on data's parent.
    const enter = bar(svg, down, d.parent, '.exit').attr('fill-opacity', 0);

    enter.selectAll('g').attr('transform', (d, i) => `translate(0,${barStep * i})`);

    // Transition entering bars to fade in over the full duration.
    enter.transition(transition2).attr('fill-opacity', 1);

    // Color the bars as appropriate.
    // Exiting nodes will obscure the parent bar, so hide it.
    // Transition entering rects to the new x-scale.
    // When the entering parent rect is done, make it visible!
    enter
      .selectAll('rect')
      .attr('fill', (d) => color(!!d.children))
      .attr('fill-opacity', (p) => (p === d ? 0 : null))
      .transition(transition2)
      .attr('width', (d) => x(d.value) - x(0))
      .on('end', function (p) {
        d3.select(this).attr('fill-opacity', 1);
      });
  }

  function stack(i) {
    let value = 0;
    return (d) => {
      const t = `translate(${x(value) - x(0)},${barStep * i})`;
      value += d.value;
      return t;
    };
  }

  function stagger() {
    let value = 0;
    return (d, i) => {
      const t = `translate(${x(value) - x(0)},${barStep * i})`;
      value += d.value;
      return t;
    };
  }
}
