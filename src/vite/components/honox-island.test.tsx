import { HonoXIsland } from './honox-island'

const TestComponent = () => <div>Test</div>

describe('HonoXIsland', () => {
  it('should set key for children', () => {
    const element = HonoXIsland({
      componentName: 'Test',
      componentExport: 'Test',
      Component: () => <div>Test</div>,
      props: {
        children: <TestComponent />,
      },
    })
    expect(element.toString()).toContain('data-hono-template="children"')
  })
})

describe('transparent HTML island root', () => {
  it('does not insert an element between a label and its input child', () => {
    const html = HonoXIsland({
      componentName: '/app/islands/Input.tsx',
      componentExport: 'default',
      Component: () => <input id='choice' type='checkbox' />,
      props: {},
    }).toString()
    const label = document.createElement('label')
    label.innerHTML = html
    expect(label.querySelector(':scope > input#choice')).not.toBeNull()
    expect(label.querySelector('honox-island')).toBeNull()
    expect(label.childNodes[0].nodeType).toBe(Node.COMMENT_NODE)
  })
})
