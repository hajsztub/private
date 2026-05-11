import React from 'react'
import { useRouter } from '../router/AppRouter'
import './FloatingDock.css'

export const DOCK_SCREENS = new Set([
  'main_menu', 'deck_builder', 'market', 'players', 'settings', 'league',
])

const IconDeck = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/>
    <rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/>
    <rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
)

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
)

const IconMarket = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.2 14.8l.03-.12.9-1.68h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20.03 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5 16.18 5 17h15v-2H7.42c-.14 0-.22-.08-.22-.2z"/>
  </svg>
)

const NAV = [
  { id: 'deck_builder', Icon: IconDeck,   label: 'SKŁAD'  },
  { id: 'main_menu',    Icon: IconHome,   label: 'MENU'   },
  { id: 'market',       Icon: IconMarket, label: 'MARKET' },
]

export default function FloatingDock() {
  const { screen, navigate } = useRouter()
  if (!DOCK_SCREENS.has(screen)) return null

  const go = (id) => {
    if (id === screen) return
    if (navigator.vibrate) navigator.vibrate(6)
    navigate(id)
  }

  return (
    <div className="fdock">
      <div className="fdock-inner">
        {NAV.map(({ id, Icon, label }) => {
          const active = screen === id
          return (
            <button
              key={id}
              className={`fdock-btn ${active ? 'fdock-btn--active' : ''}`}
              onClick={() => go(id)}
              aria-label={label}
            >
              <Icon />
              <span className="fdock-lbl">{label}</span>
              {active && <span className="fdock-pip" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
