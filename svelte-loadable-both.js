import { LOADED } from './svelte-loadable.svelte'

export const ALL_LOADERS = new Map()

export function findLoader (resolved) {
  for (let [loader, r] of ALL_LOADERS) {
    if (r === resolved) return loader
  }
  return null
}

export function register (loadable) {
  const resolved = loadable.resolve()
  const loader = findLoader(resolved)
  if (loader) {
    return loader
  } else {
    ALL_LOADERS.set(loadable.loader, resolved)
    return loadable.loader
  }
}

export function preloadAll () {
  return Promise.all(
    Array.from(ALL_LOADERS.keys())
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
  ).then(() => {
    // If new loaders have been registered by loaded components,
    // load them next.
    if (ALL_LOADERS.size > LOADED.size) {
      return preloadAll()
    }
  })
}
