import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import AppRouter, { useRouter } from './router/AppRouter'
import { usePersistentStore } from './store/usePersistentStore'
import { useSettingsStore } from './store/useSettingsStore'
import { Music } from './game/musicEngine'
import MainMenuScreen from './screens/MainMenuScreen'
import MatchScreen from './screens/MatchScreen'
import PostMatchScreen from './screens/PostMatchScreen'
import DeckBuilderScreen from './screens/DeckBuilderScreen'
import MarketScreen from './screens/MarketScreen'
import LeagueScreen from './screens/LeagueScreen'
import PlayersScreen from './screens/PlayersScreen'
import SettingsScreen from './screens/SettingsScreen'
import SplashScreen from './screens/SplashScreen'
import FloatingDock from './components/FloatingDock'

import { hasProfanity, genRandomName } from './utils/nameFilter'

export const ProfileContext = createContext(null)
export const SettingsContext = createContext(null)

export function useProfile() { return useContext(ProfileContext) }
export function useSettings() { return useContext(SettingsContext) }

function ProfileNamePopup({ onDone }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (trimmed && hasProfanity(trimmed)) {
      setError('Nazwa zawiera niedozwolone słowa.')
      return
    }
    onDone(trimmed || genRandomName())
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '24px', fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: '#161b2e', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '360px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      }}>
        <div style={{ fontSize: '48px', lineHeight: 1 }}>⚽</div>
        <div style={{
          fontFamily: "'Bangers', cursive", fontSize: '28px',
          letterSpacing: '2px', color: 'white', textAlign: 'center',
        }}>WITAJ W GOAL TCG!</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.5 }}>
          Jak masz na imię? Twoja nazwa będzie widoczna w meczach i rankingu.
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          placeholder="Twoja nazwa gracza"
          maxLength={16}
          autoFocus
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
            color: 'white', fontSize: '16px', fontFamily: "'Inter', sans-serif",
            fontWeight: 700, outline: 'none', boxSizing: 'border-box',
          }}
        />
        {error && <div style={{ fontSize: '12px', color: '#ff5252', alignSelf: 'flex-start', marginTop: '-8px' }}>{error}</div>}
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Zostaw puste, aby wygenerować losową nazwę
        </div>
        <button
          onClick={handleConfirm}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px',
            background: 'linear-gradient(110deg, #00897b, #00695c)',
            border: 'none', color: 'white', fontFamily: "'Bangers', cursive",
            fontSize: '20px', letterSpacing: '2px', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,137,123,0.5)',
          }}
        >
          ZACZNIJ GRĘ →
        </button>
      </div>
    </div>
  )
}

function ScreenRouter() {
  const { screen, params } = useRouter()

  return (
    <>
      {screen === 'main_menu'    && <MainMenuScreen    key="main_menu" />}
      {screen === 'match'        && <MatchScreen        key={params.matchId} matchParams={params} />}
      {screen === 'post_match'   && <PostMatchScreen    key="post_match" result={params} />}
      {screen === 'deck_builder' && <DeckBuilderScreen  key="deck_builder" />}
      {screen === 'market'       && <MarketScreen       key="market" />}
      {screen === 'league'       && <LeagueScreen       key="league" />}
      {screen === 'players'      && <PlayersScreen      key="players" />}
      {screen === 'settings'     && <SettingsScreen     key="settings" />}
      {!['main_menu','match','post_match','deck_builder','market','league','players','settings'].includes(screen) && <MainMenuScreen key="main_menu" />}
      <FloatingDock />
    </>
  )
}

export default function App() {
  const persistentStore = usePersistentStore()
  const settingsStore = useSettingsStore()
  const [splash, setSplash] = useState(true)

  // Init music after splash (needs user interaction context)
  const musicInitRef = useRef(false)
  useEffect(() => {
    if (splash) return
    if (!musicInitRef.current) {
      musicInitRef.current = true
      Music.init(settingsStore.settings.music)
    }
  }, [splash]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to music toggle in settings
  useEffect(() => {
    if (splash) return
    Music.setEnabled(settingsStore.settings.music)
  }, [settingsStore.settings.music, splash])

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />

  const showNamePopup = !persistentStore.profile.hasSetupProfile

  const handleNameDone = (name) => {
    persistentStore.markProfileSetup(name)
  }

  return (
    <ProfileContext.Provider value={persistentStore}>
      <SettingsContext.Provider value={settingsStore}>
        <AppRouter>
          <ScreenRouter />
        </AppRouter>
        {showNamePopup && <ProfileNamePopup onDone={handleNameDone} />}
      </SettingsContext.Provider>
    </ProfileContext.Provider>
  )
}
