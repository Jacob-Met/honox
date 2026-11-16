import { raw } from 'hono/html'
import { createContext, useContext, isValidElement, useEffect, useState } from 'hono/jsx'
import type { JSX } from 'hono/jsx/jsx-runtime'
import {
  COMPONENT_NAME,
  COMPONENT_EXPORT,
  DATA_SERIALIZED_PROPS,
  DATA_HONO_TEMPLATE,
  ISLAND_START,
  ISLAND_END,
} from '../../constants'

const inIsland = Symbol()
const inChildren = Symbol()
const IslandContext = createContext({
  [inIsland]: false,
  [inChildren]: false,
})

const isElementPropValue = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some(isElementPropValue)
    : typeof value === 'object' && isValidElement(value)

export const HonoXIsland = ({
  componentName,
  componentExport,
  Component,
  props,
}: {
  componentName: string
  componentExport: string
  Component: Function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementProps: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restProps: Record<string, any> = {}
  for (const key in props) {
    const value = props[key]
    if (isElementPropValue(value)) {
      elementProps[key] = value
    } else {
      restProps[key] = value
    }
  }

  const islandState = useContext(IslandContext)
  // Async client islands cannot safely make browser-relative fetch calls on the server.
  const content = Component.constructor.name === 'AsyncFunction' ? <></> : <Component {...props} />
  if (!islandState[inIsland] && !islandState[inChildren]) {
    const metadata = encodeURIComponent(
      JSON.stringify({
        componentName,
        componentExport: componentExport || 'default',
        props: restProps,
      })
    ).replaceAll('-', '%2D')
    return (
      <>
        {raw(`<!--${ISLAND_START}${metadata}-->`)}
        <IslandContext.Provider value={{ ...islandState, [inIsland]: true }}>
          {content}
        </IslandContext.Provider>
        {Object.entries(elementProps).map(([key, children]) => (
          <template {...{ [DATA_HONO_TEMPLATE]: key }} key={key}>
            <IslandContext.Provider value={{ ...islandState, [inChildren]: true }}>
              {children}
            </IslandContext.Provider>
          </template>
        ))}
        {raw(`<!--${ISLAND_END}-->`)}
      </>
    )
  }

  return islandState[inChildren] ? (
    // top-level or slot content
    <honox-island
      {...{
        [COMPONENT_NAME]: componentName,
        [COMPONENT_EXPORT]: componentExport || undefined,
        [DATA_SERIALIZED_PROPS]: JSON.stringify(restProps),
      }}
    >
      <IslandContext.Provider value={{ ...islandState, [inIsland]: true }}>
        {content}
      </IslandContext.Provider>
      {Object.entries(elementProps).map(([key, children]) => (
        <template {...{ [DATA_HONO_TEMPLATE]: key }} key={key}>
          <IslandContext.Provider value={{ ...islandState, [inChildren]: true }}>
            {children}
          </IslandContext.Provider>
        </template>
      ))}
    </honox-island>
  ) : (
    // nested component: do not invoke browser-only async work on the server
    content
  )
}

/** Resolve async islands after mount, where browser APIs such as relative fetch are available. */
export const HonoXClientIsland = ({
  Component,
  props,
}: {
  Component: Function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any
}) => {
  if (Component.constructor.name !== 'AsyncFunction') {
    return <Component {...props} />
  }

  const [state, setState] = useState<
    { status: 'loading' } | { status: 'ready'; element: JSX.Element } | { status: 'error'; error: unknown }
  >({ status: 'loading' })
  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    Promise.resolve(Component(props)).then(
      (element) => {
        if (active) setState({ status: 'ready', element })
      },
      (error) => {
        if (active) setState({ status: 'error', error })
      }
    )
    return () => {
      active = false
    }
  }, [Component, props])

  if (state.status === 'error') throw state.error
  return state.status === 'ready' ? state.element : <template data-honox-async-loading='' />
}
