import React from 'react'
import { useRouter } from '../router/AppRouter'
import { useSettings } from '../App'
import { useProfile } from '../App'
import './SettingsScreen.css'

export default function SettingsScreen() {
  const { goBack } = useRouter()
  const { settings, toggle } = useSettings()
  const { resetProfile } = useProfile()

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz zresetować cały postęp? Tej akcji nie można cofnąć.')) {
      resetProfile()
      goBack()
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="settings-back" onClick={goBack}>←</button>
        <h1 className="settings-title">Ustawienia</h1>
      </div>

      <div className="settings-list">
        <div className="settings-section-label">Grafika i dźwięk</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-icon">✨</span>
            <div>
              <div className="settings-row-label">Efekty wizualne</div>
              <div className="settings-row-desc">Animacje i efekty specjalne</div>
            </div>
          </div>
          <button
            className={`settings-toggle ${settings.visualEffects ? 'settings-toggle--on' : ''}`}
            onClick={() => toggle('visualEffects')}
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-icon">🔊</span>
            <div>
              <div className="settings-row-label">Dźwięk</div>
              <div className="settings-row-desc">Efekty dźwiękowe (wkrótce)</div>
            </div>
          </div>
          <button
            className={`settings-toggle ${settings.sound ? 'settings-toggle--on' : ''}`}
            onClick={() => toggle('sound')}
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>

        <div className="settings-section-label">Język</div>

        <div className="settings-row settings-row--disabled">
          <div className="settings-row-info">
            <span className="settings-row-icon">🌍</span>
            <div>
              <div className="settings-row-label">Zmiana języka</div>
              <div className="settings-row-desc">Wkrótce dostępne</div>
            </div>
          </div>
          <span className="settings-badge">Wkrótce</span>
        </div>

        <div className="settings-section-label">Zaawansowane</div>

        <button className="settings-row settings-row--danger" onClick={handleReset}>
          <div className="settings-row-info">
            <span className="settings-row-icon">🗑️</span>
            <div>
              <div className="settings-row-label">Resetuj postęp</div>
              <div className="settings-row-desc">Usuwa wszystkie dane gry</div>
            </div>
          </div>
          <span className="settings-badge settings-badge--danger">Reset</span>
        </button>

        <button className="settings-quit-btn" onClick={() => window.close()}>
          Zakończ grę
        </button>
      </div>
    </div>
  )
}
