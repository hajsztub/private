import React from 'react'
import { useRouter } from '../router/AppRouter'
import './FloatingDock.css'

const DOCK_SCREENS = new Set([
  'main_menu', 'deck_builder', 'market', 'players', 'settings', 'league',
])

const IconDeck = () => (
  <svg className="fdock-icon" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/>
    <rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/>
    <rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
)

const IconMarket = () => (
  <svg className="fdock-icon" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zm1.5 1.5h9L18 6H6l1.5-2.5zM5 8h14v12H5V8zm7 2a3 3 0 100 6 3 3 0 000-6z"/>
  </svg>
)

export default function FloatingDock() {
  const { screen, navigate } = useRouter()

  if (!DOCK_SCREENS.has(screen)) return null

  const go = (s) => {
    if (s === screen) return
    if (navigator.vibrate) navigator.vibrate(8)
    navigate(s)
  }

  const isDeck   = screen === 'deck_builder'
  const isHome   = screen === 'main_menu'
  const isMarket = screen === 'market'

  return (
    <div className="fdock" role="navigation" aria-label="Nawigacja">
      <div className="fdock-pill">

        <button
          className={`fdock-btn ${isDeck ? 'fdock-btn--active' : ''}`}
          onClick={() => go('deck_builder')}
          aria-label="Skład"
        >
          <IconDeck />
          <span className="fdock-label">SKŁAD</span>
        </button>

        <div className="fdock-center-wrap">
          <button
            className={`fdock-center ${isHome ? 'fdock-center--active' : ''}`}
            onClick={() => go('main_menu')}
            aria-label="Strona główna"
          >
            <span className="fdock-ball">⚽</span>
          </button>
          <div className={`fdock-dot ${isHome ? 'fdock-dot--on' : ''}`} />
        </div>

        <button
          className={`fdock-btn ${isMarket ? 'fdock-btn--active' : ''}`}
          onClick={() => go('market')}
          aria-label="Market"
        >
          <IconMarket />
          <span className="fdock-label">MARKET</span>
        </button>

      </div>
    </div>
  )
}
