import React from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import PlayerCard from '../components/PlayerCard'
import './PostMatchScreen.css'

export default function PostMatchScreen({ result = {} }) {
  const { navigate } = useRouter()
  const { profile } = useProfile()

  const {
    result: matchResult = 'draw',
    score = { player: 0, ai: 0 },
    matchType = 'local',
    coinsEarned = 0,
    ratingChange = 0,
    goalEvents = [],
    playerOfMatch = null,
    log = [],
  } = result

  const resultLabels = {
    win: { text: 'WYGRAŁEŚ!', emoji: '🏆', color: '#4caf50' },
    loss: { text: 'PRZEGRANA', emoji: '😞', color: '#ef5350' },
    draw: { text: 'REMIS', emoji: '🤝', color: '#ff9800' },
  }

  const res = resultLabels[matchResult] || resultLabels.draw
  const playerGoals = goalEvents.filter(e => e.scorer === 'player')
  const aiGoals = goalEvents.filter(e => e.scorer === 'ai')

  return (
    <div className="postmatch-screen">
      {/* Result banner */}
      <div className="postmatch-banner" style={{ borderColor: res.color }}>
        <div className="postmatch-emoji">{res.emoji}</div>
        <div className="postmatch-result" style={{ color: res.color }}>{res.text}</div>
        <div className="postmatch-score">
          <span className="ps-score-num">{score.player}</span>
          <span className="ps-score-sep">:</span>
          <span className="ps-score-num">{score.ai}</span>
        </div>
      </div>

      {/* Rewards */}
      <div className="postmatch-rewards">
        <div className="reward-item">
          <span className="reward-icon">🪙</span>
          <span className="reward-val">+{coinsEarned}</span>
          <span className="reward-label">Monety</span>
        </div>
        {matchType === 'league' && (
          <div className="reward-item">
            <span className="reward-icon">⭐</span>
            <span className="reward-val" style={{ color: ratingChange >= 0 ? '#81c784' : '#ef9a9a' }}>
              {ratingChange >= 0 ? '+' : ''}{ratingChange}
            </span>
            <span className="reward-label">Rating ({profile.rating})</span>
          </div>
        )}
        <div className="reward-item">
          <span className="reward-icon">📊</span>
          <span className="reward-val">{profile.wins}W-{profile.draws}R-{profile.losses}P</span>
          <span className="reward-label">Bilans</span>
        </div>
      </div>

      {/* Player of the match */}
      {playerOfMatch && (
        <div className="postmatch-section">
          <div className="section-title">🌟 Zawodnik Meczu</div>
          <div className="postmatch-potm">
            <PlayerCard card={playerOfMatch} size="normal" />
            <div className="potm-info">
              <div className="potm-name">{playerOfMatch.name}</div>
              <div className="potm-stats">
                <span>⚔️ {playerOfMatch.currentAttackStat ?? playerOfMatch.attackStat}</span>
                <span>🛡️ {playerOfMatch.currentDefenseStat ?? playerOfMatch.defenseStat}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal events */}
      {goalEvents.length > 0 && (
        <div className="postmatch-section">
          <div className="section-title">⚽ Bramki</div>
          <div className="goal-events-list">
            {goalEvents.map((ev, i) => (
              <div key={i} className={`goal-event goal-event--${ev.scorer}`}>
                <span className="goal-event-icon">⚽</span>
                <span className="goal-event-info">
                  Runda {ev.round} — {ev.scorer === 'player' ? `Ty (${ev.cardName || '?'})` : `Bot (${ev.cardName || '?'})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match log snippet */}
      {log.length > 0 && (
        <div className="postmatch-section">
          <div className="section-title">📋 Kluczowe momenty</div>
          <div className="postmatch-log">
            {log.slice(0, 8).map((entry, i) => (
              <div key={i} className={`pm-log-entry pm-log-entry--${entry.type}`}>
                {entry.round > 0 && <span className="pm-log-round">R{entry.round}</span>}
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="postmatch-actions">
        <button
          className="pm-btn pm-btn--rematch"
          onClick={() => navigate('match', { matchType, matchId: Date.now() })}
        >
          ⚽ Zagraj kolejny mecz
        </button>
        <button
          className="pm-btn pm-btn--menu"
          onClick={() => navigate('main_menu')}
        >
          ← Główne Menu
        </button>
      </div>
    </div>
  )
}
