import { Suspense } from 'hono/jsx'
import AsyncRemote from '../../islands/AsyncRemote'

export default function AsyncClient() {
  return (
    <Suspense fallback={<p id='async-fallback'>Loading async data...</p>}>
      <AsyncRemote />
    </Suspense>
  )
}
