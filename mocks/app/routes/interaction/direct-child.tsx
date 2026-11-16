import { raw } from 'hono/html'
import DirectInput from '../../islands/DirectInput'

export default function DirectChild() {
  return (
    <>
      <style>{raw('#direct-child-label > input { border: 5px solid rgb(0, 128, 0); }')}</style>
      <label id='direct-child-label'>
        <DirectInput />
      </label>
    </>
  )
}
