import client from './client'

// Vite 5/7 have no Rolldown config-hook context. Vite 8 exposes
// `meta.rolldownVersion`, which allows the plugin to select Oxc's JSX option.
const configuredClient = async (context: unknown, jsxImportSource?: string) => {
  const hook = client({ jsxImportSource }).config
  if (typeof hook !== 'function') throw new Error('Missing Vite configuration hook')
  return (await Reflect.apply(hook, context, [{}, { command: 'build', mode: 'client' }])) as {
    esbuild?: { jsxImportSource: string }
    oxc?: { jsx: { importSource: string } }
    build?: { manifest: boolean; assetsDir: string; rollupOptions: { input: string[] } }
  }
}

describe('honox-vite-client JSX configuration', () => {
  it('configures Oxc instead of the deprecated esbuild option on Vite 8', async () => {
    const config = await configuredClient({
      meta: { viteVersion: '8.3.8', rolldownVersion: '1.2.19' },
    })
    expect(config.oxc).toEqual({ jsx: { importSource: 'hono/jsx/dom' } })
    expect(config.esbuild).toBeUndefined()
  })

  it('preserves custom client JSX imports on Vite 8', async () => {
    const config = await configuredClient({ meta: { rolldownVersion: '1.0.0' } }, 'preact')
    expect(config.oxc).toEqual({ jsx: { importSource: 'preact' } })
  })

  it('keeps esbuild configuration with Vite 5/7 and no Rolldown context', async () => {
    const emptyContext = await configuredClient(undefined)
    const vite7Context = await configuredClient({ meta: { rollupVersion: '4.53.1' } }, 'react')
    expect(emptyContext.esbuild).toEqual({ jsxImportSource: 'hono/jsx/dom' })
    expect(vite7Context.esbuild).toEqual({ jsxImportSource: 'react' })
    expect(emptyContext.oxc).toBeUndefined()
    expect(vite7Context.oxc).toBeUndefined()
  })

  it('does not change input, assets directory or manifest', async () => {
    const config = await configuredClient({ meta: { rolldownVersion: '1.0.0' } })
    expect(config.build).toEqual({
      manifest: true,
      assetsDir: 'static',
      rollupOptions: { input: ['/app/client.ts'] },
    })
  })
})
