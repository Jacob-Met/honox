export const ensureTrailngSlash = (path: string) => {
  return path.endsWith('/') ? path : path + '/'
}

// Production builds should not silently discard a missing hydration script or stylesheet.
// Assets are resolved at build time; reporting the same missing entry on every request
// would otherwise flood server logs without adding information.
const reportedWarnings = new Set<string>()

export const warnMissingClientAsset = (
  component: 'Script' | 'Link',
  source: string,
  manifestFound: boolean
) => {
  const message = manifestFound
    ? `[honox] <${component}> did not render: "${source}" is not in the client build manifest. Check the client build inputs.`
    : `[honox] <${component}> did not render: could not find /dist/.vite/manifest.json. Run the client build before the server build and check build.outDir.`

  if (!reportedWarnings.has(message)) {
    reportedWarnings.add(message)
    console.warn(message)
  }
}
