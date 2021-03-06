<script>
  import { onMount } from 'svelte';

  import { selectedNode } from '$lib/stores/selectedNode.js';

  import { scaleLinear, scaleOrdinal } from 'd3-scale';
  import { zoom, zoomIdentity } from 'd3-zoom';
  import { schemeCategory10 } from 'd3-scale-chromatic';
  import { select, selectAll, pointer } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

  // import { event as currentEvent } from "d3-selection"; // Needed to get drag working, see: https://github.com/d3/d3/issues/2733
  let d3 = {
    zoom,
    zoomIdentity,
    scaleLinear,
    scaleOrdinal,
    schemeCategory10,
    select,
    selectAll,
    pointer,
    drag,
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide
  };

  export let graph;

  $: $selectedNode = activeNode;

  let canvas;
  let width = 500;
  let height = 600;
  let max = 100;
  const nodeRadius = 5;
  let activeNode = false;
  // const padding = { top: 20, right: 40, bottom: 40, left: 25 };
  const padding = { top: 0, right: 0, bottom: 0, left: 0 };

  let showCard;
  let transform = d3.zoomIdentity;
  let simulation, context;
  let dpi = 1;

  $: xScale = scaleLinear()
    .domain([0, 20])
    .range([padding.left, width - padding.right]);
  // .range([padding.left, (width / dpi) - padding.right]);
  // .range([padding.left, (context && context.canvas && context.canvas.width || width) - padding.right]);

  $: yScale = scaleLinear()
    .domain([0, 12])
    .range([height - padding.bottom, padding.top]);
  // .range([(height / dpi) - padding.bottom, padding.top]);
  // .range([(context && context.canvas && context.canvas.height || height) - padding.bottom, padding.top]);

  $: xTicks = width > 180 ? [0, 4, 8, 12, 16, 20] : [0, 10, 20];

  $: yTicks = height > 180 ? [0, 2, 4, 6, 8, 10, 12] : [0, 4, 8, 12];

  // $: d3yScale = scaleLinear().domain([0, height]).range([height, 0]);

  $: links = graph.links.map((d) => {
    d.source = d.start;
    d.target = d.end;
    delete d.start;
    delete d.end;
    return d;
  });
  // $: links = graph.links.map((d) => Object.assign({}, d));
  // $: links = graph.links;

  $: nodes = graph.nodes;
  // $: nodes = graph.nodes.map((d) => {
  //   d.size = Math.pow(graph.links
  //   .filter((link) => link.source == d.id || link.target == d.id)
  //   .map((link) => link.value)
  //   .reduce((a, b) => a + b), 2);

  //   return Object.create(d);
  // });

  function groupColour(context, d) {
    let nodesize = 2 + Math.sqrt(d.size) / 5;
    let radgrad = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    radgrad.addColorStop(0, '#01abfc');
    radgrad.addColorStop(0.1, '#01abfc');
    radgrad.addColorStop(1, '#01abfc00');

    let radgrad2 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    radgrad2.addColorStop(0, '#7A17F6');
    radgrad2.addColorStop(0.1, '#7A17F6');
    radgrad2.addColorStop(1, '#7A17F600');

    let radgrad3 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    radgrad3.addColorStop(0, '#B635E3');
    radgrad3.addColorStop(0.1, '#B635E3');
    radgrad3.addColorStop(1, '#B635E300');

    let radgrad4 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    radgrad4.addColorStop(0, '#E4158B');
    radgrad4.addColorStop(0.1, '#E4158B');
    radgrad4.addColorStop(1, '#E4158B00');

    let radgrad5 = context.createRadialGradient(d.x, d.y, nodesize / 3, d.x, d.y, nodesize);
    radgrad4.addColorStop(0, '#F9123B');
    radgrad4.addColorStop(0.1, '#F9123B');
    radgrad4.addColorStop(1, '#F9123B00');
    let radgrads = [radgrad, radgrad2, radgrad3, radgrad4, radgrad5];
    return radgrads[d.group % 5];
  }

  onMount(() => {
    dpi = getDpi();
    context = canvas.getContext('2d');
    resize();

    simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 2 + Math.sqrt(max) / 4 + 130 * Math.pow(2, -d.value / 1000))
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
      // .force("center", d3.forceCenter((width * dpi) / 2, (height * dpi) / 2))
      // .force("center", d3.forceCenter((width / dpi) / 2, (height / dpi) / 2))
      //.force('collision', d3.forceCollide().radius((d) => Math.sqrt(d.size)/4))
      .on('tick', simulationUpdate);

    // title
    d3.select(context.canvas).on('mousemove', (event) => {
      const d = simulation.find(
        transform.invertX(event.offsetX * dpi),
        transform.invertY(event.offsetY * dpi),
        // transform.invertX(event.offsetX / dpi),
        // transform.invertY(event.offsetY / dpi),
        50
      );

      if (d) {
        activeNode = d;
        // $selectedNode = activeNode;
      } else {
        activeNode = false;
      }
    });

    d3.select(context.canvas).on('click', () => {
      if (activeNode) {
        showCard = JSON.parse(JSON.stringify({ id: activeNode.id, details: activeNode.details }));
      }
    });

    d3.select(canvas)
      .call(
        d3
          .drag()
          .container(canvas)
          .subject(dragsubject)
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      )
      .call(
        d3
          .zoom()
          .scaleExtent([1 / 10, 8])
          .on('zoom', zoomed)
      );
  });

  function simulationUpdate() {
    if (!(nodes.length || links.length)) return;

    context.save();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    debugger;
    links.forEach((d) => {
      // if (!d.source || !d.target) {
      //   debugger
      // }
      context.beginPath();
      context.moveTo(d.source.x, d.source.y);
      context.lineTo(d.target.x, d.target.y);
      context.globalAlpha = 0.3;
      context.strokeStyle = '#999';
      // context.lineWidth = Math.cbrt(d.value) / 2;
      context.lineWidth = 2;
      context.stroke();
      context.globalAlpha = 1;
    });

    nodes.forEach((d, i) => {
      context.beginPath();
      // context.arc(d.x, d.y, 2 + Math.sqrt(d.size) / 5, 0, 2 * Math.PI);
      context.arc(d.x, d.y, 5, 0, 2 * Math.PI);
      context.strokeStyle = 'transparent';
      context.lineWidth = 1.5;
      context.stroke();
      context.fillStyle = 'red'; //groupColour(context, d);
      context.fill();
      if (d.size > max / 50) {
        context.fillStyle = 'black';
        d.id
          .split(/(?=[A-Z])/)
          .forEach((word, index) => context.fillText(word, d.x - 10, d.y + 10 * index));
      }
    });
    context.restore();
  }

  function zoomed(currentEvent) {
    transform = currentEvent.transform;
    console.log(transform);
    simulationUpdate();
  }

  // Use the d3-force simulation to locate the node
  function dragsubject(currentEvent) {
    const node = simulation.find(
      transform.invertX(currentEvent.x * dpi),
      transform.invertY(currentEvent.y * dpi),
      50
    );
    if (node) {
      node.x = transform.applyX(node.x);
      node.y = transform.applyY(node.y);
    }
    return node;
  }

  function dragstarted(currentEvent) {
    if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
    currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
    currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
  }

  function dragged(currentEvent) {
    currentEvent.subject.fx = transform.invertX(currentEvent.x);
    currentEvent.subject.fy = transform.invertY(currentEvent.y);
  }

  function dragended(currentEvent) {
    if (!currentEvent.active) simulation.alphaTarget(0);
    currentEvent.subject.fx = null;
    currentEvent.subject.fy = null;
  }

  function getDpi() {
    return 1;
    // return window.devicePixelRatio ? Math.min(3, window.devicePixelRatio) : 1;
  }

  function resize() {
    // width = canvas.offsetWidth;
    // height = canvas.offsetHeight;
    ({ width, height } = canvas);
    console.log(transform);
    // simulationUpdate();
  }
  function fitToContainer(node) {
    dpi = getDpi();
    // Make it visually fill the positioned parent
    node.style.width = '100%';
    node.style.height = '100%';
    // ...then set the internal size to match

    node.width = node.offsetWidth * dpi;
    node.height = node.offsetHeight * dpi;
    // node.width = node.offsetWidth;
    // node.height = node.offsetHeight;

    width = node.offsetWidth * dpi;
    height = node.offsetHeight * dpi;
    // width = node.offsetWidth;
    // height = node.offsetHeight;
  }
</script>

<svelte:window on:resize={resize} />

<div on:resize={resize} class="container">
  {#if activeNode}
    <breadcrumb id="nodeDetails">
      <strong>{activeNode.id.split(/(?=[A-Z])/).join(' ')}</strong>
      <br />
      {#if activeNode.details}
        {#each Object.entries(activeNode.details) as detail}
          {detail[0]}:
          {detail[1]}
          <br />
        {/each}
      {/if}
    </breadcrumb>
  {/if}
  <canvas use:fitToContainer bind:this={canvas} />
</div>

<style>
  /*:global(body){background-color: #000}*/
  canvas {
    float: left;
  }
  .container {
    width: 100%;
    /*height: 90%;*/
    height: 100%;
    position: relative;
  }
  #nodeDetails {
    position: absolute;
    bottom: 2.5rem;
    left: 2.5rem;
    width: unset;
    /*color:#eee;*/
    color: #111;
  }
</style>
