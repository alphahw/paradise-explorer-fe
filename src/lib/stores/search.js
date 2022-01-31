import { writable, derived } from 'svelte/store';
import { capitalizeFirstLetter } from '$lib/util.js';

export const search = writable(null);

export const searchInTerms = derived(search, ($search) => {
  let newSearchInTerms = null;

  if ($search) {
    newSearchInTerms = {
      type: null,
      properties: [],
      values: []
    };
    let splitSearch = $search.split('|').map((s) => s.trim());

    // Extract type
    if (splitSearch.length > 1 && splitSearch[0].length) {
      newSearchInTerms.type = capitalizeFirstLetter(splitSearch[0]);
    }

    // Extract properties, values
    let propertyKeyValSearch = splitSearch.length > 1 ? splitSearch[1] : splitSearch[0];
    let splitPropertyKeyValSearch = propertyKeyValSearch.split(',').map((s) => s.trim());

    splitPropertyKeyValSearch.forEach((keyVal) => {
      let splitKeyVal = keyVal.split('=').map((s) => s.trim());
      if (splitKeyVal.length > 1) {
        newSearchInTerms.properties.push(splitKeyVal[0]);
        newSearchInTerms.values.push(splitKeyVal[1]);
      }
    });
  }

  return newSearchInTerms;
});
