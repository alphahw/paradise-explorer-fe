<script>
  import { search } from '$lib/stores/search.js';

  export let classNames;

  export let placeholder = '';
  export let value = '';

  let rawValue = '';

  const processValue = (newValue) => {
    if (newValue.length) {
      $search = newValue;
    }
  };

  export let debounceWait = 300;

  let debouncedProcessingTimer;
  const debouncedProcessing = (newValue) => {
    clearTimeout(debouncedProcessingTimer);
    debouncedProcessingTimer = setTimeout(() => {
      processValue(newValue);
    }, debounceWait);
  };

  $: debouncedProcessing(rawValue);
</script>

<input class={classNames} bind:value={rawValue} {placeholder} type="text" />

<style>
  input {
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 1rem;
    box-shadow: 0px 5px 10px 0px rgba(34, 34, 34, 0.05);
    min-width: 20rem;
  }
</style>
