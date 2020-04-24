# npdev-svelte-loadable-babel

> Works with [`svelte-loadable`](https://github.com/kaisermann/svelte-loadable) (and [`npdev:svelte-loadable`](https://github.com/CaptainN/npdev-svelte-loadable)) to make code splitting a breeze!

## Usage

A `resolve` function is necessary for the cache to keep track of its loaded assets, and for SSR solutions. The `resolve` function must return a resolved path, which will be used to keep track of loadables, and to facilitate loading before hydration in SSR solutions. This [babel plugin](#babel-plugin) can help automated the inclusion of the `resolve` function. See the [svelte-loadable readme]() to learn more about how to `register` your Loadables.

The following is an example set of Loadables without using `npdev-svelte-loadable-babel`:

**App.svelte:**

```html
<script context="module">
import { register } from 'svelte-loadable'

// Loaders must be registered outside of the render tree.
const PageLoader = register({
  loader: () => import('./pages/Page.svelte'),
  resolve: () => require.resolve('./pages/Page.svelte')
})
const HomeLoader = register({
  loader: () => import('./home/Home.svelte'),
  resolve: () => require.resolve('./home/Home.svelte')
})
</script>

<script>
import { Router, Link, Route } from 'svelte-routing'
import Loadable from 'svelte-loadable'

export let url = ''
</script>

<Router url="{url}">
  <Route path="/pages/:slug" let:params>
    <Loadable loader={PageLoader} slug={params.slug}>
      <div slot="loading">Loading...</div>
    </Loadable>
  </Route>
  <Route path="/">
    <Loadable loader={HomeLoader} />
  </Route>
</Router>
```

### babel plugin

The Svelte Loadable babel plugin will automatically add the `resolve` method to your registered loaders, to cut down on manual configuration. Add the Svelte Loadable babel plugin to your plugins list in `.babelrc` or equivalent:

**.babelrc or package.json**

```json
{
  "plugins": [
    "npdev-svelte-loadable-babel"
  ]
}
```

Once configured, you can skip adding the resolve method, and let the babel plugin do it for you:

```html
<script context="module">
import { register } from 'svelte-loadable'

// Loaders must be registered outside of the render tree.
const PageLoader = register({
  loader: () => import('./pages/Page.svelte')
})
const HomeLoader = register({
  loader: () => import('./home/Home.svelte')
})
</script>
```

### The 'svelte-loadable-capture' Context for SSR

To facilitate the creation of SSR solutions, Svelte Loadable uses a context which can be set up in a `LoadableProvider` using the string identifier 'svelte-loadable-capture'. Svelte Loadable expects the context to provide a method, to which it will pass the registered loader function. For an example implementation, check out [`npdev:svelte-loadable`](https://github.com/CaptainN/npdev-svelte-loadable) built on Meteor and Svelte Loadable.

### Additional notes about Meteor and WebPack

This babel plugin is useful for anyone implementing `svelte-loadable` (or `npdev:svelte-loadable` for Meteor) to cut down on a bit of extra typing and repetition, but it was originally meant to be a complete SSR solution for Meteor. Nothing else is needed for SSR in Meteor (all Meteor needs is the `resolve` method - tehcnically, we don't even need this convenient babel plugin).

For anyone interested in creating a similar WebPack solution, you may need to add an additional parameter in addition to the resolve method, to associate the right bundle per Loadable. Checkout `react-loadable`'s [original implementation](https://github.com/jamiebuilds/react-loadable#------------server-side-rendering) for more.
