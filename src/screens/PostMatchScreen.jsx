import React from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import FieldCard from '../components/FieldCard'
import { getTier, getBotName } from '../data/botNames'
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
    playerOfMatch = null,
    log = [],
    opponentName = 'Przeciwnik',
  } = result

  const RESULT_META = {
    win:  { label: 'Wygrana',  word: 'z',  color: '#4caf50', bg: 'rgba(76,175,80,0.12)',  emoji: '🏆' },
    loss: { label: 'Przegrana', word: 'z', color: '#ef5350', bg: 'rgba(239,83,80,0.12)',  emoji: '❌' },
    draw: { label: 'Remis',    word: 'z',  color: '#ff9800', bg: 'rgba(255,152,0,0.12)',  emoji: '🤝' },
  }

  const meta = RESULT_META[matchResult] || RESULT_META.draw
  const TYPE_LABEL = { league: 'Liga', training_amateur: 'Trening Amator', training_pro: 'Trening PRO' }

  return (
    <div className="pm-screen" style={{ '--res-color': meta.color, '--res-bg': meta.bg }}>

      {/* ── Result header ── */}
      <div className="pm-hero">
        <div className="pm-hero-emoji">{meta.emoji}</div>
        <div className="pm-hero-result" style={{ color: meta.color }}>{meta.label} {meta.word} {opponentName}</div>
        <div className="pm-hero-type">{TYPE_LABEL[matchType] || 'Mecz'}</div>

        {/* Score + record in one row */}
        <div className="pm-score-row">
          <div className="pm-score">
            <span className={`pm-score-num ${matchResult === 'win' ? 'pm-score-num--win' : ''}`}>{score.player}</span>
            <span className="pm-score-sep">:</span>
            <span className={`pm-score-num ${matchResult === 'loss' ? 'pm-score-num--lose' : ''}`}>{score.ai}</span>
          </div>
          <div className="pm-record">{profile.wins}W · {profile.draws}R · {profile.losses}P</div>
        </div>
      </div>

      {/* ── Rewards ── */}
      <div className="pm-rewards">
        {coinsEarned > 0 && (
          <div className="pm-reward-chip">
            <span className="pm-reward-icon">🪙</span>
            <span className="pm-reward-val">+{coinsEarned}</span>
          </div>
        )}
        {matchType === 'league' && (
          <div className="pm-reward-chip">
            <span className="pm-reward-icon">⭐</span>
            {ratingChange !== 0 && (
              <span className="pm-reward-val" style={{ color: ratingChange > 0 ? '#81c784' : '#ef9a9a' }}>
                {ratingChange > 0 ? '+' : ''}{ratingChange}
              </span>
            )}
            <span className="pm-reward-rating-now">({profile.rating})</span>
          </div>
        )}
      </div>

      {/* ── MVP ── */}
      {playerOfMatch && (
        <div className="pm-mvp">
          <div className="pm-mvp-label">🌟 ZAWODNIK MECZU</div>
          <div className="pm-mvp-row">
            <div className="pm-mvp-card">
              <FieldCard card={playerOfMatch} fieldSize />
            </div>
            <div className="pm-mvp-info">
              <div className="pm-mvp-name">{playerOfMatch.name}</div>
              <div className="pm-mvp-stats">
                <span className="pm-mvp-atk">⚔ {playerOfMatch.currentAttackStat ?? playerOfMatch.attackStat}</span>
                <span className="pm-mvp-def">🛡 {playerOfMatch.currentDefenseStat ?? playerOfMatch.defenseStat}</span>
              </div>
              {playerOfMatch.abilityName && (
                <div className="pm-mvp-ability">{playerOfMatch.abilityName}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="pm-actions">
        <button
          className="pm-btn pm-btn--play"
          onClick={() => navigate('match', { matchType, matchId: Date.now(), opponentName: getBotName(Date.now(), matchType) })}
        >
          ⚽ Zagraj kolejny mecz
        </button>
        <button
          className="pm-btn pm-btn--menu"
          onClick={() => navigate('main_menu')}
        >
          ← Główne menu
        </button>
      </div>

      {/* ── Key moments ── */}
      {log.length > 0 && (
        <div className="pm-log">
          <div className="pm-log-title">📋 KLUCZOWE MOMENTY</div>
          <div className="pm-log-list">
            {log.filter(e => e.type !== 'info').slice(0, 8).map((entry, i) => (
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
