import AsyncRemote from '../../islands/AsyncRemote'

export default function AsyncSiblings() {
  return (
    <section>
      <AsyncRemote slot='slow' />
      <AsyncRemote slot='fast' />
    </section>
  )
}
