import { EJSON } from 'meteor/ejson'
import { LOADED, load, findByResolved } from './svelte-loadable.svelte'

export { default as LoadableProvider } from './svelte-loadable-provider-client.svelte'
export { default as Loadable, preloadAll, register } from './svelte-loadable.svelte'

export const loadHydratables = (id = '__hydratables__') => {
  const hydratablesNode = document.getElementById(id)
  if (hydratablesNode) {
    const hydratables = EJSON.parse(hydratablesNode.innerText)
    hydratablesNode.parentNode.removeChild(hydratablesNode)
    return (hydratables.length > 0)
      ? Promise.all(hydratables
        .map(resolved => findByResolved(resolved))
        .filter(loader => !LOADED.has(loader))
        .map(loader => load(loader))
      )
      : new Promise((resolve) => { resolve() })
  } else {
    return new Promise((resolve) => { resolve() })
  }
}
