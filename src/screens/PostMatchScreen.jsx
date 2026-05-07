import React from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import FieldCard from '../components/FieldCard'
import './PostMatchScreen.css'

function PostMatchLogo() {
  const [failed, React_useState] = React.useState(false)
  if (!failed) {
    return (
      <img
        src="/logo.png"
        alt="GOAL TCG"
        className="pm-logo-img"
        onError={() => React_useState(true)}
        draggable={false}
      />
    )
  }
  return (
    <div className="pm-logo-fallback">
      <span className="pm-logo-ball">⚽</span>
      <span className="pm-logo-text">GOAL <span className="pm-logo-tcg">TCG</span></span>
    </div>
  )
}

export default function PostMatchScreen({ result = {} }) {
  const { navigate } = useRouter()
  const { profile } = useProfile()

  const {
    result: matchResult = 'draw',
    score = { player: 0, ai: 0 },
    matchType = 'local',
    coinsEarned = 0,
    ratingChange = 0,
    playerOfMatch = null,
    log = [],
  } = result

  const resultLabels = {
    win:  { text: 'WYGRAŁEŚ!', emoji: '🏆', color: '#4caf50' },
    loss: { text: 'PRZEGRANA', emoji: '😞', color: '#ef5350' },
    draw: { text: 'REMIS',     emoji: '🤝', color: '#ff9800' },
  }

  const res = resultLabels[matchResult] || resultLabels.draw
  const isWin = matchResult === 'win'
  const isLoss = matchResult === 'loss'

  return (
    <div className="pm-screen">
      <div className="pm-bg-accents" />

      {/* Logo */}
      <div className="pm-logo-wrap">
        <PostMatchLogo />
      </div>

      {/* Result */}
      <div className="pm-result-block">
        <div className="pm-result-text" style={{ color: res.color }}>{res.text}</div>
        <div className="pm-result-emoji">{res.emoji}</div>
        <div className="pm-score">
          <span className={`pm-score-num ${isLoss ? 'pm-score-num--lose' : ''}`}>{score.player}</span>
          <span className="pm-score-sep">:</span>
          <span className={`pm-score-num ${isWin ? 'pm-score-num--win' : ''}`}>{score.ai}</span>
        </div>
      </div>

      {/* Rewards */}
      <div className="pm-rewards">
        <div className="pm-reward-item">
          <span className="pm-reward-icon">🪙</span>
          <span className="pm-reward-val">+{coinsEarned}</span>
          <span className="pm-reward-label">Monety</span>
        </div>
        {matchType === 'league' && (
          <div className="pm-reward-item">
            <span className="pm-reward-icon">⭐</span>
            <span className="pm-reward-val" style={{ color: ratingChange >= 0 ? '#81c784' : '#ef9a9a' }}>
              {ratingChange >= 0 ? '+' : ''}{ratingChange}
            </span>
            <span className="pm-reward-label">Rating ({profile.rating})</span>
          </div>
        )}
        <div className="pm-reward-item">
          <span className="pm-reward-icon">📊</span>
          <span className="pm-reward-val pm-reward-val--small">{profile.wins}W-{profile.draws}R-{profile.losses}P</span>
          <span className="pm-reward-label">Bilans</span>
        </div>
      </div>

      {/* MVP */}
      {playerOfMatch && (
        <div className="pm-mvp-section">
          <div className="pm-section-title">🌟 ZAWODNIK MECZU</div>
          <div className="pm-mvp-row">
            <FieldCard card={playerOfMatch} fieldSize />
            <div className="pm-mvp-info">
              <div className="pm-mvp-name">{playerOfMatch.name}</div>
              <div className="pm-mvp-stats">
                <span className="pm-mvp-stat pm-mvp-stat--atk">
                  ⚔ {playerOfMatch.currentAttackStat ?? playerOfMatch.attackStat}
                </span>
                <span className="pm-mvp-stat pm-mvp-stat--def">
                  🛡 {playerOfMatch.currentDefenseStat ?? playerOfMatch.defenseStat}
                </span>
              </div>
              {playerOfMatch.abilityName && (
                <div className="pm-mvp-ability">{playerOfMatch.abilityName}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="pm-actions">
        <button
          className="pm-btn pm-btn--rematch"
          onClick={() => navigate('match', { matchType, matchId: Date.now() })}
        >
          ⚽ ZAGRAJ KOLEJNY MECZ
        </button>
        <button
          className="pm-btn pm-btn--menu"
          onClick={() => navigate('main_menu')}
        >
          ← GŁÓWNE MENU
        </button>
      </div>

      {/* Key moments — at the bottom */}
      {log.length > 0 && (
        <div className="pm-log-section">
          <div className="pm-section-title">📋 KLUCZOWE MOMENTY</div>
          <div className="pm-log-list">
            {log.slice(0, 10).map((entry, i) => (
              <div key={i} className={`pm-log-entry pm-log-entry--${entry.type}`}>
                {entry.round > 0 && <span className="pm-log-round">R{entry.round}</span>}
                <span className="pm-log-msg">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
