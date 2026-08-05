import React from 'react'

/**
 * Keeps the active tab visible inside a horizontally scrollable tab strip.
 *
 * Register each tab's root element with the returned `registerTabRef(key)`
 * ref callback. Whenever `activeTab` changes, the tab strip (the tab
 * element's `parentElement`) is scrolled just enough to bring it into view.
 *
 * Uses `getBoundingClientRect` (not `offsetLeft`) since `offsetLeft` is
 * relative to the nearest *positioned* ancestor, which may not be the
 * scroll container itself.
 */
export function useScrollActiveTabIntoView(activeTab: string | null) {
  const tabRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  const registerTabRef = React.useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      tabRefs.current[key] = el
    },
    []
  )

  const unregisterTabRef = React.useCallback((key: string) => {
    delete tabRefs.current[key]
  }, [])

  React.useEffect(() => {
    if (!activeTab) return
    const el = tabRefs.current[activeTab]
    const container = el?.parentElement
    if (!el || !container) return

    // Scroll only the tab strip — scrollIntoView can move the whole page.
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const left = container.scrollLeft + (elRect.left - containerRect.left)
    const right = left + elRect.width
    const viewLeft = container.scrollLeft
    const viewRight = viewLeft + container.clientWidth
    if (left < viewLeft) {
      container.scrollTo({ left, behavior: 'smooth' })
    } else if (right > viewRight) {
      container.scrollTo({
        left: right - container.clientWidth,
        behavior: 'smooth',
      })
    }
  }, [activeTab])

  return { registerTabRef, unregisterTabRef }
}
