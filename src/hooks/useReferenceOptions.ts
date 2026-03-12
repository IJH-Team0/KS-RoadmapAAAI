import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  APP_STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  COMPLEXITEIT_OPTIONS,
  DOMEIN_OPTIONS,
  ZORGIMPACT_TYPE_OPTIONS,
  BOUWINSPANNING_OPTIONS,
  ZORGWAARDE_OPTIONS,
  APP_ICON_OPTIONS,
} from '@/types/app'

export interface ReferenceOption {
  value: string
  label: string
}

const CATEGORY_FALLBACKS: Record<string, ReferenceOption[]> = {
  app_status: APP_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  domein: DOMEIN_OPTIONS.map((v) => ({ value: v, label: v })),
  platform: PLATFORM_OPTIONS.map((v) => ({ value: v, label: v })),
  complexiteit: COMPLEXITEIT_OPTIONS.map((v) => ({ value: v, label: v })),
  zorgimpact_type: ZORGIMPACT_TYPE_OPTIONS.map((v) => ({ value: v, label: v })),
  bouwinspanning: BOUWINSPANNING_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  zorgwaarde: ZORGWAARDE_OPTIONS.map((v) => ({ value: String(v), label: String(v) })),
  app_icon: APP_ICON_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
}

export function useReferenceOptions(category: string): {
  options: ReferenceOption[]
  loading: boolean
  error: string | null
  refetch: () => void
} {
  const [options, setOptions] = useState<ReferenceOption[]>(() => CATEGORY_FALLBACKS[category] ?? [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchKey, setRefetchKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setLoading(true)

    supabase
      .from('reference_options')
      .select('value, label')
      .eq('category', category)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(err.message)
          setOptions(CATEGORY_FALLBACKS[category] ?? [])
          return
        }
        const list = (data ?? []).map((r) => ({ value: String(r.value), label: String(r.label) }))
        setOptions(list.length > 0 ? list : CATEGORY_FALLBACKS[category] ?? [])
      })
      .then(
        () => { if (!cancelled) setLoading(false) },
        () => { if (!cancelled) setLoading(false) }
      )

    return () => { cancelled = true }
  }, [category, refetchKey])

  const refetch = () => setRefetchKey((k) => k + 1)

  return { options, loading, error, refetch }
}
