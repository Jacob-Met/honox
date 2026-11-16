import { useState } from 'hono/jsx'

export default function CustomCounter() {
  const [count, setCount] = useState(1)
  return (
    <div id='custom-island'>
      <p>Custom count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment custom</button>
    </div>
  )
}
