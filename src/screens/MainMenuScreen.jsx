import React from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import './MainMenuScreen.css'

export default function MainMenuScreen() {
  const { navigate } = useRouter()
  const { profile } = useProfile()

  const startMatch = (type) => {
    navigate('match', { matchType: type, matchId: Date.now() })
  }

  return (
    <div className="main-menu">
      {/* Background field pattern */}
      <div className="menu-field-bg" />

      {/* Header */}
      <div className="menu-header">
        <div className="menu-logo">
          <span className="menu-logo-ball">⚽</span>
          <div className="menu-logo-text">
            <span className="menu-logo-title">FOOTBALL</span>
            <span className="menu-logo-sub">CARDS</span>
          </div>
        </div>

        <div className="menu-profile-bar">
          <div className="menu-stat">
            <span className="menu-stat-icon">⭐</span>
            <span className="menu-stat-value">{profile.rating}</span>
          </div>
          <div className="menu-stat">
            <span className="menu-stat-icon">🪙</span>
            <span className="menu-stat-value">{profile.coins}</span>
          </div>
          <div className="menu-record">
            <span className="record-w">{profile.wins}W</span>
            <span className="record-sep">·</span>
            <span className="record-d">{profile.draws}R</span>
            <span className="record-sep">·</span>
            <span className="record-l">{profile.losses}P</span>
          </div>
        </div>
      </div>

      {/* Main buttons */}
      <div className="menu-buttons">
        <button className="menu-btn menu-btn--league" onClick={() => startMatch('league')}>
          <span className="menu-btn-icon">🏆</span>
          <div className="menu-btn-content">
            <span className="menu-btn-title">Mecz Ligowy</span>
            <span className="menu-btn-desc">Rankingowy · Zarabiasz więcej monet</span>
          </div>
          <span className="menu-btn-arrow">›</span>
        </button>

        <button className="menu-btn menu-btn--local" onClick={() => startMatch('local')}>
          <span className="menu-btn-icon">⚽</span>
          <div className="menu-btn-content">
            <span className="menu-btn-title">Mecz Towarzyski</span>
            <span className="menu-btn-desc">Bez rankingu · Trening z botem</span>
          </div>
          <span className="menu-btn-arrow">›</span>
        </button>

        <div className="menu-divider" />

        <button className="menu-btn menu-btn--secondary" onClick={() => navigate('deck_builder')}>
          <span className="menu-btn-icon">🃏</span>
          <div className="menu-btn-content">
            <span className="menu-btn-title">Utwórz Zespół</span>
            <span className="menu-btn-desc">Edytuj swoją talię</span>
          </div>
          <span className="menu-btn-arrow">›</span>
        </button>

        <button className="menu-btn menu-btn--secondary" onClick={() => navigate('market')}>
          <span className="menu-btn-icon">💰</span>
          <div className="menu-btn-content">
            <span className="menu-btn-title">Rynek Transferowy</span>
            <span className="menu-btn-desc">Kupuj i sprzedawaj karty</span>
          </div>
          <span className="menu-btn-arrow">›</span>
        </button>

        <button className="menu-btn menu-btn--secondary" onClick={() => navigate('players')}>
          <span className="menu-btn-icon">👥</span>
          <div className="menu-btn-content">
            <span className="menu-btn-title">Zawodnicy</span>
            <span className="menu-btn-desc">{profile.ownedCards.length} kart · Ulepszaj graczy</span>
          </div>
          <span className="menu-btn-arrow">›</span>
        </button>

        <button className="menu-btn menu-btn--settings" onClick={() => navigate('settings')}>
          <span className="menu-btn-icon">⚙️</span>
          <div className="menu-btn-content">
            <span className="menu-btn-title">Ustawienia</span>
          </div>
          <span className="menu-btn-arrow">›</span>
        </button>
      </div>

      {/* Version */}
      <div className="menu-version">Football Cards v1.0</div>
    </div>
  )
}
