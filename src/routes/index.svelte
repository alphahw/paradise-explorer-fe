<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  // import SearchInput from '$lib/components/SearchInput.svelte'
  import ForceGraph from '$lib/components/ForceGraph.svelte';

  import { selectedNode } from '$lib/stores/selectedNode.js';
  // import { search, searchInTerms } from '$lib/stores/search.js';

  import neo4jApi from '$lib/api/neo4jApi.js';

  // let searchPlaceholder = "Type | prop = value, prop2 = value2"

  let isLoading = false;
  let loadingCopy = 'Please wait…';

  // let details = [
  //   ['node_id', 'XXX'],
  //   ['name', 'John Doe']
  // ]

  if ($selectedNode) {
    console.log($selectedNode);
  }

  // if ($search) {
  // $: console.log('Search: '+$search)
  // $: console.log('SearchInTerms: ', $searchInTerms)
  // }

  let data = { nodes: [], links: [] };
  onMount(async () => {
    // Load some initial data
    // let _data = await neo4jApi.getNodesAndLinks();
    let _data = await neo4jApi.getNodesAndLinks('Intermediary', [], [], 0, 1);

    // data = {
    //   nodes: _data.nodes.slice(0, 100),
    //   links: _data.links.slice(0, 100)
    // }
    console.log(_data);
    data = _data;
  });
</script>

<header>
  <h1>Paradise Explorer</h1>
  <!-- <SearchInput classNames="search" placeholder={searchPlaceholder}/> -->
</header>

<div class="chart">
  <ForceGraph graph={data} />
</div>

{#if $selectedNode}
  <aside class="infobox" transition:fade>
    <section class="infobox-inner">
      {#if details}
        <dl>
          {#each details as detail, index}
            <div>
              <dt>{detail[0]}</dt>
              <dd>{detail[1]}</dd>
            </div>
          {/each}
        </dl>
      {/if}
    </section>
  </aside>
{/if}

{#if isLoading}
  <div class="loading" transition:fade>
    {#if loadingCopy}
      <div>
        <p>{loadingCopy}</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  header {
    /*    height: 10vh;*/
    position: fixed;
    width: 100vw;
    padding: 2.5rem;
    z-index: 2;

    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    h1 {
      margin: 0 0 1rem;
    }

    /*    button {
      margin-left: auto;
    }*/
  }
  .chart {
    width: 100%;
    max-width: 100%;
    /*max-width: 640px;*/
    /*height: calc(100% - 4em);*/
    height: 100vh;
    /*    min-height: 280px;
    max-height: 480px;*/
    max-height: 100%;
    margin: 0 auto;
  }

  .infobox {
    position: fixed;
    left: auto;
    right: 0;
    top: 0;
    bottom: 0;
    padding-top: 8rem;
    padding: 8rem 0 2.5rem 0;
    display: flex;
    width: 30vw;
  }

  .infobox-inner {
    background: white;
    border: 1px solid #ddd;
    border-radius: 1rem 0 0 1rem;
    box-shadow: 0px 5px 10px 0px rgba(34, 34, 34, 0.05);
    flex-grow: 1;
    padding: 2rem;
  }

  .loading {
    position: fixed;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(2px);
    z-index: 1;
  }
</style>
