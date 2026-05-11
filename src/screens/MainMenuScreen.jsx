import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { getTier, getBotName } from '../data/botNames'
import { CHANGELOG } from '../data/changelog'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './MainMenuScreen.css'

const ALL_DEFS_MM = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]
const FREE_PACK_COOLDOWN_MS = 12 * 60 * 60 * 1000

function fmtRelTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'przed chwilą'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz. temu`
  return `${Math.floor(diff / 86400000)} dni temu`
}

function NotificationPanel({ notifications, onDismiss, onClearAll, onClose }) {
  return (
    <div className="mm-notif-overlay" onClick={onClose}>
      <div className="mm-notif-panel" onClick={e => e.stopPropagation()}>
        <div className="mm-notif-header">
          <span className="mm-notif-title">🔔 Powiadomienia</span>
          <div className="mm-notif-header-actions">
            {notifications.length > 0 && (
              <button className="mm-notif-clear-all" onClick={onClearAll}>Wyczyść wszystkie</button>
            )}
            <button className="mm-notif-close" onClick={onClose}>✕</button>
          </div>
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

function SeasonPopup({ onClose }) {
  const NODES = [
    { lvl: 5,  free: { icon: '🪙', text: '100 monet' },              prem: { icon: '🪙', text: '300 monet' } },
    { lvl: 10, free: { icon: '📦', text: 'Paczka kart' },             prem: { icon: '📋', text: 'Kontrakt\nsponsorski' } },
    { lvl: 15, free: { icon: '🪙', text: '300 monet' },               prem: { icon: '💎', text: '2 klejnoty' } },
    { lvl: 20, free: { icon: '⭐', text: 'Karta\nspecjalna', sp: true }, prem: { icon: '🎽', text: 'Kit\n"Thunder"', sp: true } },
    { lvl: 25, free: { icon: '💎', text: '1 klejnot' },                prem: { icon: '🛡️', text: 'Herb\ndrużyny' } },
    { lvl: 30, free: { icon: '🏟️', text: 'Tło\nstadionu' },           prem: { icon: '📦', text: 'Mega\nPaczka' } },
    { lvl: 35, free: { icon: '🪙', text: '500 monet' },               prem: { icon: '💎', text: '5 klejnotów' } },
    { lvl: 40, free: { icon: '🃏', text: 'Karta\nlegendarna', sp: true }, prem: { icon: '🏆', text: '"El Capitán\nPRO"', sp: true } },
  ]
  return (
    <div className="mm-season-overlay" onClick={onClose}>
      <div className="mm-season-panel" onClick={e => e.stopPropagation()}>
        <div className="mm-season-soon-badge">WKRÓTCE</div>
        <div className="mm-season-title">⚡ SEZON 1</div>
        <div className="mm-season-subtitle">Battle Pass · 40 poziomów</div>

        <div className="mm-season-highlights">
          <div className="mm-season-hl">
            <div className="mm-season-hl-lvl">LVL 20</div>
            <div className="mm-season-hl-icon">⭐</div>
            <div className="mm-season-hl-name">Karta specjalna</div>
            <div className="mm-season-hl-sub">Połowa sezonu</div>
          </div>
          <div className="mm-season-hl mm-season-hl--prem">
            <div className="mm-season-hl-lvl">LVL 20</div>
            <div className="mm-season-hl-icon">🎽</div>
            <div className="mm-season-hl-name">Kit "Thunder"</div>
            <div className="mm-season-hl-sub">Tylko Premium</div>
          </div>
          <div className="mm-season-hl">
            <div className="mm-season-hl-lvl">LVL 40</div>
            <div className="mm-season-hl-icon">🃏</div>
            <div className="mm-season-hl-name">Karta legendarna</div>
            <div className="mm-season-hl-sub">Koniec sezonu</div>
          </div>
          <div className="mm-season-hl mm-season-hl--prem">
            <div className="mm-season-hl-lvl">LVL 40</div>
            <div className="mm-season-hl-icon">🏆</div>
            <div className="mm-season-hl-name">El Capitán PRO</div>
            <div className="mm-season-hl-sub">Tylko Premium</div>
          </div>
        </div>

        <div className="mm-season-tracks">
          <div className="mm-season-track-label mm-season-track-label--free">DARMOWY</div>
          <div className="mm-season-track">
            {NODES.map(n => (
              <div key={n.lvl} className={`mm-season-node${n.free.sp ? ' mm-season-node--sp' : ''}`}>
                <div className="mm-season-reward mm-season-reward--free">
                  <span className="mm-snr-icon">{n.free.icon}</span>
                  <span className="mm-snr-text">{n.free.text}</span>
                </div>
                <div className="mm-season-node-circle">{n.lvl}</div>
                <div className="mm-season-reward mm-season-reward--premium mm-season-reward--locked">
                  <span className="mm-snr-icon">{n.prem.icon}</span>
                  <span className="mm-snr-text">{n.prem.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mm-season-track-label mm-season-track-label--premium">💎 PREMIUM</div>
        </div>

        <div className="mm-season-desc">Rozgrywaj mecze, ukończ misje tygodniowe i zdobywaj XP. Odbieraj karty, kity, herby i klejnoty każdego sezonu!</div>
        <button className="mm-season-close-btn" onClick={onClose}>Zamknij</button>
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
  { icon: '📦', title: 'Paczki i rynek', text: 'W Markecie kupujesz paczki kart za monety lub klejnoty. Możesz też sprzedawać karty, których nie potrzebujesz. Odbierz darmową paczkę raz na 12 godzin!' },
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
  const { addCoins, update } = useProfile()
  const [showDevInput, setShowDevInput] = useState(false)
  const [devPassword, setDevPassword] = useState('')
  const [devUnlocked, setDevUnlocked] = useState(false)
  const [devMsg, setDevMsg] = useState('')

  const showMsg = (msg) => { setDevMsg(msg); setTimeout(() => setDevMsg(''), 2200) }

  const handleDevBtn = () => {
    if (devUnlocked) { setDevUnlocked(false); return }
    setShowDevInput(v => !v)
    setDevPassword('')
  }

  const handleDevSubmit = (e) => {
    e.preventDefault()
    if (devPassword === 'max') { setDevUnlocked(true); setShowDevInput(false) }
    setDevPassword('')
  }

  const devAddGold = () => { addCoins(5000); showMsg('🪙 +5 000 monet') }

  const devAddAllPlayers = () => {
    update(prev => {
      const existingIds = new Set(prev.ownedCards.map(c => c.cardId))
      const newCards = CARD_DEFINITIONS
        .filter(d => !existingIds.has(d.id))
        .map(d => ({ instanceId: `dev_${d.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`, cardId: d.id, isStarter: false, upgradeLevel: 0 }))
      return { ...prev, ownedCards: [...prev.ownedCards, ...newCards] }
    })
    showMsg('👥 Wszyscy zawodnicy dodani')
  }

  const devCompleteDailyMissions = () => {
    update(prev => {
      if (!prev.dailyMissions) return prev
      return { ...prev, dailyMissions: { ...prev.dailyMissions, missions: prev.dailyMissions.missions.map(m => ({ ...m, progress: m.target })) } }
    })
    showMsg('✅ Misje dzienne ukończone')
  }

  const devCompleteWeeklyMissions = () => {
    update(prev => {
      if (!prev.weeklyMissions) return prev
      return { ...prev, weeklyMissions: { ...prev.weeklyMissions, missions: prev.weeklyMissions.missions.map(m => ({ ...m, progress: m.target, locked: false })) } }
    })
    showMsg('📅 Misje tygodniowe ukończone')
  }

  return (
    <div className="cl-overlay" onClick={onClose}>
      <div className="cl-modal" onClick={e => e.stopPropagation()}>
        <div className="cl-header">
          <span className="cl-title">📋 CO NOWEGO?</span>
          <div className="cl-header-right">
            <button className={`cl-dev-btn${devUnlocked ? ' cl-dev-btn--on' : ''}`} onClick={handleDevBtn}>DEV</button>
            <button className="cl-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {showDevInput && (
          <form className="cl-dev-form" onSubmit={handleDevSubmit}>
            <input
              className="cl-dev-input"
              type="password"
              placeholder="Hasło..."
              value={devPassword}
              onChange={e => setDevPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="cl-dev-submit">OK</button>
          </form>
        )}

        {devUnlocked && (
          <div className="cl-dev-panel">
            <div className="cl-dev-header">⚙️ PANEL DEV</div>
            {devMsg && <div className="cl-dev-msg">{devMsg}</div>}
            <div className="cl-dev-btns">
              <button className="cl-dev-action" onClick={devAddGold}>🪙 +5 000 monet</button>
              <button className="cl-dev-action" onClick={devAddAllPlayers}>👥 Wszyscy zawodnicy</button>
              <button className="cl-dev-action" onClick={devCompleteDailyMissions}>✅ Misje dzienne</button>
              <button className="cl-dev-action" onClick={devCompleteWeeklyMissions}>📅 Misje tygodniowe</button>
            </div>
          </div>
        )}

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
  const { profile, claimMission, claimWeeklyMission, addNotifications, markNotificationsRead, dismissNotification, clearNotifications } = useProfile()

  const [showTutorial, setShowTutorial]   = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [showNotifs, setShowNotifs]       = useState(false)
  const [showMissions, setShowMissions]   = useState(false)
  const [showStadion, setShowStadion]     = useState(false)
  const [showSeasonPopup, setShowSeasonPopup] = useState(false)
  const [trainingOpen, setTrainingOpen]   = useState(false)
  const [resetIn, setResetIn]             = useState('')
  const [missionTab, setMissionTab]       = useState('daily')

  const missions = profile.dailyMissions?.missions || []
  const weeklyMissions = profile.weeklyMissions?.missions || []
  const allMissionsDone = missions.length > 0 && missions.every(m => m.claimed)
  const [missionsExpanded, setMissionsExpanded] = useState(!allMissionsDone)

  // Auto-collapse when last mission is claimed
  useEffect(() => {
    if (allMissionsDone) setMissionsExpanded(false)
  }, [allMissionsDone])

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
  const claimableCount = missions.filter(m => !m.claimed && m.progress >= m.target).length
  const weeklyClaimableCount = weeklyMissions.filter(m => !m.locked && !m.claimed && m.progress >= m.target).length

  const startTraining = (type) => {
    if ((profile.activeDeck || []).length < 11) { navigate('deck_builder'); return }
    navigate('match', { matchType: type, matchId: Date.now(), opponentName: getBotName(Date.now(), 'training') })
  }

  const tier = getTier(profile.rating)
  const gems = profile.gems ?? 0

  return (
    <div className="main-menu">

      {/* ── Stadium hero ── */}
      <div className="mm-stadium-hero">
        <div className="mm-stadium-floodlights" />
        <div className="mm-stadium-pitch" />

        {/* Top bar — only avatar + name + currencies + bell (no tier here) */}
        <div className="mm-topbar">
          <div className="mm-tp-profile">
            <ProfileAvatar name={profile.name} />
            <span className="mm-tp-name">{profile.name || 'Gracz'}</span>
          </div>

          <div className="mm-tp-currencies">
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

        {/* Logo */}
        <Logo />

        {/* Stats bar */}
        <div className="mm-stats-bar">
          <span className="mm-stats-tier" style={{ color: tier.color }}>{tier.icon} {tier.label.toUpperCase()}</span>
          <div className="mm-stats-sep" />
          <div className="mm-stats-record">
            <span className="mmr-w">{profile.wins}W</span>
            <span className="mmr-sep">·</span>
            <span className="mmr-d">{profile.draws}R</span>
            <span className="mmr-sep">·</span>
            <span className="mmr-l">{profile.losses}P</span>
          </div>
          <div className="mm-stats-sep" />
          <button className="mm-stats-rank" onClick={() => setShowHistory(true)}>
            📊 RANK #{profile.rating}
          </button>
        </div>
      </div>

      {/* ── Play cards ── */}
      <div className="mm-play-row">

        {/* League */}
        <button className="mm-play-card mm-play-card--league" onClick={() => navigate('league')}>
          <div className="mm-play-card-bg mm-play-card-bg--league" />
          <div className="mm-play-card-body">
            <span className="mm-play-card-title">LIGA</span>
            <span className="mm-play-card-desc">Zagraj mecz rankingowy PvP!</span>
          </div>
        </button>

        {/* Training — expands inline */}
        <button
          className={`mm-play-card mm-play-card--training${trainingOpen ? ' mm-play-card--open' : ''}${isNewPlayer && !trainingOpen ? ' mm-play-card--onboard' : ''}`}
          onClick={() => !trainingOpen && setTrainingOpen(true)}
        >
          <div className="mm-play-card-bg mm-play-card-bg--training" />
          {!trainingOpen ? (
            <div className="mm-play-card-body">
              <span className="mm-play-card-title">TRENING</span>
              <span className="mm-play-card-desc">Rozwijaj zespół i zdobywaj nagrody!</span>
              {isNewPlayer && <span className="mm-onboard-chip">✨ Zacznij tutaj!</span>}
            </div>
          ) : (
            <div className="mm-training-inline" onClick={e => e.stopPropagation()}>
              <div className="mm-training-inline-hdr">
                <span className="mm-training-inline-title">TRENING</span>
                <button className="mm-training-inline-close" onClick={e => { e.stopPropagation(); setTrainingOpen(false) }}>✕</button>
              </div>
              <button className="mm-tmode-inline mm-tmode-inline--amateur" onClick={() => startTraining('training_amateur')}>
                <div className="mm-tmode-inline-body">
                  <span className="mm-tmode-inline-name">🟢 AMATOR</span>
                  <span className="mm-tmode-inline-desc">Łatwa wygrana</span>
                </div>
                <span className="mm-tmode-inline-reward">+40🪙</span>
              </button>
              <button className="mm-tmode-inline mm-tmode-inline--pro" onClick={() => startTraining('training_pro')}>
                <div className="mm-tmode-inline-body">
                  <span className="mm-tmode-inline-name">🔴 PRO</span>
                  <span className="mm-tmode-inline-desc">10% szans na wygraną</span>
                </div>
                <span className="mm-tmode-inline-reward">+150🪙</span>
              </button>
            </div>
          )}
        </button>
      </div>

      {/* ── Separator ── */}
      <div className="mm-separator" />

      {/* ── Missions ── */}
      {allMissionsDone && !missionsExpanded ? (
        <button className="mm-missions-done-bar" onClick={() => setMissionsExpanded(true)}>
          <span>✅ Misje dzienne ukończone</span>
          <span className="mm-missions-done-bar-arrow">›</span>
        </button>
      ) : (
        <div className="mm-missions-section">
          <div className="mm-missions-hdr">
            <span className="mm-missions-hdr-title">🎯 MISJE</span>
            <div className="mm-missions-tabs">
              <button className={`mm-mtab ${missionTab === 'daily' ? 'mm-mtab--active' : ''}`} onClick={() => setMissionTab('daily')}>
                DZIENNE {claimableCount > 0 && <span className="mm-mtab-dot mm-mtab-dot--ready" />}
              </button>
              <button className={`mm-mtab ${missionTab === 'weekly' ? 'mm-mtab--active' : ''}`} onClick={() => setMissionTab('weekly')}>
                TYGODN. {weeklyClaimableCount > 0 && <span className="mm-mtab-dot mm-mtab-dot--ready" />}
              </button>
              <button className="mm-mtab mm-mtab--season" onClick={() => setShowSeasonPopup(true)}>SEZON 🔒</button>
            </div>
          </div>
          {missionTab === 'daily' && (
            <div className="mm-missions-cards">
              {missions.length === 0 && <div className="mm-mc mm-mc--empty">Brak misji</div>}
              {missions.slice(0, 3).map(m => {
                const pct = Math.min(100, (m.progress / m.target) * 100)
                const ready = !m.claimed && m.progress >= m.target
                return (
                  <div key={m.id} className={`mm-mc ${m.claimed ? 'mm-mc--done' : ready ? 'mm-mc--ready' : ''}`}>
                    <div className="mm-mc-header">
                      <span className="mm-mc-label"><span className="mm-mc-icon">{m.icon}</span>{m.label}</span>
                    </div>
                    <div className="mm-mc-bar"><div className="mm-mc-fill" style={{ width: `${pct}%` }} /></div>
                    <div className="mm-mc-footer">
                      <span className="mm-mc-count">{Math.min(m.progress, m.target)}/{m.target}</span>
                      {m.claimed
                        ? <span className="mm-mc-check">✓</span>
                        : <button className={`mm-mc-claim ${ready ? 'mm-mc-claim--ready' : ''}`} onClick={() => ready && claimMission(m.id)} disabled={!ready}>
                            +{m.reward}🪙
                          </button>
                      }
                    </div>
                  </div>
                )
              })}
              {missions.length > 3 && (
                <button className="mm-mc mm-mc-see-more" onClick={() => setShowMissions(true)}>
                  <span className="mm-mc-see-more-icon">+</span>
                  <span>{missions.length - 3} więcej</span>
                </button>
              )}
            </div>
          )}
          {missionTab === 'weekly' && (
            <div className="mm-missions-cards">
              {weeklyMissions.length === 0 && <div className="mm-mc mm-mc--empty">Brak misji</div>}
              {weeklyMissions.map(m => {
                if (m.locked) {
                  return (
                    <div key={m.id} className="mm-mc mm-mc--locked-mystery">
                      <div className="mm-mc-mystery-icon">🔒</div>
                      <div className="mm-mc-mystery-label">Ukończ pozostałe misje</div>
                    </div>
                  )
                }
                const pct = Math.min(100, (m.progress / m.target) * 100)
                const ready = !m.claimed && m.progress >= m.target
                const isGem = m.rewardType === 'gems'
                return (
                  <div key={m.id} className={`mm-mc ${m.claimed ? 'mm-mc--done' : ready ? 'mm-mc--ready' : ''} ${isGem ? 'mm-mc--gem' : ''}`}>
                    <div className="mm-mc-header">
                      <span className="mm-mc-label"><span className="mm-mc-icon">{m.icon}</span>{m.label}</span>
                      {isGem && <span className="mm-mc-gem-badge">💎</span>}
                    </div>
                    <div className="mm-mc-bar"><div className={`mm-mc-fill ${isGem ? 'mm-mc-fill--gem' : ''}`} style={{ width: `${pct}%` }} /></div>
                    <div className="mm-mc-footer">
                      <span className="mm-mc-count">{Math.min(m.progress, m.target)}/{m.target}</span>
                      {m.claimed
                        ? <span className="mm-mc-check">✓</span>
                        : <button className={`mm-mc-claim ${ready ? 'mm-mc-claim--ready' : ''} ${isGem ? 'mm-mc-claim--gem' : ''}`} onClick={() => ready && claimWeeklyMission(m.id)} disabled={!ready}>
                            +{m.reward}{isGem ? '💎' : '🪙'}
                          </button>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Separator ── */}
      <div className="mm-separator" />

      {/* ── Grid navigation ── */}
      <div className="mm-grid">
        <button className="mm-grid-btn" onClick={() => navigate('deck_builder')}>
          <span className="mm-grid-icon">🃏</span>
          <span className="mm-grid-label">SKŁAD</span>
        </button>
        <button className="mm-grid-btn" onClick={() => navigate('players')}>
          <span className="mm-grid-icon">👥</span>
          <span className="mm-grid-label">ZAWODNICY</span>
        </button>
        <button className="mm-grid-btn" onClick={() => navigate('market')}>
          <span className="mm-grid-icon">🛒</span>
          <span className="mm-grid-label">MARKET</span>
        </button>
        <button className="mm-grid-btn mm-grid-btn--soon" onClick={() => setShowStadion(true)}>
          <span className="mm-grid-icon">🏟️</span>
          <span className="mm-grid-label">STADION</span>
          <span className="mm-grid-soon-badge">wkrótce</span>
        </button>
        <button className="mm-grid-btn" onClick={() => navigate('settings')}>
          <span className="mm-grid-icon">⚙️</span>
          <span className="mm-grid-label">USTAWIENIA</span>
        </button>
        <button className="mm-grid-btn" onClick={() => setShowTutorial(true)}>
          <span className="mm-grid-icon">❓</span>
          <span className="mm-grid-label">JAK GRAĆ?</span>
        </button>
      </div>

      {/* ── Version ── */}
      <div className="mm-version">
        <div className="mm-version-row">
          <span>GOAL TCG v{CHANGELOG[0].version}</span>
          <button className="mm-changelog-btn" onClick={() => setShowChangelog(true)}>?</button>
        </div>
        <span className="mm-version-powered">Powered by AppHill.Agency</span>
      </div>

      {/* ── Modals ── */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {showSeasonPopup && <SeasonPopup onClose={() => setShowSeasonPopup(false)} />}

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
                        >+{m.reward} 🪙</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showHistory && <HistoryModal history={profile.matchHistory} onClose={() => setShowHistory(false)} />}
      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          onDismiss={dismissNotification}
          onClearAll={() => { clearNotifications(); setShowNotifs(false) }}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </div>
  )
}
