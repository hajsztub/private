import React, { useState, useEffect } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { getTier, getBotName } from '../data/botNames'
import { CHANGELOG } from '../data/changelog'
import './MainMenuScreen.css'

const TUTORIAL_SECTIONS = [
  {
    icon: '🃏',
    title: 'Czym jest GOAL TCG?',
    text: 'GOAL TCG to gra karciana oparta na piłce nożnej. Zbuduj skład 11 zawodników i walcz przeciwko rywalom w turowych meczach.',
  },
  {
    icon: '⚽',
    title: 'Jak przebiega mecz?',
    text: 'Mecz trwa 10 rund. Każda runda to wymiana kart — ty i rywal gracie po jednej karcie z ręki. Wyższy Atak pokonuje niższą Obronę. Za każde trafienie dostajesz punkt.',
  },
  {
    icon: '🗂️',
    title: 'Pozycje i strefy',
    text: 'Masz 3 strefy ataku i 3 strefy obrony. Napastnicy atakują, obrońcy bronią. Bramkarz chroni całą bramkę — jego statystyka DEF dodaje się do każdej obrony.',
  },
  {
    icon: '✨',
    title: 'Zdolności specjalne',
    text: 'Każda karta może posiadać specjalną zdolność — buff, debuff lub efekt pasywny. Aktywujesz ją klikając kartę na boisku. Czytaj opisy kart w Składzie!',
  },
  {
    icon: '🏆',
    title: 'Mecze i nagrody',
    text: 'Mecz Ligowy daje punkty rankingowe i większe nagrody. Trening pozwala ćwiczyć bez ryzyka utraty ratingu. Wygrane mecze przynoszą monety do kupowania nowych kart.',
  },
  {
    icon: '📦',
    title: 'Paczki i rynek',
    text: 'W Markecie kupujesz paczki kart za monety lub klejnoty. Możesz też sprzedawać karty, których nie potrzebujesz. Obejrzyj reklamę raz na godzinę po darmowe nagrody!',
  },
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
          {page > 0 && (
            <button className="tut-btn tut-btn--back" onClick={() => setPage(p => p - 1)}>← Wstecz</button>
          )}
          {!isLast ? (
            <button className="tut-btn tut-btn--next" onClick={() => setPage(p => p + 1)}>Dalej →</button>
          ) : (
            <button className="tut-btn tut-btn--done" onClick={onClose}>Graj! ⚽</button>
          )}
        </div>
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
                <span className="cl-date">{entry.date}</span>
              </div>
              <ul className="cl-changes">
                {entry.changes.map((c, i) => (
                  <li key={i} className="cl-change">{c}</li>
                ))}
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
      {!failed ? (
        <img
          className="mm-avatar-img"
          src="/avatar_player.png"
          alt=""
          onError={() => setFailed(true)}
          draggable={false}
        />
      ) : (
        initial
      )}
    </div>
  )
}

