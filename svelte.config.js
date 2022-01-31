import preprocess from 'svelte-preprocess';
import autoprefixer from 'autoprefixer';

import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    preprocess({
      defaults: {
        style: 'scss'
      },
      scss: {
        // We can use a path relative to the root because
        // svelte-preprocess automatically adds it to `includePaths`
        // if none is defined.
        // prependData: `@import 'src/styles/fluid.scss';`
      },
      postcss: {
        plugins: [autoprefixer]
      }
    })
  ],
  kit: {
    adapter: adapter(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte'
  }
};

export default config;
