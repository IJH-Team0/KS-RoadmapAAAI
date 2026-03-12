import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { PrioriteitsscoreFormulaConfig } from '@/lib/prioritering'
import { DEFAULT_PRIORITEITSSCORE_CONFIG } from '@/lib/prioritering'

export function usePrioriteitsscoreConfig(): {
  config: PrioriteitsscoreFormulaConfig
  loading: boolean
  error: string | null
} {
  const [config, setConfig] = useState<PrioriteitsscoreFormulaConfig>(DEFAULT_PRIORITEITSSCORE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)
      try {
        const [configRes, optionsRes] = await Promise.all([
          supabase.from('prioriteitsscore_config').select('key, value'),
          supabase
            .from('reference_options')
            .select('value, prioriteit_bonus')
            .eq('category', 'zorgimpact_type')
            .order('sort_order'),
        ])

        if (cancelled) return

        if (configRes.error) throw configRes.error
        if (optionsRes.error) throw optionsRes.error

        const keyValue = new Map<string, number>()
        for (const row of configRes.data ?? []) {
          const v = Number(row.value)
          if (!Number.isNaN(v)) keyValue.set(row.key, v)
        }

        const riskPenalty = keyValue.get('risk_penalty') ?? DEFAULT_PRIORITEITSSCORE_CONFIG.riskPenalty
        const bouwinspanningS = keyValue.get('bouwinspanning_s') ?? DEFAULT_PRIORITEITSSCORE_CONFIG.bouwinspanningS
        const bouwinspanningM = keyValue.get('bouwinspanning_m') ?? DEFAULT_PRIORITEITSSCORE_CONFIG.bouwinspanningM
        const bouwinspanningL = keyValue.get('bouwinspanning_l') ?? DEFAULT_PRIORITEITSSCORE_CONFIG.bouwinspanningL
        const sparseBoetePunten = keyValue.get('sparse_boete_punten') ?? DEFAULT_PRIORITEITSSCORE_CONFIG.sparseBoetePunten

        const zorgimpactBonuses: Record<string, number> = { ...DEFAULT_PRIORITEITSSCORE_CONFIG.zorgimpactBonuses }
        for (const row of optionsRes.data ?? []) {
          const bonus = Number(row.prioriteit_bonus)
          if (!Number.isNaN(bonus) && row.value != null) {
            zorgimpactBonuses[String(row.value)] = bonus
          }
        }

        setConfig({
          riskPenalty,
          bouwinspanningS,
          bouwinspanningM,
          bouwinspanningL,
          zorgimpactBonuses,
          sparseBoetePunten,
        })
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Config laden mislukt')
          setConfig(DEFAULT_PRIORITEITSSCORE_CONFIG)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { config, loading, error }
}

export type { PrioriteitsscoreFormulaConfig }
