import { useEffect, useRef, useState } from 'react'
import { useHiddenWordStore } from '@/stores/hiddenWordStore'
import { hiddenWordProjectionPath, projectHiddenWordMatch, projectionTargetOrigin } from '@/lib/hiddenWordProjection'

interface ScreenBounds extends Screen {
  availLeft: number
  availTop: number
}

interface WindowWithScreenDetails extends Window {
  getScreenDetails?: () => Promise<{ screens: ScreenBounds[]; currentScreen: ScreenBounds }>
}

async function placeOnSecondScreen(popup: Window) {
  const browser = window as WindowWithScreenDetails
  if (!(window.screen as Screen & { isExtended?: boolean }).isExtended || !browser.getScreenDetails) return
  try {
    const { screens, currentScreen } = await browser.getScreenDetails()
    const other = screens.find((screen) => screen !== currentScreen)
    if (popup.closed || !other) return
    popup.moveTo(other.availLeft, other.availTop)
    popup.resizeTo(other.availWidth, other.availHeight)
  } catch {
    // The teacher can move the projection window manually when permission is unavailable.
  }
}

export function useHiddenWordProjection() {
  const session = useRef<{ popup: Window; id: string } | null>(null)
  const [status, setStatus] = useState<'closed' | 'opening' | 'ready' | 'blocked'>('closed')

  useEffect(() => {
    function sendProjection() {
      const current = session.current
      if (!current || current.popup.closed) return
      current.popup.postMessage({
        type: 'hidden-word-projection',
        id: current.id,
        projection: projectHiddenWordMatch(useHiddenWordStore.getState().match),
      }, projectionTargetOrigin())
    }

    function receive(event: MessageEvent) {
      const current = session.current
      const origin = projectionTargetOrigin()
      if (!current || event.source !== current.popup || (origin !== '*' && event.origin !== origin)) return
      if (event.data?.type !== 'hidden-word-projection-ready' || event.data.id !== current.id) return
      sendProjection()
      setStatus('ready')
    }

    function closeProjection() {
      session.current?.popup.close()
      session.current = null
    }

    window.addEventListener('message', receive)
    window.addEventListener('pagehide', closeProjection)
    const unsubscribe = useHiddenWordStore.subscribe((state, previous) => {
      if (state.match !== previous.match) sendProjection()
    })
    const monitor = window.setInterval(() => {
      if (session.current?.popup.closed) {
        session.current = null
        setStatus('closed')
      }
    }, 1000)

    return () => {
      window.removeEventListener('message', receive)
      window.removeEventListener('pagehide', closeProjection)
      window.clearInterval(monitor)
      unsubscribe()
      closeProjection()
    }
  }, [])

  function openProjection() {
    if (session.current && !session.current.popup.closed) {
      session.current.popup.focus()
      return
    }
    const id = crypto.randomUUID()
    const url = new URL(window.location.href)
    url.hash = `${hiddenWordProjectionPath}/${id}`
    const popup = window.open(url.href, '_blank', 'popup,width=1000,height=700')
    if (!popup) {
      setStatus('blocked')
      return
    }
    session.current = { popup, id }
    setStatus('opening')
    void placeOnSecondScreen(popup)
  }

  return { openProjection, status }
}
