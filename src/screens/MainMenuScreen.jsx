import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { getTier } from '../data/botNames'
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
  const { profile } = useProfile()
  const [showTutorial, setShowTutorial] = useState(false)

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

        <button className="mm-btn mm-btn--training" onClick={() => {
          if ((profile.activeDeck || []).length < 11) { navigate('deck_builder'); return }
          navigate('match', { matchType: 'local', matchId: Date.now() })
        }}>
          <div className="mm-btn-icon-wrap">
            <span className="mm-btn-icon">🚧</span>
          </div>
          <div className="mm-btn-body">
            <span className="mm-btn-title">TRENING</span>
            <span className="mm-btn-desc">Bez rankingu · Mniej nagród</span>
          </div>
          <div className="mm-btn-right">
            <span className="mm-btn-arrow">›</span>
          </div>
        </button>
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

      <div className="mm-version">GOAL TCG v1.1 — build 20260507</div>
    </div>
  )
}
