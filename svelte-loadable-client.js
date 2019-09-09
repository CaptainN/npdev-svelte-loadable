import { EJSON } from 'meteor/ejson'
import { LOADED } from './svelte-loadable.svelte'
import { findLoader } from './svelte-loadable-both'

export { register, preloadAll } from './svelte-loadable-both'
export { default as LoadableProvider } from './svelte-loadable-provider-client.svelte'
export { default as Loadable } from './svelte-loadable.svelte'

const preload = (preloadables) => {
  return Promise.all(preloadables
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
  const preloadablesNode = document.getElementById(id)
  if (preloadablesNode) {
    const preloadables = EJSON.parse(preloadablesNode.innerText)
    preloadablesNode.parentNode.removeChild(preloadablesNode)
    return (preloadables.length > 0)
      ? preload(preloadables)
      : resolved()
  } else {
    return resolved()
  }
}
