import { useState } from 'hono/jsx'

export default function DirectInput() {
  const [value, setValue] = useState('ready')
  return (
    <input
      type='text'
      value={value}
      onInput={(event) => setValue((event.target as HTMLInputElement).value)}
    />
  )
}
