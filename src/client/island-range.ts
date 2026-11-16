import { ISLAND_END, ISLAND_START } from '../constants.js'

export type IslandRange = {
  start: Comment
  end: Comment
  componentName: string
  componentExport: string
  props: Record<string, unknown>
}

export const findIslandRanges = (root: ParentNode): IslandRange[] => {
  const result: IslandRange[] = []
  const open: Omit<IslandRange, 'end'>[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)
  while (walker.nextNode()) {
    const comment = walker.currentNode as Comment
    if (comment.data.startsWith(ISLAND_START)) {
      try {
        const parsed: unknown = JSON.parse(
          decodeURIComponent(comment.data.slice(ISLAND_START.length))
        )
        if (
          parsed &&
          typeof parsed === 'object' &&
          'componentName' in parsed &&
          typeof parsed.componentName === 'string' &&
          'componentExport' in parsed &&
          typeof parsed.componentExport === 'string' &&
          'props' in parsed &&
          parsed.props &&
          typeof parsed.props === 'object' &&
          !Array.isArray(parsed.props)
        ) {
          open.push({ start: comment, ...parsed } as Omit<IslandRange, 'end'>)
        }
      } catch {
        // Invalid comments are not islands.
      }
    } else if (comment.data === ISLAND_END) {
      const start = open.pop()
      if (start && start.start.parentNode === comment.parentNode) {
        result.push({ ...start, end: comment })
      }
    }
  }
  return result
}

export const createIslandRangeContainer = (start: Comment, end: Comment): Element => {
  const parent = start.parentElement
  if (!parent || end.parentElement !== parent) {
    throw new Error('[honox] Island markers must have the same element parent')
  }
  const nodes = (): ChildNode[] => {
    const children: ChildNode[] = []
    for (let node = start.nextSibling; node && node !== end; node = node.nextSibling) {
      children.push(node as ChildNode)
    }
    return children
  }
  if (!(start.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING)) {
    throw new Error('[honox] Invalid island marker order')
  }
  return new Proxy(parent, {
    get(target, key) {
      if (key === 'childNodes') return nodes()
      if (key === 'appendChild') return (child: Node) => target.insertBefore(child, end)
      if (key === 'insertBefore')
        return (child: Node, before: Node | null) => target.insertBefore(child, before ?? end)
      if (key === 'replaceChildren')
        return (...children: Node[]) => {
          nodes().forEach((node) => node.remove())
          children.forEach((child) => target.insertBefore(child, end))
        }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
