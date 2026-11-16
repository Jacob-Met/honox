import type { Env } from 'hono'
import { createApp as baseCreateApp } from './server.js'
import type { ServerOptions } from './server.js'

let warnedMissingGlob = false

// Vite replaces these literal glob calls at build time. Test runtimes that
// import the package directly (such as Cloudflare Vitest unit tests) do not.
const defaultGlob = <T>(load: () => T): T => {
  try {
    return load()
  } catch (error) {
    if (
      !(error instanceof TypeError) ||
      !error.message.includes('glob is not a function') ||
      typeof import.meta.glob === 'function'
    ) {
      throw error
    }
    if (!warnedMissingGlob) {
      console.warn(
        '[honox] import.meta.glob is unavailable: file-based routes are not loaded. ' +
          'For unit tests, pass ROUTES and other file maps to createApp(), ' +
          'or test the Vite-built worker via SELF.fetch().'
      )
      warnedMissingGlob = true
    }
    return {} as T
  }
}

export const createApp = <E extends Env>(options?: ServerOptions<E>) => {
  const newOptions = {
    root: options?.root ?? '/app/routes',
    app: options?.app,
    init: options?.init,
    trailingSlash: options?.trailingSlash,
    // Keep the import.meta.glob calls literal for Vite and Rolldown static analysis.
    NOT_FOUND:
      options?.NOT_FOUND ??
      defaultGlob(() =>
        import.meta.glob('/app/routes/**/_404.{ts,tsx}', {
          eager: true,
        })
      ),
    ERROR:
      options?.ERROR ??
      defaultGlob(() =>
        import.meta.glob('/app/routes/**/_error.{ts,tsx}', {
          eager: true,
        })
      ),
    RENDERER:
      options?.RENDERER ??
      defaultGlob(() =>
        import.meta.glob('/app/routes/**/_renderer.tsx', {
          eager: true,
        })
      ),
    MIDDLEWARE:
      options?.MIDDLEWARE ??
      defaultGlob(() =>
        import.meta.glob('/app/routes/**/_middleware.{ts,tsx}', {
          eager: true,
        })
      ),
    ROUTES:
      options?.ROUTES ??
      defaultGlob(() =>
        import.meta.glob(
          [
            '/app/routes/**/*.{ts,tsx,md,mdx}',
            '/app/routes/.well-known/**/*.{ts,tsx,md,mdx}',
            '!/app/routes/**/_*.{ts,tsx,md,mdx}',
            '!/app/routes/**/-*.{ts,tsx,md,mdx}',
            '!/app/routes/**/$*.{ts,tsx,md,mdx}',
            '!/app/routes/**/*.test.{ts,tsx}',
            '!/app/routes/**/*.spec.{ts,tsx}',
            '!/app/routes/**/-*/**/*',
          ],
          {
            eager: true,
          }
        )
      ),
  }

  return baseCreateApp(newOptions)
}
