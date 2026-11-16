import type { FC } from 'hono/jsx'
import type { JSX } from 'hono/jsx/jsx-runtime'
import type { Manifest } from 'vite'
import { ensureTrailngSlash, warnMissingClientAsset } from '../utils/path.js'

type Options = {
  manifest?: Manifest
  prod?: boolean
  /** Override the production asset origin or path prefix (e.g. a CDN). */
  baseUrl?: string
} & JSX.IntrinsicElements['link']

export const Link: FC<Options> = (options) => {
  let { href, prod, manifest, baseUrl, ...rest } = options
  if (href) {
    if (prod ?? import.meta.env.PROD) {
      if (!manifest) {
        const MANIFEST = import.meta.glob<{ default: Manifest }>('/dist/.vite/manifest.json', {
          eager: true,
        })
        for (const [, manifestFile] of Object.entries(MANIFEST)) {
          if (manifestFile['default']) {
            manifest = manifestFile['default']
            break
          }
        }
      }
      if (manifest) {
        const assetInManifest = manifest[href.replace(/^\//, '')]
        if (assetInManifest) {
          if (href.startsWith('/') || baseUrl !== undefined) {
            return (
              <link
                href={`${ensureTrailngSlash(baseUrl ?? import.meta.env.BASE_URL)}${assetInManifest.file}`}
                {...rest}
              ></link>
            )
          }

          return <link href={assetInManifest.file} {...rest}></link>
        }
      }
      warnMissingClientAsset('Link', href, !!manifest)
      return <></>
    } else {
      return <link href={href} {...rest}></link>
    }
  }

  return <link {...rest} />
}
