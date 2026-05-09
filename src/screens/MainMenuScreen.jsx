import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { getTier, getBotName } from '../data/botNames'
import { CHANGELOG } from '../data/changelog'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './MainMenuScreen.css'

const ALL_DEFS_MM = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]
const FREE_PACK_COOLDOWN_MS = 45 * 60 * 1000

function fmtRelTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'przed chwilą'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz. temu`
  return `${Math.floor(diff / 86400000)} dni temu`
}

function NotificationPanel({ notifications, onDismiss, onClose }) {
  return (
    <div className="mm-notif-overlay" onClick={onClose}>
      <div className="mm-notif-panel" onClick={e => e.stopPropagation()}>
        <div className="mm-notif-header">
          <span className="mm-notif-title">🔔 Powiadomienia</span>
          <button className="mm-notif-close" onClick={onClose}>✕</button>
        </div>
        {notifications.length === 0 ? (
          <div className="mm-notif-empty">Brak nowych powiadomień</div>
        ) : (
          <div className="mm-notif-list">
            {notifications.map(n => (
              <div key={n.id} className={`mm-notif-item mm-notif-item--${n.type} ${n.read ? 'mm-notif-item--read' : ''}`}>
                <div className="mm-notif-msg">{n.message}</div>
                <div className="mm-notif-footer">
                  <span className="mm-notif-time">{fmtRelTime(n.timestamp)}</span>
                  <button className="mm-notif-dismiss" onClick={() => onDismiss(n.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const TUTORIAL_SECTIONS = [
  { icon: '🃏', title: 'Czym jest GOAL TCG?', text: 'GOAL TCG to gra karciana oparta na piłce nożnej. Zbuduj skład 11 zawodników i walcz przeciwko rywalom w turowych meczach.' },
  { icon: '⚽', title: 'Jak przebiega mecz?', text: 'Mecz trwa 10 rund. Każda runda to wymiana kart — ty i rywal gracie po jednej karcie z ręki. Wyższy Atak pokonuje niższą Obronę. Za każde trafienie dostajesz punkt.' },
  { icon: '🗂️', title: 'Pozycje i strefy', text: 'Masz 3 strefy ataku i 3 strefy obrony. Napastnicy atakują, obrońcy bronią. Bramkarz chroni całą bramkę — jego statystyka DEF dodaje się do każdej obrony.' },
  { icon: '✨', title: 'Zdolności specjalne', text: 'Każda karta może posiadać specjalną zdolność — buff, debuff lub efekt pasywny. Aktywujesz ją klikając kartę na boisku. Czytaj opisy kart w Składzie!' },
  { icon: '🏆', title: 'Mecze i nagrody', text: 'Mecz Ligowy daje punkty rankingowe i większe nagrody. Trening pozwala ćwiczyć bez ryzyka utraty ratingu. Wygrane mecze przynoszą monety do kupowania nowych kart.' },
  { icon: '📦', title: 'Paczki i rynek', text: 'W Markecie kupujesz paczki kart za monety lub klejnoty. Możesz też sprzedawać karty, których nie potrzebujesz. Obejrzyj reklamę raz na godzinę po darmowe nagrody!' },
]

function TutorialModal({ onClose }) {
  const [page, setPage] = useState(0)
  const section = TUTORIAL_SECTIONS[page]
  const isLast = page === TUTORIAL_SECTIONS.length - 1
  return (
    <div className="tut-overlay" onClick={onClose}>
      <div className="tut-modal" onClick={e => e.stopPropagation()}>
        <button className="tut-close" onClick={onClose}>✕</button>
        <div className="tut-progress">
          {TUTORIAL_SECTIONS.map((_, i) => (
            <div key={i} className={`tut-dot ${i === page ? 'tut-dot--active' : i < page ? 'tut-dot--done' : ''}`} />
          ))}
        </div>
        <div className="tut-icon">{section.icon}</div>
        <div className="tut-title">{section.title}</div>
        <div className="tut-text">{section.text}</div>
        <div className="tut-nav">
          {page > 0 && <button className="tut-btn tut-btn--back" onClick={() => setPage(p => p - 1)}>← Wstecz</button>}
          {!isLast
            ? <button className="tut-btn tut-btn--next" onClick={() => setPage(p => p + 1)}>Dalej →</button>
            : <button className="tut-btn tut-btn--done" onClick={onClose}>Graj! ⚽</button>
          }
        </div>
      </div>
    </div>
  )
}

function matchTypeLabel(mt) {
  if (mt === 'league') return 'Liga'
  if (mt === 'training_amateur') return 'Trening Amator'
  if (mt === 'training_pro') return 'Trening PRO'
  return 'Mecz'
}

function fmtMatchDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function HistoryModal({ history, onClose }) {
  const last3 = (history || []).slice(0, 3)
  return (
    <div className="cl-overlay" onClick={onClose}>
      <div className="cl-modal hist-modal" onClick={e => e.stopPropagation()}>
        <div className="cl-header">
          <span className="cl-title">📋 OSTATNIE MECZE</span>
          <button className="cl-close" onClick={onClose}>✕</button>
        </div>
        {last3.length === 0 ? (
          <div className="hist-empty">Nie rozegrałeś jeszcze żadnego meczu.</div>
        ) : (
          <div className="hist-list">
            {last3.map((m, i) => (
              <div key={i} className={`hist-entry hist-entry--${m.type}`}>
                <div className="hist-entry-top">
                  <span className="hist-result-icon">{m.type === 'win' ? '🏆' : m.type === 'loss' ? '❌' : '🤝'}</span>
                  <span className="hist-score">{m.score?.player ?? 0} : {m.score?.ai ?? 0}</span>
                  <span className="hist-type">{matchTypeLabel(m.matchType)}</span>
                  <span className="hist-date">{fmtMatchDate(m.date)}</span>
                </div>
                <div className="hist-entry-bot">
                  {m.coinsEarned > 0 && <span className="hist-coins">+{m.coinsEarned} 🪙</span>}
                  {m.ratingChange !== 0 && m.matchType === 'league' && (
                    <span className={`hist-rating ${m.ratingChange > 0 ? 'hist-rating--up' : 'hist-rating--down'}`}>
                      {m.ratingChange > 0 ? '+' : ''}{m.ratingChange} ⭐
                    </span>
                  )}
                  {m.mvpName && <span className="hist-mvp">⭐ MVP: {m.mvpName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChangelogModal({ onClose }) {
  return (
    <div className="cl-overlay" onClick={onClose}>
      <div className="cl-modal" onClick={e => e.stopPropagation()}>
        <div className="cl-header">
          <span className="cl-title">📋 CO NOWEGO?</span>
          <button className="cl-close" onClick={onClose}>✕</button>
        </div>
        <div className="cl-list">
          {CHANGELOG.map(entry => (
            <div key={entry.version} className="cl-entry">
              <div className="cl-version-row">
                <span className="cl-version">v{entry.version}</span>
              </div>
              <ul className="cl-changes">
                {entry.changes.map((c, i) => <li key={i} className="cl-change">{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Logo() {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <div className="mm-logo-wrap">
        <img src="/logo.png" alt="GOAL TCG" className="mm-logo-img" onError={() => setFailed(true)} draggable={false} />
      </div>
    )
  }
  return (
    <div className="mm-logo-wrap">
      <span className="mm-logo-ball">⚽</span>
      <div className="mm-logo-text">
        <span className="mm-logo-goal">GOAL</span>
        <span className="mm-logo-tcg">TCG</span>
      </div>
    </div>
  )
}

function ProfileAvatar({ name }) {
  const [failed, setFailed] = useState(false)
  const initial = (name || 'G')[0].toUpperCase()
  return (
    <div className="mm-avatar">
      {!failed
        ? <img className="mm-avatar-img" src="/avatar_player.png" alt="" onError={() => setFailed(true)} draggable={false} />
        : initial
      }
    </div>
  )
}

export default function MainMenuScreen() {
  const { navigate } = useRouter()
  const { profile, claimMission, addNotifications, markNotificationsRead, dismissNotification } = useProfile()

  const [showTutorial, setShowTutorial]   = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [showNotifs, setShowNotifs]       = useState(false)
  const [showMissions, setShowMissions]   = useState(false)
  const [showStadion, setShowStadion]     = useState(false)
  const [showWeeklyPopup, setShowWeeklyPopup] = useState(false)
  const [trainingOpen, setTrainingOpen]   = useState(false)
  const [resetIn, setResetIn]             = useState('')

  const isNewPlayer   = (profile.matchHistory || []).length === 0
  const notifications = profile.notifications || []
  const unreadCount   = notifications.filter(n => !n.read).length
  const didCheckRef   = useRef(false)

  useEffect(() => {
    if (didCheckRef.current) return
    didCheckRef.current = true
    const now = Date.now()
    const injuries = profile.injuries || {}
    const newNotifs = []

    for (const [instanceId, until] of Object.entries(injuries)) {
      if (until < now) {
        const notifId = `recovery_${instanceId}_${until}`
        if (!notifications.some(n => n.id === notifId)) {
          const owned = profile.ownedCards.find(c => c.instanceId === instanceId)
          if (owned) {
            const def = ALL_DEFS_MM.find(d => d.id === owned.cardId)
            newNotifs.push({ id: notifId, type: 'recovery', message: `💪 ${def?.name || 'Zawodnik'} wyleczył się z kontuzji i jest gotowy do gry!`, timestamp: now, read: false })
          }
        }
      }
    }

    const freePackAvailable = (now - (profile.lastFreePackAt || 0)) >= FREE_PACK_COOLDOWN_MS
    if (freePackAvailable) {
      const notifId = `free_pack_${Math.floor((profile.lastFreePackAt || 0) / 1000)}`
      if (!notifications.some(n => n.id === notifId)) {
        newNotifs.push({ id: notifId, type: 'free_pack', message: '📦 Darmowa paczka jest dostępna w Markecie!', timestamp: now, read: false })
      }
    }

    if (newNotifs.length) addNotifications(newNotifs)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setResetIn(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const openNotifs = () => { setShowNotifs(true); markNotificationsRead() }

  const missions = profile.dailyMissions?.missions || []
  const claimableCount = missions.filter(m => !m.claimed && m.progress >= m.target).length

  const startTraining = (type) => {
    if ((profile.activeDeck || []).length < 11) { navigate('deck_builder'); return }
    navigate('match', { matchType: type, matchId: Date.now(), opponentName: getBotName(Date.now(), 'training') })
  }

  const tier = getTier(profile.rating)
  const gems = profile.gems ?? 0

  return (
    <div className="main-menu">
      <div className="mm-bg" />

      {/* ── Top bar ── */}
      <div className="mm-topbar">
        <div className="mm-tp-profile">
          <ProfileAvatar name={profile.name} />
          <div className="mm-tp-info">
            <span className="mm-tp-name">{profile.name || 'Gracz'}</span>
            <span className="mm-tp-tier" style={{ color: tier.color }}>{tier.icon} {tier.label}</span>
          </div>
        </div>

        <div className="mm-tp-currencies">
          <div className="mm-tp-cur">
            <span className="mm-tp-cur-icon">⭐</span>
            <span className="mm-tp-cur-val">{profile.rating}</span>
          </div>
          <div className="mm-tp-cur">
            <span className="mm-tp-cur-icon">🪙</span>
            <span className="mm-tp-cur-val">{profile.coins}</span>
          </div>
          <div className="mm-tp-cur">
            <span className="mm-tp-cur-icon">💎</span>
            <span className="mm-tp-cur-val">{gems}</span>
          </div>
        </div>

        <button className="mm-bell-btn" onClick={openNotifs} aria-label="Powiadomienia">
          🔔
          {unreadCount > 0 && <span className="mm-bell-badge">{unreadCount}</span>}
        </button>
      </div>

      {/* ── Logo ── */}
      <Logo />

      {/* ── W/D/L record ── */}
      <div className="mm-record">
        <span className="mmr-w">{profile.wins}W</span>
        <span className="mmr-sep">·</span>
        <span className="mmr-d">{profile.draws}R</span>
        <span className="mmr-sep">·</span>
        <span className="mmr-l">{profile.losses}P</span>
        <button className="mm-history-btn" onClick={() => setShowHistory(true)}>📋</button>
      </div>

      {/* ── Play section ── */}
      <div className="mm-play-section">
        <button className="mm-btn mm-btn--league" onClick={() => navigate('league')}>
          <span className="mm-btn-icon">🏆</span>
          <div className="mm-btn-body">
            <span className="mm-btn-title">MECZ LIGOWY</span>
            <span className="mm-btn-desc">Rankingowy · Więcej nagród</span>
          </div>
          <span className="mm-btn-ball">⚽</span>
        </button>

        {!trainingOpen ? (
          <button
            className={`mm-btn mm-btn--training${isNewPlayer ? ' mm-btn--onboard' : ''}`}
            onClick={() => setTrainingOpen(true)}
          >
            <span className="mm-btn-icon">🚧</span>
            <div className="mm-btn-body">
              <span className="mm-btn-title">TRENING</span>
              <span className="mm-btn-desc">Bez rankingu · Wybierz poziom</span>
              {isNewPlayer && <span className="mm-onboard-chip">✨ Zacznij tutaj!</span>}
            </div>
            <span className="mm-btn-arrow">›</span>
          </button>
        ) : (
          <div className="mm-training-panel">
            <div className="mm-training-header">
              <span className="mm-training-label">🚧 TRENING — wybierz tryb</span>
              <button className="mm-training-close" onClick={() => setTrainingOpen(false)}>✕</button>
            </div>
            <div className="mm-training-modes">
              <button className="mm-tmode mm-tmode--amateur" onClick={() => startTraining('training_amateur')}>
                <span className="mm-tmode-icon">🟢</span>
                <div className="mm-tmode-body">
                  <span className="mm-tmode-title">AMATOR</span>
                  <span className="mm-tmode-desc">Słabsze drużyny · łatwa wygrana</span>
                </div>
                <span className="mm-tmode-reward">+15 🪙</span>
              </button>
              <button className="mm-tmode mm-tmode--pro" onClick={() => startTraining('training_pro')}>
                <span className="mm-tmode-icon">🔴</span>
                <div className="mm-tmode-body">
                  <span className="mm-tmode-title">PRO</span>
                  <span className="mm-tmode-desc">Top drużyny · 10% szans</span>
                </div>
                <span className="mm-tmode-reward">+100 🪙</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Missions strip ── */}
      <div className="mm-missions-row">
        <button className="mm-missions-bar" onClick={() => setShowMissions(true)}>
          <span className="mm-missions-bar-icon">⚡</span>
          <span className="mm-missions-bar-label">DZIENNE</span>
          <div className="mm-missions-bar-dots">
            {missions.map(m => (
              <span key={m.id} className={`mm-missions-dot ${m.claimed ? 'mm-missions-dot--done' : m.progress >= m.target ? 'mm-missions-dot--ready' : ''}`} />
            ))}
          </div>
          {claimableCount > 0 && <span className="mm-missions-badge">{claimableCount}</span>}
          <span className="mm-missions-bar-arrow">›</span>
        </button>

        <button className="mm-missions-bar mm-missions-bar--weekly" onClick={() => setShowWeeklyPopup(true)}>
          <span className="mm-missions-bar-icon">📅</span>
          <span className="mm-missions-bar-label">TYGODNIOWE</span>
          <span className="mm-weekly-lock">🔒</span>
          <span className="mm-missions-bar-arrow">›</span>
        </button>
      </div>

      {/* ── Grid navigation ── */}
      <div className="mm-grid">
        <button className="mm-grid-btn" onClick={() => navigate('deck_builder')}>
          <span className="mm-grid-icon">🃏</span>
          <span className="mm-grid-label">Skład</span>
        </button>
        <button className="mm-grid-btn" onClick={() => navigate('market')}>
          <span className="mm-grid-icon">🛒</span>
          <span className="mm-grid-label">Market</span>
        </button>
        <button className="mm-grid-btn" onClick={() => navigate('players')}>
          <span className="mm-grid-icon">👥</span>
          <span className="mm-grid-label">Zawodnicy</span>
        </button>
        <button className="mm-grid-btn mm-grid-btn--soon" onClick={() => setShowStadion(true)}>
          <span className="mm-grid-icon">🏟️</span>
          <span className="mm-grid-label">Stadion</span>
          <span className="mm-grid-soon-badge">wkrótce</span>
        </button>
        <button className="mm-grid-btn" onClick={() => navigate('settings')}>
          <span className="mm-grid-icon">⚙️</span>
          <span className="mm-grid-label">Ustawienia</span>
        </button>
        <button className="mm-grid-btn" onClick={() => setShowTutorial(true)}>
          <span className="mm-grid-icon">📖</span>
          <span className="mm-grid-label">Jak grać?</span>
        </button>
      </div>

      {/* ── Version ── */}
      <div className="mm-version">
        <span>GOAL TCG v{CHANGELOG[0].version} — build 20260508</span>
        <button className="mm-changelog-btn" onClick={() => setShowChangelog(true)}>?</button>
      </div>

      {/* ── Modals ── */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {showWeeklyPopup && (
        <div className="mm-weekly-overlay" onClick={() => setShowWeeklyPopup(false)}>
          <div className="mm-weekly-panel" onClick={e => e.stopPropagation()}>
            <div className="mm-weekly-icon">📅</div>
            <div className="mm-weekly-title">Misje tygodniowe</div>
            <div className="mm-weekly-msg">wkrótce!</div>
            <button className="mm-weekly-close-btn" onClick={() => setShowWeeklyPopup(false)}>Zamknij</button>
          </div>
        </div>
      )}

      {showMissions && (
        <div className="mm-missions-overlay" onClick={() => setShowMissions(false)}>
          <div className="mm-missions-panel" onClick={e => e.stopPropagation()}>
            <div className="mm-missions-header">
              <span className="mm-missions-title">⚡ MISJE DZIENNE</span>
              <span className="mm-missions-reset">Reset za {resetIn}</span>
              <button className="mm-missions-close" onClick={() => setShowMissions(false)}>✕</button>
            </div>
            <div className="mm-missions-list">
              {missions.map(m => {
                const pct = Math.min(100, (m.progress / m.target) * 100)
                const ready = !m.claimed && m.progress >= m.target
                return (
                  <div key={m.id} className={`mm-mission ${m.claimed ? 'mm-mission--done' : ready ? 'mm-mission--ready' : ''}`}>
                    <span className="mm-mission-icon">{m.icon}</span>
                    <div className="mm-mission-body">
                      <span className="mm-mission-label">{m.label}</span>
                      <div className="mm-mission-track">
                        <div className="mm-mission-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mm-mission-count">{Math.min(m.progress, m.target)}/{m.target}</span>
                    </div>
                    <div className="mm-mission-right">
                      {m.claimed ? (
                        <span className="mm-mission-check">✓</span>
                      ) : (
                        <button
                          className={`mm-mission-claim ${ready ? 'mm-mission-claim--ready' : ''}`}
                          onClick={() => ready && claimMission(m.id)}
                          disabled={!ready}
                        >
                          +{m.reward} 🪙
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showStadion && (
        <div className="mm-stadion-overlay" onClick={() => setShowStadion(false)}>
          <div className="mm-stadion-panel" onClick={e => e.stopPropagation()}>
            <div className="mm-stadion-icon">🏟️</div>
            <div className="mm-stadion-title">STADION</div>
            <div className="mm-stadion-features">
              <div className="mm-stadion-feat">🎽 Edytor strojów</div>
              <div className="mm-stadion-feat">🛡️ Herb i kolory klubu</div>
              <div className="mm-stadion-feat">🏗️ Ulepszenia stadionu</div>
              <div className="mm-stadion-feat">🤝 Kontrakty sponsorów</div>
            </div>
            <div className="mm-stadion-soon-msg">wkrótce!</div>
            <button className="mm-weekly-close-btn" onClick={() => setShowStadion(false)}>Zamknij</button>
          </div>
        </div>
      )}

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showHistory && <HistoryModal history={profile.matchHistory} onClose={() => setShowHistory(false)} />}
      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          onDismiss={dismissNotification}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </div>
  )
}
