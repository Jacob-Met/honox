import { render, createElement as createElementHono } from 'hono/jsx/dom'
import {
  COMPONENT_EXPORT,
  COMPONENT_NAME,
  DATA_HONO_TEMPLATE,
  DATA_SERIALIZED_PROPS,
} from '../constants.js'
import type {
  CreateChildren,
  CreateElement,
  Hydrate,
  HydrateComponent,
  TriggerHydration,
} from '../types.js'
import { createIslandRangeContainer, findIslandRanges } from './island-range.js'
import { isTemplateElement } from './utils/dom.js'
import { filterByPattern } from './utils/filter.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileCallback = () => Promise<Record<string, Promise<any>>>

export type ClientOptions<E = Node> = {
  hydrate?: Hydrate<E>
  createElement?: CreateElement<E>
  /**
   * Create "children" attribute of a component from a list of child nodes
   */
  createChildren?: CreateChildren<E>
  /**
   * Trigger hydration on your own
   */
  triggerHydration?: TriggerHydration
  ISLAND_FILES?: Record<string, () => Promise<unknown>>
  /**
   * @deprecated
   */
  island_root?: string
}

export const createClient = async <E = Node>(options?: ClientOptions<E>) => {
  const FILES =
    options?.ISLAND_FILES ??
    filterByPattern(
      {
        ...import.meta.glob('/app/islands/**/*.tsx'),
        ...import.meta.glob('/app/**/*.island.tsx'),
        ...import.meta.glob('/app/**/$*.tsx'),
      },
      [
        /\/[a-zA-Z0-9-]+\.tsx$/, // /app/islands/**/*.tsx
        /\/_[a-zA-Z0-9-]+\.island\.tsx$/, // /app/**/_*.island.tsx
        /\/\$[a-zA-Z0-9-]+\.tsx$/, // /app/**/$*.tsx
      ]
    )

  const hydratedRanges = new WeakSet<Comment>()

  const hydrateComponent: HydrateComponent = async (document) => {
    const ranges = 'nodeType' in document ? findIslandRanges(document as unknown as ParentNode) : []
    const filePromises = Object.keys(FILES).map(async (filePath) => {
      const elements = document.querySelectorAll(
        '[' + COMPONENT_NAME + '="' + filePath + '"]:not([data-hono-hydrated])'
      )
      const matchedRanges = ranges.filter(
        (range) => range.componentName === filePath && !hydratedRanges.has(range.start)
      )
      if (elements.length === 0 && matchedRanges.length === 0) return

      const fileCallback = FILES[filePath] as FileCallback
      const file = await fileCallback()
      const hydrateTarget = async (
        container: Element,
        exportName: string,
        props: Record<string, unknown>,
        lastChild: ChildNode | null | undefined
      ) => {
        const Component = await file[exportName]
        let maybeTemplate = lastChild
        while (isTemplateElement(maybeTemplate)) {
          const propKey = maybeTemplate.getAttribute(DATA_HONO_TEMPLATE)
          if (propKey == null) break
          let createChildren = options?.createChildren
          if (!createChildren) {
            const { buildCreateChildrenFn } = await import('./runtime')
            const importComponent = async (name: string, exportName = 'default') => {
              const fileCallback = FILES[name] as FileCallback | undefined
              return fileCallback ? (await fileCallback())[exportName] : undefined
            }
            createChildren = buildCreateChildrenFn<E>(
              options?.createElement ?? (createElementHono as CreateElement<E>),
              importComponent
            )
          }
          props[propKey] = await createChildren(maybeTemplate.content.childNodes)
          maybeTemplate = maybeTemplate.previousSibling
        }

        const createElement = options?.createElement ?? (createElementHono as CreateElement<E>)
        const hydrate = options?.hydrate ?? render
        const newElem = await createElement(Component, props)
        // @ts-expect-error default render causes a type mismatch with generic E
        await hydrate(newElem, container)
      }

      await Promise.all([
        ...Array.from(elements).map((element) => {
          element.setAttribute('data-hono-hydrated', 'true')
          const exportName = element.getAttribute(COMPONENT_EXPORT) || 'default'
          const serializedProps = element.getAttribute(DATA_SERIALIZED_PROPS)
          const props = JSON.parse(serializedProps ?? '{}') as Record<string, unknown>
          return hydrateTarget(
            element,
            exportName,
            props,
            element.childNodes[element.childNodes.length - 1]
          )
        }),
        ...matchedRanges.map((range) => {
          hydratedRanges.add(range.start)
          return hydrateTarget(
            createIslandRangeContainer(range.start, range.end),
            range.componentExport,
            range.props,
            range.end.previousSibling
          )
        }),
      ])
    })
    await Promise.all(filePromises)
  }

  const triggerHydration =
    options?.triggerHydration ??
    (async (hydrateComponent) => {
      if (document.querySelector('template[id^="H:"], template[id^="E:"]')) {
        const { hydrateComponentHonoSuspense } = await import('./runtime')
        await hydrateComponentHonoSuspense(hydrateComponent)
      }

      await hydrateComponent(document)
    })
  await triggerHydration?.(hydrateComponent)
}
