import { createClient } from '@supabase/supabase-js'
import { agentIngest } from '@/lib/agentDebug'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// #region agent log
;(function agentDbgSupabaseInit() {
  let urlHost = ''
  try {
    if (supabaseUrl) urlHost = new URL(supabaseUrl).hostname
  } catch {
    urlHost = 'invalid_url'
  }
  agentIngest('supabase.ts:init', 'supabase env at module load', {
    hypothesisId: 'A',
    hasUrl: Boolean(supabaseUrl?.length),
    hasKey: Boolean(supabaseAnonKey?.length),
    urlHost,
    prod: import.meta.env.PROD,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'no-window',
  })
})()
// #endregion

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
