import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { generateLeaderboard, getTier, LEAGUE_TIERS, getBotName } from '../data/botNames'
import './LeagueScreen.css'

export default function LeagueScreen() {
  const { navigate, goBack } = useRouter()
  const { profile } = useProfile()

  const tier = getTier(profile.rating)
  const [board, setBoard] = useState(() => generateLeaderboard(profile.rating, profile.name || 'Gracz'))
  const [flashIds, setFlashIds] = useState(new Set())
  const [opponentName, setOpponentName] = useState(() => getBotName(Date.now()))
  const intervalRef = useRef(null)

  // Simulate live score updates every 4 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setBoard(prev => {
        const updated = [...prev]
        const numChanges = 2 + Math.floor(Math.random() * 3)
        const newFlash = new Set()
        for (let i = 0; i < numChanges; i++) {
          const idx = Math.floor(Math.random() * updated.length)
          if (updated[idx].isPlayer) continue
          const delta = (Math.random() < 0.6 ? 1 : -1) * (10 + Math.floor(Math.random() * 25))
          updated[idx] = { ...updated[idx], rating: Math.max(0, updated[idx].rating + delta) }
          newFlash.add(updated[idx].id)
        }
        updated.sort((a, b) => b.rating - a.rating)
        setFlashIds(newFlash)
        setTimeout(() => setFlashIds(new Set()), 800)
        return updated
      })
      setOpponentName(getBotName(Date.now()))
    }, 4000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const playerPos = board.findIndex(r => r.isPlayer) + 1
  const tierPlayers = board.filter(r => r.isPlayer || r.isBot)

  const hasPlayedLeague = (profile.matchHistory || []).some(m => m.matchType === 'league')
  const [showFirstLeaguePopup, setShowFirstLeaguePopup] = useState(false)

  const handleStartMatch = () => {
    if ((profile.activeDeck || []).length < 11) { navigate('deck_builder'); return }
    if (!hasPlayedLeague) { setShowFirstLeaguePopup(true); return }
    navigate('match', { matchType: 'league', matchId: Date.now(), opponentName })
  }

  const confirmLeagueStart = () => {
    setShowFirstLeaguePopup(false)
    navigate('match', { matchType: 'league', matchId: Date.now(), opponentName })
  }

  return (
    <div className="league-screen">
      {/* Header */}
      <div className="league-header">
        <button className="league-back" onClick={goBack}>←</button>
        <div className="league-title-block">
          <div className="league-tier-badge" style={{ color: tier.color }}>
            {tier.icon} {tier.label}
          </div>
          <div className="league-rating">{profile.rating} pkt</div>
        </div>
        <div className="league-pos">#{playerPos}</div>
      </div>

      {/* Tier progress bar */}
      <div className="league-progress-wrap">
        <div className="league-tiers-row">
          {LEAGUE_TIERS.map(t => (
            <div
              key={t.id}
              className={`ltr-pip ${t.id === tier.id ? 'ltr-pip--active' : ''}`}
              style={{ '--tc': t.color }}
            >
              <span className="ltr-icon">{t.icon}</span>
              <span className="ltr-label">{t.label}</span>
              {t.id === tier.id && (
                <div className="ltr-range">{t.min}–{t.max === Infinity ? '∞' : t.max}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opponent preview */}
      <div className="league-opponent">
        <div className="lo-vs">VS</div>
        <div className="lo-name">{opponentName}</div>
        <div className="lo-rating-wrap">
          <span className="lo-rating">~{Math.max(0, profile.rating + Math.floor(Math.random() * 200) - 100)} pkt</span>
          <span className="lo-badge">Szuka meczu...</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="league-board-wrap">
        <div className="league-board-title">Ranking {tier.label}</div>
        <div className="league-board">
          {tierPlayers.map((row, i) => {
            const pos = i + 1
            const isMe = row.isPlayer
            const isFlash = flashIds.has(row.id)
            return (
              <div
                key={row.id}
                className={[
                  'lb-row',
                  isMe ? 'lb-row--me' : '',
                  isFlash ? 'lb-row--flash' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="lb-pos">{pos <= 3 ? ['🥇','🥈','🥉'][pos-1] : pos}</span>
                <span className="lb-name">{row.name}{isMe ? ' (Ty)' : ''}</span>
                <span className="lb-rating">{row.rating}</span>
                {isFlash && <span className="lb-flash-dot" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="league-cta">
        <div className="league-cta-info">
          <span>🏆 Wygrana: +{profile.wins > 0 ? '28' : '20'} pkt ratingu</span>
          <span>🪙 Nagroda: 50–120 monet</span>
        </div>
        <button className="league-start-btn" onClick={handleStartMatch}>
          ⚽ Rozpocznij Mecz
        </button>
      </div>

      {/* First league match confirmation popup */}
      {showFirstLeaguePopup && (
        <div className="league-popup-overlay" onClick={() => setShowFirstLeaguePopup(false)}>
          <div className="league-popup" onClick={e => e.stopPropagation()}>
            <div className="league-popup-icon">🏆</div>
            <h2 className="league-popup-title">Gry rankingowe</h2>
            <p className="league-popup-body">
              Mecze ligowe wpływają na Twój <strong>ranking</strong> i są trudniejsze niż trening.
            </p>
            <p className="league-popup-hint">
              💡 Jeśli dopiero zaczynasz — rozegraj najpierw kilka treningów, żeby poznać zasady i zebrać monety na lepsze karty.
            </p>
            <div className="league-popup-actions">
              <button className="league-popup-btn league-popup-btn--cancel" onClick={() => setShowFirstLeaguePopup(false)}>
                Najpierw trening
              </button>
              <button className="league-popup-btn league-popup-btn--confirm" onClick={confirmLeagueStart}>
                Gram w ligę!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
