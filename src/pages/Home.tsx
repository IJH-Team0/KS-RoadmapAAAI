import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAppsWensenlijstOrInOntwikkeling } from '@/lib/apps'
import type { App } from '@/types/app'
import { cn } from '@/lib/utils'

export function Home() {
  const { user, signOut } = useAuth()
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppsWensenlijstOrInOntwikkeling()
      .then(setApps)
      .finally(() => setLoading(false))
  }, [])

  const wensenlijst = apps.filter((a) => a.status === 'wensenlijst')
  const inOntwikkeling = apps.filter((a) => a.status === 'in_ontwikkeling')

  return (
    <div className="min-h-screen bg-ijsselheem-lichtblauw">
      <header className="border-b border-ijsselheem-accentblauw/50 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-ijsselheem-donkerblauw">Roadmap AAAI</h1>
          <nav className="flex gap-4">
            <span className="text-sm font-semibold text-ijsselheem-donkerblauw">Home</span>
            <Link
              to="/applicaties"
              className="text-sm font-medium text-ijsselheem-donkerblauw hover:opacity-80"
            >
              Applicaties
            </Link>
            <Link
              to="/roadmap"
              className="text-sm font-medium text-ijsselheem-donkerblauw hover:opacity-80"
            >
              Roadmap
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ijsselheem-donkerblauw">{user?.email}</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm font-medium text-ijsselheem-donkerblauw hover:underline"
          >
            Uitloggen
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-ijsselheem-donkerblauw mb-2">Welkom</h2>
        <p className="text-ijsselheem-donkerblauw mb-8">
          Overzicht van applicaties op de wensenlijst of in ontwikkeling.
        </p>

        {loading ? (
          <p className="text-ijsselheem-donkerblauw">Laden…</p>
        ) : (
          <div className="space-y-8">
            {wensenlijst.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold uppercase text-ijsselheem-donkerblauw/70 mb-3">
                  Wensenlijst ({wensenlijst.length})
                </h3>
                <ul className="space-y-2">
                  {wensenlijst.map((app) => (
                    <li key={app.id}>
                      <Link
                        to={`/backlog/${app.id}`}
                        className={cn(
                          'block rounded-[20px] border border-ijsselheem-accentblauw/30 bg-white p-3',
                          'hover:border-ijsselheem-accentblauw hover:shadow transition',
                          'border-l-4 border-l-ijsselheem-lichtblauw'
                        )}
                      >
                        <span className="font-semibold text-ijsselheem-donkerblauw">{app.naam}</span>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-ijsselheem-donkerblauw">
                          {app.prioriteit && <span>{app.prioriteit}</span>}
                          {app.platform && <span>{app.platform}</span>}
                          {app.complexiteit && <span>{app.complexiteit}</span>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {inOntwikkeling.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold uppercase text-ijsselheem-donkerblauw/70 mb-3">
                  In ontwikkeling ({inOntwikkeling.length})
                </h3>
                <ul className="space-y-2">
                  {inOntwikkeling.map((app) => (
                    <li key={app.id}>
                      <Link
                        to={`/backlog/${app.id}`}
                        className={cn(
                          'block rounded-[20px] border border-ijsselheem-accentblauw/30 bg-white p-3',
                          'hover:border-ijsselheem-accentblauw hover:shadow transition',
                          'border-l-4 border-l-ijsselheem-accentblauw'
                        )}
                      >
                        <span className="font-semibold text-ijsselheem-donkerblauw">{app.naam}</span>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-ijsselheem-donkerblauw">
                          {app.prioriteit && <span>{app.prioriteit}</span>}
                          {app.platform && <span>{app.platform}</span>}
                          {app.complexiteit && <span>{app.complexiteit}</span>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {wensenlijst.length === 0 && inOntwikkeling.length === 0 && (
              <p className="text-ijsselheem-donkerblauw">Geen applicaties op de wensenlijst of in ontwikkeling.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
