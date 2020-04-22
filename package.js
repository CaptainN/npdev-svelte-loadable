Package.describe({
  name: "npdev:svelte-loadable",
  version: "1.0.0-alpha.2",
  summary: "Easy code splitting with Svelte-loadable",
  git: "https://github.com/CaptainN/npdev-svelte-loadable.git"
})

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@1.5', 'METEOR@1.10'])
  api.use(['ecmascript', 'ejson', 'svelte:compiler@3.6.7_1'])

  api.mainModule('svelte-loadable-server.js', 'server', { lazy: true })
  api.mainModule('svelte-loadable-client.js', 'client', { lazy: true })
});
