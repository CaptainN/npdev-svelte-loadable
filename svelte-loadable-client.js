import { EJSON } from 'meteor/ejson'
import { LOADED } from './svelte-loadable.svelte'
import { findLoader } from './svelte-loadable-both'

export { register, preloadAll } from './svelte-loadable-both'
export { default as LoadableProvider } from './svelte-loadable-provider-client.svelte'
export { default as Loadable } from './svelte-loadable.svelte'

const preload = (hydratables) => {
  return Promise.all(hydratables
    .map(resolved => findLoader(resolved))
    .filter(loader => !LOADED.has(loader))
    .map(loader => loader().then((componentModule) => {
      // TODO: This is very optimistic, and assumes loadables will always
      // load correctly. This should instead leverage the internal state
      // logic within svelte-loadable.svelte, which needs to be hoisted
      // and exported in some usable way.
      const component = componentModule.default || componentModule
      LOADED.set(loader, component)
      return componentModule
    }))
  )
}

const resolved = () => new Promise((resolve) => { resolve() })

export const loadHydratables = (id = '__hydratables__') => {
  const hydratablesNode = document.getElementById(id)
  if (hydratablesNode) {
    const hydratables = EJSON.parse(hydratablesNode.innerText)
    hydratablesNode.parentNode.removeChild(hydratablesNode)
    return (hydratables.length > 0)
      ? preload(hydratables)
      : resolved()
  } else {
    return resolved()
  }
}
