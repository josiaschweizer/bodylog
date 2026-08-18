import { useCallback, useState } from 'react'
import { Activity, ChartNoAxesCombined, Home, LogOut, Plus, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import getBrowserClient from '@/lib/supabase/getBrowserClient'
import NewEntryDialog from '@/components/tracking/NewEntryDialog'
import type { TrackingEntry } from '@/lib/tracking'

const navigation = [
  { to: '/', label: 'Heute', icon: Home, end: true },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined, end: false },
  { to: '/profile', label: 'Profil', icon: UserRound, end: false },
]

export type AppOutletContext = {
  refreshToken: number
  openNewEntry: () => void
  openEditEntry: (entry: TrackingEntry) => void
}

export default function AppLayout() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<TrackingEntry | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const closeNewEntry = useCallback(() => {
    setIsNewEntryOpen(false)
    setEntryToEdit(null)
  }, [])

  function openNewEntry() {
    setEntryToEdit(null)
    setIsNewEntryOpen(true)
  }

  function openEditEntry(entry: TrackingEntry) {
    setEntryToEdit(entry)
    setIsNewEntryOpen(true)
  }

  async function handleLogout() {
    await getBrowserClient().auth.signOut()
  }

  return (
    <div className="min-h-svh bg-khaki-beige-50 text-ash-brown-900 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-dusty-taupe-200 bg-white px-5 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2 text-xl font-bold tracking-tight text-chocolate-plum-950">
          <span className="grid size-10 place-items-center rounded-xl bg-chocolate-plum-800 text-white">
            <Activity size={22} aria-hidden="true" />
          </span>
          BodyLog
        </div>

        <button
          type="button"
          onClick={openNewEntry}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-chocolate-plum-800 px-4 py-3 font-semibold text-white transition hover:bg-chocolate-plum-900"
        >
          <Plus size={19} aria-hidden="true" />
          Neuer Eintrag
        </button>

        <nav className="mt-6 space-y-1" aria-label="Hauptnavigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-chocolate-plum-100 text-chocolate-plum-900'
                    : 'text-dusty-taupe-700 hover:bg-dusty-taupe-100 hover:text-ash-brown-900'
                }`
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-dusty-taupe-700 transition hover:bg-dusty-taupe-100 hover:text-ash-brown-900"
        >
          <LogOut size={20} aria-hidden="true" />
          Abmelden
        </button>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-[calc(4rem+env(safe-area-inset-top))] items-end border-b border-dusty-taupe-200 bg-khaki-beige-50/90 px-5 pb-5 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 font-bold tracking-tight text-chocolate-plum-950">
            <Activity size={22} aria-hidden="true" />
            BodyLog
          </div>
        </header>

        <Outlet context={{ refreshToken, openNewEntry, openEditEntry }} />
      </div>

      <button
        type="button"
        onClick={openNewEntry}
        className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex min-h-13 items-center gap-2 rounded-full bg-chocolate-plum-800 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-chocolate-plum-950/25 transition active:scale-95 lg:hidden"
      >
        <Plus size={21} aria-hidden="true" />
        Neu
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid h-[calc(5.25rem+env(safe-area-inset-bottom))] grid-cols-3 border-t border-dusty-taupe-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(29,25,22,0.06)] lg:hidden"
        aria-label="Mobile Navigation"
      >
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mx-1 my-1 flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 text-sm font-semibold transition active:scale-95 active:bg-dusty-taupe-100 ${
                isActive ? 'text-chocolate-plum-800' : 'text-dusty-taupe-500'
              }`
            }
          >
            <Icon size={26} strokeWidth={2.15} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <NewEntryDialog
        isOpen={isNewEntryOpen}
        onClose={closeNewEntry}
        onCreated={() => setRefreshToken((current) => current + 1)}
        entryToEdit={entryToEdit}
      />
    </div>
  )
}
