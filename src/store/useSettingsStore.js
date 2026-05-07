import { useState, useCallback } from 'react'

const SETTINGS_KEY = 'football_cards_settings_v1'

function defaultSettings() {
  return {
    visualEffects: true,
    sound: false, // off by default (no audio files yet)
    language: 'pl', // only Polish for now
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

let _listeners = []
let _settings = loadSettings()

function saveSettings(s) {
  _settings = s
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch {}
  _listeners.forEach(fn => fn(s))
}

export function useSettingsStore() {
  const [settings, setSettings] = useState(_settings)

  const toggle = useCallback((key) => {
    const next = { ..._settings, [key]: !_settings[key] }
    saveSettings(next)
    setSettings(next)
  }, [])

  return { settings, toggle }
}

export function getSettings() {
  return _settings
}
