npdev:svetle-loadable
=====================

An easy way to split code at the component level dynamic imports for Meteor. This is a port from the original `svelte-loadable` project to Meteor, which adds SSR and hydration support, with a few other enhancements.

Install with:

```
meteor add npdev:svelte-loadable
meteor npm i svelte-loadable
```

Check out [this starter](https://github.com/CaptainN/meteor-svelte-starter) for example integration.

> Dynamically load a svelte component. Based on [svelte-loadable](https://github.com/kaisermann/svelte-loadable).

## Usage

Just pass a `loader` method which return a dynamic module import:

```html
<script>
import Loadable from 'meteor/npdev:svelte-loadable'
</script>

<Loadable loader={() => import('./AsyncComponent.svelte')} />
```

### Props

- `loader`: a function which `import()` your component to the `<Loadable>` component.
- `delay`: minimum delay in `msecs` for showing the `loading slot`. Default: 200
- `timeout`: time in `msecs` for showing the `timeout slot`.

Any other prop will be passed directly onto the rendered component if no `success` slot is defined:

```html
<Loadable loader={...} foo="cookie" bar="potato" />
<!-- `foo` and `bar` will be available to the rendered component -->
```

If a `success` slot is used, the passed props will be available in the slots `props` object:

```html
<Loadable loader={...} foo="cookie" bar="potato">
  <div slot="success" let:component let:props>
    <svelte:component this="{component}" {...props} />
    <!-- `foo` and `bar` will be available to the rendered component -->
  </div>
</Loadable>
```

### Slots

- `loading`: customizes the loading state;
- `error`: customizes the error state. You can `let:error` to have access to the error variable;
- `timeout`: customizes the timeout state. Will only appear if `timeout` prop is defined;
- `success`: customizes the imported component render (add props, etc). You can `let:component` to access the imported component and `let:props` to get all props passed to the component that are not related to `svelte-loadable`.

#### Basic Example:

```html
<script>
  import Loadable from 'svelte-loadable'
</script>

<Loadable bind:this={loadable} loader={() => import('./AsyncComponent.svelte')}>
  <div slot="loading">Loading...</div>
  <div slot="error" let:error>
    {error}
    <br>
    <button on:click="loadable.load()">Try again</button>
  </div>
</Loadable>
```

### Methods
  - Use the `.load()` method to retry loading.

### Registering a loader
#### Or, preventing "flash of loading"

By default, Svelte Loadable will dynamically load the specified loader (import statement) every time the component is initialized and reinitialized. This creates a delay between initial rendering, and rending the loaded component, even for components which have previously been loaded. To work around that, Svelte Loadable provides an optional cache, which can be used to predefine a loader, and keep track of whether it has already been loaded. When a loader is registered, it will render immediately on the next initialization.

To set that up, you'll need to `register` the loader at definition time in a module script block, instead of passing the loader directly to the loadable component instance, then pass the resulting loader on to the loadable component. It looks like this (with `svelte-routing`):

**App.svelte:**

```html
<script context="module">
import { register } from 'meteor/npdev:svelte-loadable'

// Loaders must be registered outside of the render tree.
const PageLoader = register({
  loader: () => import('./pages/Page.svelte')
})
const HomeLoader = register({
  loader: () => import('./home/Home.svelte')
})
</script>

<script>
import { Router, Link, Route } from 'svelte-routing'
import { Loadable } from 'meteor/npdev:svelte-loadable'

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

Another advantage is that if the same module is registered in two different places in the tree, the previous loader will be used instead of creating a second loader.

This comes with additional benefits and opportunities as well. There is now a `preloadAll` method, which can be used to proactively (and recursively) preload all the modules after the initial render of the application, if desired. That method can also be used server side to preload all the necessary components to pull off server side rendering (SSR).

### Additional Methods

#### preloadAll()

Preloads all registered Loaders. Works server side, and client side.

```js
import { preloadAll } from 'meteor/npdev:svelte-loadable'

// Somewhere in your code, after the initial tree is rendered:
preloadAll();
```

### Server Side Rendering with Meteor

Server side rendering works only with registered loaders with an additional property. There are a few stages to note for Server Side Rendering.

On the server, Meteor's `meteor/server-render` can be used along with `svelte:compiler`'s SSR support, to render there. In order to properly render loadables, they'll need to be preloaded into memory on the server. This should only be done once on app startup, not during each request.

```js
import { onPageLoad } from 'meteor/server-render'
import { preloadAll } from 'meteor/npdev:svelte-loadable'
import App from '/imports/ui/App.svelte'

preloadAll().then(() => onPageLoad((sink) => {
  const loadableHandle = {}
  const { html, css, head } = App.render({ loadableHandle, url: sink.request.url.pathname })

  sink.appendToHead(`<style>${css.code}</style>`)
  sink.appendToHead(head)
  sink.renderIntoElementById('root', html)
  sink.appendToBody(loadableHandle.toScriptTag())
}))
```

For efficiency on the client side, during SSR Svelte Loadable will capture all the loadables used for each server rendered route, send that to the client through a method to output that list as a script tag (or as EJSON). To set that up, wrap your application with `LoadableProvider'. *Note the extra "resolve" function property in the registered loader object.*

```html
<script context="module">
import { register } from 'meteor/npdev:svelte-loadable'

// Loaders must be registered outside of the render tree.
const PageLoader = register({
  loader: () => import('./pages/Page.svelte'),
  resolve: () => require.resolve('./pages/Page.svelte')
})
const HomeLoader = register({
  loader: () => import('./home/Home.svelte'),
  resolve: () => require.resolve('./pages/Page.svelte')
})
</script>

<script>
import { Router, Link, Route } from 'svelte-routing'
import { Loadable, LoadableProvider } from 'meteor/npdev:svelte-loadable'

// Export the loadable handle, and pass it to the LoadableProvider below
export let loadableHandle = {}
export let url = ''
</script>

<LoadableProvider handle={loadableHandle}>
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
</LoadableProvider>
```

The last piece is client hydration. The `loadHydratables` method will parse the script tag created by `loadableHandle.toScriptTag()` and begin to load all the loadables in the list, and return a promise. The promise will be resoled when all the necessary loadables have been loaded, allowing for seamless hydration.

```js
import { onPageLoad } from 'meteor/server-render'
import App from '/imports/ui/App.svelte'
import { loadHydratables } from 'meteor/npdev:svelte-loadable'

// wait for all loadables provided by ssr to load, then hydrate the app
loadHydratables().then(() => onPageLoad(() => {
  /* eslint-disable no-new */
  new App({
    target: document.getElementById('root'),
    hydrate: true
  })
}))
```

### The 'svelte-loadable-capture' Context

To make the capture work with the provider as described in the section on server side rendering, Svelte Loadable uses a context set up by `LoadableProvider` using the string identifier 'svelte-loadable-capture'. Svelte Loadable expects the context to provide a method, to which it will pass the loader function - only if it has been registered.

---

For more examples, please check the [`example/src/App.svelte`](https://github.com/kaisermann/svelte-loadable/blob/master/example/src/App.svelte) file.

