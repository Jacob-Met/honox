import { createElement, render, useState } from 'hono/jsx/dom'
import { createClient } from './client'
import { createIslandRangeContainer, findIslandRanges } from './island-range'

describe('transparent island boundaries', () => {
  it('preserves parent-child selectors and updates an island without touching its siblings', async () => {
    const label = document.createElement('label')
    label.innerHTML =
      '<!--honox-island:start--><button>old</button><!--honox-island:end--><span>keep</span>'
    document.body.append(label)
    const firstMarker = label.firstChild as Comment
    const endMarker = label.childNodes[2] as Comment
    const container = createIslandRangeContainer(firstMarker, endMarker)
    const Counter = () => {
      const [count, setCount] = useState(0)
      return createElement('button', { onClick: () => setCount((n) => n + 1), children: count })
    }

    render(createElement(Counter, {}), container as HTMLElement)
    expect(label.querySelector(':scope > button')?.textContent).toBe('0')
    expect(label.querySelector(':scope > span')?.textContent).toBe('keep')

    label.querySelector('button')!.click()
    await vi.waitFor(() => expect(label.querySelector(':scope > button')?.textContent).toBe('1'))
    expect(label.querySelector(':scope > span')?.textContent).toBe('keep')
    label.remove()
  })
})

describe('client hydration of transparent island markup', () => {
  it('hydrates an actual direct child and keeps stateful events working', async () => {
    const componentName = '/app/islands/Interactive.tsx'
    const payload = encodeURIComponent(
      JSON.stringify({ componentName, componentExport: 'default', props: {} })
    ).replaceAll('-', '%2D')
    document.body.innerHTML =
      '<label><!--honox-island:' +
      payload +
      '--><button>SSR</button><!--/honox-island--><span>adjacent</span></label>'
    const parent = document.querySelector('label')!
    expect(findIslandRanges(document)).toHaveLength(1)
    expect(parent.querySelector(':scope > button')?.textContent).toBe('SSR')

    const Interactive = () => {
      const [count, setCount] = useState(0)
      return createElement('button', { onClick: () => setCount((n) => n + 1), children: count })
    }
    await createClient({
      ISLAND_FILES: { [componentName]: async () => ({ default: Interactive }) },
    })
    expect(parent.querySelector(':scope > button')?.textContent).toBe('0')
    parent.querySelector('button')!.click()
    await vi.waitFor(() => expect(parent.querySelector(':scope > button')?.textContent).toBe('1'))
    expect(parent.querySelector(':scope > span')?.textContent).toBe('adjacent')
  })
})
