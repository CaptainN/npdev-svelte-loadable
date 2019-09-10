<script>
import { setContext } from 'svelte'
import { EJSON } from 'meteor/ejson'
import { ALL_LOADERS } from './svelte-loadable.svelte'

const loaders = []
setContext('svelte-loadable-capture', (loader) => {
  loaders.push(ALL_LOADERS.get(loader))
})

export let handle = {}
handle.toEJSON = () => (
  EJSON.stringify(loaders)
)
handle.toScriptTag = function () {
  return `<script type="text/ejson" id="__hydratables__">${this.toEJSON()}<`+`/script>`
}
</script>

<slot />
