import React, { useState, useCallback, createContext, useContext } from 'react'

const RouterContext = createContext(null)

export function useRouter() {
  return useContext(RouterContext)
}

export default function AppRouter({ children }) {
  const [screen, setScreen] = useState('main_menu')
  const [params, setParams] = useState({})
  const [history, setHistory] = useState([])

  const navigate = useCallback((screenName, newParams = {}) => {
    setHistory(prev => [...prev, { screen, params }])
    setScreen(screenName)
    setParams(newParams)
  }, [screen, params])

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setScreen(last.screen)
      setParams(last.params)
      return prev.slice(0, -1)
    })
  }, [])

  const replace = useCallback((screenName, newParams = {}) => {
    setScreen(screenName)
    setParams(newParams)
  }, [])

  return (
    <RouterContext.Provider value={{ screen, params, navigate, goBack, replace }}>
      {children}
    </RouterContext.Provider>
  )
}
