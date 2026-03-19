import { useEffect } from 'react'
import {
  useBeforeUnload,
} from 'react-router-dom'

const DEFAULT_MESSAGE =
  'U heeft niet-opgeslagen wijzigingen. Weet u zeker dat u deze pagina wilt verlaten?'

export function useUnsavedChangesGuard(
  isDirty: boolean,
  message: string = DEFAULT_MESSAGE
) {
  useEffect(() => {
    if (!isDirty) return
    const onLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      const leave = window.confirm(message)
      if (!leave) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('click', onLinkClick, true)
    return () => document.removeEventListener('click', onLinkClick, true)
  }, [isDirty, message])

  useBeforeUnload(
    (event) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    },
    { capture: true }
  )
}

