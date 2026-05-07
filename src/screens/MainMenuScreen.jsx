import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { LEAGUE_TIERS, getTier } from '../data/botNames'
import './MainMenuScreen.css'

function Logo() {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <div className="mm-logo-wrap">
        <img
          src="/logo.png"
          alt="GOAL TCG"
          className="mm-logo-img"
          onError={() => setFailed(true)}
          draggable={false}
        />
      </div>
    )
  }
  return (
    <div className="mm-logo-wrap">
      <div className="mm-logo-ball">⚽</div>
      <div className="mm-logo-text">
        <span className="mm-logo-goal">GOAL</span>
        <span className="mm-logo-tcg">TCG</span>
      </div>
    </div>
  )
}

export default function MainMenuScreen() {
  const { navigate } = useRouter()
  const { profile } = useProfile()

  const tier = getTier(profile.rating)
  const gems = profile.gems ?? 0

  return (
    <div className="main-menu">
      <div className="mm-bg-field" />

      {/* ── Logo ── */}
      <Logo />

      {/* ── Profile card ── */}
      <div className="mm-profile-card">
        <div className="mm-profile-left">
          <div className="mm-avatar">
            {(profile.name || 'G')[0].toUpperCase()}
          </div>
          <div className="mm-profile-info">
            <div className="mm-profile-name">{profile.name || 'Gracz'}</div>
            <div className="mm-tier-badge" style={{ color: tier.color }}>
              {tier.icon} {tier.label}
            </div>
          </div>
        </div>
        <div className="mm-profile-right">
          <div className="mm-currency">
            <span className="mm-cur-icon">⭐</span>
            <span className="mm-cur-val">{profile.rating}</span>
          </div>
          <div className="mm-currency">
            <span className="mm-cur-icon">🪙</span>
            <span className="mm-cur-val">{profile.coins}</span>
          </div>
          <div className="mm-currency">
            <span className="mm-cur-icon">💎</span>
            <span className="mm-cur-val">{gems}</span>
          </div>
        </div>
      </div>

      {/* ── Record ── */}
      <div className="mm-record">
        <span className="mmr-w">{profile.wins}W</span>
        <span className="mmr-sep">·</span>
        <span className="mmr-d">{profile.draws}R</span>
        <span className="mmr-sep">·</span>
        <span className="mmr-l">{profile.losses}P</span>
      </div>

      {/* ── Play buttons ── */}
      <div className="mm-play-section">
        <button className="mm-btn mm-btn--league" onClick={() => navigate('league')}>
          <span className="mm-btn-icon">🏆</span>
          <div className="mm-btn-body">
            <span className="mm-btn-title">Mecz Ligowy</span>
            <span className="mm-btn-desc">Rankingowy · Więcej nagród</span>
          </div>
          <span className="mm-btn-arrow">›</span>
        </button>

        <button className="mm-btn mm-btn--training" onClick={() => navigate('match', { matchType: 'local', matchId: Date.now() })}>
          <span className="mm-btn-icon">⚽</span>
          <div className="mm-btn-body">
            <span className="mm-btn-title">Trening</span>
            <span className="mm-btn-desc">Bez rankingu · Mniej nagród</span>
          </div>
          <span className="mm-btn-arrow">›</span>
        </button>
      </div>

      {/* ── Bottom nav ── */}
      <div className="mm-nav">
        <button className="mm-nav-btn" onClick={() => navigate('deck_builder')}>
          <span className="mm-nav-icon">🃏</span>
          <span className="mm-nav-label">Skład</span>
        </button>
        <button className="mm-nav-btn" onClick={() => navigate('market')}>
          <span className="mm-nav-icon">💰</span>
          <span className="mm-nav-label">Market</span>
        </button>
        <button className="mm-nav-btn" onClick={() => navigate('players')}>
          <span className="mm-nav-icon">👥</span>
          <span className="mm-nav-label">Gracze</span>
        </button>
        <button className="mm-nav-btn" onClick={() => navigate('settings')}>
          <span className="mm-nav-icon">⚙️</span>
          <span className="mm-nav-label">Ustawiania</span>
        </button>
      </div>

      <div className="mm-version">GOAL TCG v1.1 — build 20260507</div>
    </div>
  )
}
