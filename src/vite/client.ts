import type { Plugin } from 'vite'

export type ClientOptions = {
  jsxImportSource?: string
  assetsDir?: string
  input?: string[]
}

const defaultOptions: Required<ClientOptions> = {
  jsxImportSource: 'hono/jsx/dom',
  assetsDir: 'static',
  input: ['/app/client.ts'],
}

function client(options?: ClientOptions): Plugin {
  return {
    name: 'honox-vite-client',
    apply: (_config, { command, mode }) => {
      if (command === 'build' && mode === 'client') {
        return true
      }
      return false
    },
    config: function () {
      // Vite 8 uses Rolldown/Oxc and deprecates `esbuild.jsxImportSource`.
      // Older Vite releases do not expose the Rolldown config-hook context.
      const usesOxc = Boolean(
        (this as unknown as { meta?: { rolldownVersion?: string } } | undefined)?.meta
          ?.rolldownVersion
      )
      const jsxImportSource = options?.jsxImportSource ?? defaultOptions.jsxImportSource

      return {
        build: {
          rollupOptions: {
            input: options?.input ?? defaultOptions.input,
          },
          assetsDir: options?.assetsDir ?? defaultOptions.assetsDir,
          manifest: true,
        },
        ...(usesOxc
          ? { oxc: { jsx: { importSource: jsxImportSource } } }
          : { esbuild: { jsxImportSource } }),
      }
    },
  }
}

export default client
