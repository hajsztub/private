import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useSettings, useProfile } from '../App'
import { hasProfanity } from '../utils/nameFilter'
import './SettingsScreen.css'

export default function SettingsScreen() {
  const { goBack } = useRouter()
  const { settings, toggle } = useSettings()
  const { profile, update, resetProfile } = useProfile()
  const [nameInput, setNameInput] = useState(profile.name || 'Gracz')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    if (hasProfanity(trimmed)) { setNameError('Nazwa zawiera niedozwolone słowa.'); return }
    update({ name: trimmed })
    setNameSaved(true)
    setNameError('')
    setTimeout(() => setNameSaved(false), 1800)
  }

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz zresetować cały postęp? Tej akcji nie można cofnąć.')) {
      resetProfile()
      goBack()
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="back-btn" onClick={goBack}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h1 className="settings-title">Ustawienia</h1>
      </div>

      <div className="settings-list">

        {/* ── Player profile ── */}
        <div className="settings-section-label">Profil gracza</div>

        <div className="settings-row settings-row--name">
          <div className="settings-row-info">
            <span className="settings-row-icon">👤</span>
            <div className="settings-row-labels">
              <div className="settings-row-label">Nazwa gracza</div>
              <div className="settings-row-desc">Widoczna w meczach i rankingu</div>
            </div>
          </div>
          <div className="sn-field-wrap">
            <div className="sn-field">
              <input
                className="sn-input"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setNameError('') }}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                maxLength={16}
                placeholder="Twoja nazwa"
              />
              <button
                className={`sn-save ${nameSaved ? 'sn-save--done' : ''}`}
                onClick={saveName}
              >
                {nameSaved ? '✓' : 'OK'}
              </button>
            </div>
            {nameError && <div className="sn-error">{nameError}</div>}
          </div>
        </div>

        {/* ── Graphics & sound ── */}
        <div className="settings-section-label">Grafika i dźwięk</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-icon">✨</span>
            <div className="settings-row-labels">
              <div className="settings-row-label">Efekty wizualne</div>
              <div className="settings-row-desc">Animacje goli i efekty specjalne</div>
            </div>
          </div>
          <button
            className={`settings-toggle ${settings.visualEffects ? 'settings-toggle--on' : ''}`}
            onClick={() => toggle('visualEffects')}
            aria-label="Toggle visual effects"
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-icon">🎵</span>
            <div className="settings-row-labels">
              <div className="settings-row-label">Muzyka w tle</div>
              <div className="settings-row-desc">Stadionowa muzyka ambientowa</div>
            </div>
          </div>
          <button
            className={`settings-toggle ${settings.music ? 'settings-toggle--on' : ''}`}
            onClick={() => toggle('music')}
            aria-label="Toggle music"
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-icon">🔊</span>
            <div className="settings-row-labels">
              <div className="settings-row-label">Dźwięk</div>
              <div className="settings-row-desc">Efekty dźwiękowe</div>
            </div>
          </div>
          <button
            className={`settings-toggle ${settings.sound ? 'settings-toggle--on' : ''}`}
            onClick={() => toggle('sound')}
            aria-label="Toggle sound"
          >
            <div className="settings-toggle-knob" />
          </button>
        </div>

        {/* ── Language ── */}
        <div className="settings-section-label">Język / Language</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-icon">🌐</span>
            <div className="settings-row-labels">
              <div className="settings-row-label">Język / Language</div>
              <div className="settings-row-desc">Język interfejsu gry</div>
            </div>
          </div>
          <div className="settings-lang-select-wrap">
            <select className="settings-lang-select" defaultValue="pl" disabled={false}>
              <option value="pl">Polski 🇵🇱</option>
              <option value="en" disabled>English 🇬🇧 🔒</option>
              <option value="es" disabled>Español 🇪🇸 🔒</option>
            </select>
          </div>
        </div>

        {/* ── Advanced ── */}
        <div className="settings-section-label">Zaawansowane</div>

        <button className="settings-row settings-row--danger" onClick={handleReset}>
          <div className="settings-row-info">
            <span className="settings-row-icon">✕</span>
            <div className="settings-row-labels">
              <div className="settings-row-label">Resetuj postęp</div>
              <div className="settings-row-desc">Usuwa wszystkie dane gry</div>
            </div>
          </div>
          <span className="settings-badge settings-badge--danger">Reset</span>
        </button>

        <div className="settings-app-info">
          GOAL TCG v1.0 · © 2026
        </div>

      </div>
    </div>
  )
}
