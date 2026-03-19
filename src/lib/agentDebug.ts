/** Alleen actief als sessionStorage ROADMAP_AGENT_DEBUG=1 (bijv. via DevTools-console op Netlify). */
const STORAGE_KEY = 'ROADMAP_AGENT_DEBUG'

const INGEST =
  'http://127.0.0.1:7246/ingest/788b46d0-c7c1-4f39-873b-903ba7f3eb27'

export type AgentDebugPayload = {
  location: string
  message: string
  data: Record<string, unknown>
  timestamp: number
}

function sessionDebugOn(): boolean {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function allowHttpIngest(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'http:'
}

/** NDJSON naar Cursor-debug (localhost http) + optioneel window-log voor HTTPS. */
export function agentIngest(
  location: string,
  message: string,
  data: Record<string, unknown>
): void {
  const payload: AgentDebugPayload = {
    location,
    message,
    data,
    timestamp: Date.now(),
  }

  if (sessionDebugOn()) {
    const w = window as Window & { __ROADMAP_AGENT__?: { log: AgentDebugPayload[] } }
    if (!w.__ROADMAP_AGENT__) w.__ROADMAP_AGENT__ = { log: [] }
    w.__ROADMAP_AGENT__.log.push(payload)
  }

  if (allowHttpIngest()) {
    fetch(INGEST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }
}
