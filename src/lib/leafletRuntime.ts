/**
 * Leaflet is loaded from CDN in index.html (not bundled).
 * Vite 8 / Rolldown on Vercel fails when bundling the leaflet package and its CSS assets.
 */
import type * as Leaflet from 'leaflet'

type LeafletGlobal = typeof globalThis & { L?: typeof Leaflet }

function leaflet(): typeof Leaflet {
  const L = (globalThis as LeafletGlobal).L
  if (!L) {
    throw new Error('Leaflet is not loaded. Ensure index.html includes leaflet.js before the app script.')
  }
  return L
}

export default leaflet()
