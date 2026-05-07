import React, { createContext, useContext, useState } from 'react'
import AppRouter, { useRouter } from './router/AppRouter'
import { usePersistentStore } from './store/usePersistentStore'
import { useSettingsStore } from './store/useSettingsStore'
import MainMenuScreen from './screens/MainMenuScreen'
import MatchScreen from './screens/MatchScreen'
import PostMatchScreen from './screens/PostMatchScreen'
import DeckBuilderScreen from './screens/DeckBuilderScreen'
import MarketScreen from './screens/MarketScreen'
import LeagueScreen from './screens/LeagueScreen'
import PlayersScreen from './screens/PlayersScreen'
import SettingsScreen from './screens/SettingsScreen'
import SplashScreen from './screens/SplashScreen'

export const ProfileContext = createContext(null)
export const SettingsContext = createContext(null)

export function useProfile() { return useContext(ProfileContext) }
export function useSettings() { return useContext(SettingsContext) }

function ScreenRouter() {
  const { screen, params } = useRouter()

  switch (screen) {
    case 'main_menu':   return <MainMenuScreen />
    case 'match':       return <MatchScreen key={params.matchId} matchParams={params} />
    case 'post_match':  return <PostMatchScreen result={params} />
    case 'deck_builder': return <DeckBuilderScreen />
    case 'market':      return <MarketScreen />
    case 'league':      return <LeagueScreen />
    case 'players':     return <PlayersScreen />
    case 'settings':    return <SettingsScreen />
    default:            return <MainMenuScreen />
  }
}

export default function App() {
  const persistentStore = usePersistentStore()
  const settingsStore = useSettingsStore()
  const [splash, setSplash] = useState(true)

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />

  return (
    <ProfileContext.Provider value={persistentStore}>
      <SettingsContext.Provider value={settingsStore}>
        <AppRouter>
          <ScreenRouter />
        </AppRouter>
      </SettingsContext.Provider>
    </ProfileContext.Provider>
  )
}