export default function MainMenuScreen() {
  const { navigate } = useRouter()
  const { profile, claimMission } = useProfile()
  const [showTutorial, setShowTutorial] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [trainingOpen, setTrainingOpen] = useState(false)
  const [showMissions, setShowMissions] = useState(false)
  const [showWeeklyPopup, setShowWeeklyPopup] = useState(false)
  const [resetIn, setResetIn] = useState('')

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

  const missions = profile.dailyMissions?.missions || []
  const claimableCount = missions.filter(m => !m.claimed && m.progress >= m.target).length

  const startTraining = (type) => {
    if ((profile.activeDeck || []).length < 11) { navigate('deck_builder'); return }
    const botName = getBotName(Date.now(), 'training')
    navigate('match', { matchType: type, matchId: Date.now(), opponentName: botName })
  }

  const tier = getTier(profile.rating)
  const gems = profile.gems ?? 0

  return (
    <div className="main-menu">
      <div className="mm-bg-field" />

      <Logo />

      {/* ── Profile card ── */}
      <div className="mm-profile-card">
        <div className="mm-profile-left">
          <div className="mm-avatar-wrap">
            <ProfileAvatar name={profile.name} />
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
        <span className="mmr-sep">|</span>
        <span className="mmr-d">{profile.draws}R</span>
        <span className="mmr-sep">|</span>
        <span className="mmr-l">{profile.losses}P</span>
      </div>

      {/* ── Daily missions button ── */}
      <button className="mm-missions-bar" onClick={() => setShowMissions(true)}>
        <span className="mm-missions-bar-icon">⚡</span>
        <span className="mm-missions-bar-label">MISJE DNIA</span>
        <div className="mm-missions-bar-dots">
          {missions.map(m => (
            <span
              key={m.id}
              className={`mm-missions-dot ${m.claimed ? 'mm-missions-dot--done' : m.progress >= m.target ? 'mm-missions-dot--ready' : ''}`}
            />
          ))}
        </div>
        {claimableCount > 0 && (
          <span className="mm-missions-badge">{claimableCount}</span>
        )}
        <span className="mm-missions-bar-arrow">›</span>
      </button>

      {/* ── Weekly missions bar ── */}
      <button className="mm-missions-bar mm-missions-bar--weekly" onClick={() => setShowWeeklyPopup(true)}>
        <span className="mm-missions-bar-icon">📅</span>
        <span className="mm-missions-bar-label">MISJE TYGODNIOWE</span>
        <span className="mm-weekly-lock">🔒</span>
        <span className="mm-missions-bar-arrow">›</span>
      </button>

      {/* ── Play buttons ── */}
      <div className="mm-play-section">
        <button className="mm-btn mm-btn--league" onClick={() => navigate('league')}>
          <div className="mm-btn-icon-wrap">
            <span className="mm-btn-icon">🏆</span>
          </div>
          <div className="mm-btn-body">
            <span className="mm-btn-title">MECZ LIGOWY</span>
            <span className="mm-btn-desc">Rankingowy · Więcej nagród</span>
          </div>
          <div className="mm-btn-right">
            <span className="mm-btn-ball">⚽</span>
          </div>
        </button>

        {!trainingOpen ? (
          <button className="mm-btn mm-btn--training" onClick={() => setTrainingOpen(true)}>
            <div className="mm-btn-icon-wrap">
              <span className="mm-btn-icon">🚧</span>
            </div>
            <div className="mm-btn-body">
              <span className="mm-btn-title">TRENING</span>
              <span className="mm-btn-desc">Bez rankingu · Wybierz poziom</span>
            </div>
            <div className="mm-btn-right">
              <span className="mm-btn-arrow">›</span>
            </div>
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

      {/* ── Bottom nav ── */}
      <div className="mm-nav">
        <button className="mm-nav-btn" onClick={() => navigate('deck_builder')}>
          <span className="mm-nav-icon">🃏</span>
          <span className="mm-nav-label">Skład</span>
        </button>
        <button className="mm-nav-btn" onClick={() => navigate('market')}>
          <span className="mm-nav-icon">🛒</span>
          <span className="mm-nav-label">Market</span>
        </button>
        <button className="mm-nav-btn" onClick={() => navigate('players')}>
          <span className="mm-nav-icon">👥</span>
          <span className="mm-nav-label">Karty</span>
        </button>
        <button className="mm-nav-btn" onClick={() => navigate('settings')}>
          <span className="mm-nav-icon">⚙️</span>
          <span className="mm-nav-label">Ustawienia</span>
        </button>
        <button className="mm-nav-btn mm-nav-btn--tutorial" onClick={() => setShowTutorial(true)}>
          <span className="mm-nav-icon">📖</span>
          <span className="mm-nav-label">Jak grać?</span>
        </button>
      </div>

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
              <span className="mm-missions-title">⚡ MISJE DNIA</span>
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

      <div className="mm-version">
        <span>GOAL TCG v{CHANGELOG[0].version} — build 20260508</span>
        <button className="mm-changelog-btn" onClick={() => setShowChangelog(true)}>?</button>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  )
}
