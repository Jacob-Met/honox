export default async function AsyncRemote({ slot = 'main' }: { slot?: string }) {
  const response = await fetch(`/api/async-widget?slot=${encodeURIComponent(slot)}`)
  const { name } = (await response.json()) as { name: string }
  return <p id={slot === 'main' ? 'async-result' : `async-result-${slot}`}>Loaded in {name}</p>
}
