import React from 'react'
import './PlayerCard.css'

const TYPE_COLORS = {
  attack: '#4caf50',
  midfield: '#9c27b0',
  defense: '#2196f3',
  goalkeeper: '#607d8b',
}

const TYPE_BG = {
  attack: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  midfield: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
  defense: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
  goalkeeper: 'linear-gradient(135deg, #eceff1, #cfd8dc)',
}

const PLAYER_ILLUSTRATIONS = {
  hugo: HugoIllustration,
  harry: HarryIllustration,
  rushy: RushyIllustration,
  wilko: WilkoIllustration,
  freddie: FreddieIllustration,
  marco: MarcoIllustration,
  aaron: AaronIllustration,
  titan: TitanIllustration,
}

export default function PlayerCard({
  card,
  onClick,
  selected,
  dimmed,
  showBack,
  compact,
  onActivate,
  canActivate,
  isCurrentPlayer,
}) {
  if (showBack) {
    return (
      <div className={`player-card player-card--back ${compact ? 'player-card--compact' : ''}`}>
        <div className="card-back-pattern">
          <span className="card-back-logo">⚽</span>
          <span className="card-back-text">football<br />cards</span>
        </div>
      </div>
    )
  }

  const Illustration = PLAYER_ILLUSTRATIONS[card.id] || DefaultIllustration
  const typeBg = TYPE_BG[card.type] || TYPE_BG.attack
  const typeColor = TYPE_COLORS[card.type] || TYPE_COLORS.attack

  const isGoalkeeper = card.type === 'goalkeeper'

  return (
    <div
      className={[
        'player-card',
        selected ? 'player-card--selected' : '',
        dimmed ? 'player-card--dimmed' : '',
        compact ? 'player-card--compact' : '',
        card.isLocked ? 'player-card--locked' : '',
        card.justPlaced ? 'player-card--just-placed' : '',
        onClick ? 'player-card--clickable' : '',
      ].join(' ')}
      style={{ background: typeBg }}
      onClick={onClick}
    >
      {/* Type badge */}
      <div className="card-type-badge" style={{ background: typeColor }}>
        {card.typeLabel}
      </div>

      {/* Illustration area */}
      <div className="card-illustration">
        <Illustration />
      </div>

      {/* Name bar */}
      <div className="card-name-bar">
        <span className="card-name">{card.name}</span>
      </div>

      {/* Ability section */}
      {!compact && (
        <div className="card-ability">
          <div className="ability-name">{card.abilityName}</div>
          {card.abilityType === 'passive' ? (
            <p className="ability-desc">
              <span className="ability-label ability-label--passive">PASYWNA:</span>{' '}
              {card.abilityDescription}
            </p>
          ) : (
            <>
              <p className="ability-desc">
                <span className="ability-label ability-label--active">AKTYWACJA:</span>{' '}
                {card.abilityDescription}
              </p>
              {card.noActivationDescription && (
                <p className="ability-desc">
                  <span className="ability-label ability-label--no-activation">BRAK AKTYWACJI:</span>{' '}
                  {card.noActivationDescription}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="card-stats">
        <div className="stat stat--attack">
          <span>{isGoalkeeper ? card.currentDefenseStat ?? card.defenseStat : card.currentAttackStat ?? card.attackStat}</span>
        </div>
        <div className="stat-spacer">
          <span className="card-name-small">{card.name}</span>
        </div>
        <div className="stat stat--defense">
          <span>{isGoalkeeper ? '' : card.currentDefenseStat ?? card.defenseStat}</span>
        </div>
      </div>

      {/* Activate button */}
      {canActivate && isCurrentPlayer && !card.isLocked && !card.justPlaced && card.abilityType !== 'passive' && (
        <button
          className="card-activate-btn"
          onClick={(e) => { e.stopPropagation(); onActivate?.(card.instanceId) }}
        >
          Aktywuj
        </button>
      )}

      {card.isLocked && <div className="card-locked-overlay">🔒 {card.lockedRounds}R</div>}
    </div>
  )
}

// ── SVG Illustrations ──────────────────────────────────────────────────────

function HugoIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Body */}
      <ellipse cx="50" cy="95" rx="28" ry="20" fill="#4a7c4e" />
      {/* Neck */}
      <rect x="44" y="72" width="12" height="15" rx="4" fill="#c68642" />
      {/* Head */}
      <ellipse cx="50" cy="62" rx="24" ry="26" fill="#c68642" />
      {/* Hair - curly */}
      <circle cx="30" cy="48" r="10" fill="#2c1a0e" />
      <circle cx="38" cy="40" r="10" fill="#2c1a0e" />
      <circle cx="50" cy="37" r="10" fill="#2c1a0e" />
      <circle cx="62" cy="40" r="10" fill="#2c1a0e" />
      <circle cx="70" cy="48" r="10" fill="#2c1a0e" />
      {/* Eyes */}
      <ellipse cx="42" cy="63" rx="5" ry="6" fill="white" />
      <ellipse cx="58" cy="63" rx="5" ry="6" fill="white" />
      <circle cx="43" cy="64" r="3" fill="#3d2b1f" />
      <circle cx="59" cy="64" r="3" fill="#3d2b1f" />
      {/* Big smile */}
      <path d="M38 74 Q50 86 62 74" stroke="#a0522d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M40 76 Q50 84 60 76" fill="white" />
      {/* Ball */}
      <circle cx="50" cy="108" r="10" fill="white" stroke="#333" strokeWidth="1" />
      <path d="M44 104 L50 98 L56 104 L54 112 L46 112 Z" fill="#333" />
    </svg>
  )
}

function HarryIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Body - jersey */}
      <ellipse cx="50" cy="98" rx="26" ry="18" fill="#6c757d" />
      <text x="50" y="102" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">110</text>
      {/* Neck */}
      <rect x="44" y="73" width="12" height="14" rx="3" fill="#d4a373" />
      {/* Bald head */}
      <ellipse cx="50" cy="60" rx="25" ry="27" fill="#d4a373" />
      {/* Grumpy eyebrows */}
      <path d="M32 50 L44 54" stroke="#8b6347" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 54 L68 50" stroke="#8b6347" strokeWidth="3" strokeLinecap="round" />
      {/* Eyes - narrow/grumpy */}
      <ellipse cx="41" cy="58" rx="6" ry="4" fill="white" />
      <ellipse cx="59" cy="58" rx="6" ry="4" fill="white" />
      <circle cx="42" cy="58" r="2.5" fill="#3d2b1f" />
      <circle cx="60" cy="58" r="2.5" fill="#3d2b1f" />
      {/* Frown */}
      <path d="M40 72 Q50 68 60 72" stroke="#8b6347" strokeWidth="2" fill="none" />
      {/* Ear */}
      <ellipse cx="25" cy="60" rx="5" ry="7" fill="#c4915c" />
      <ellipse cx="75" cy="60" rx="5" ry="7" fill="#c4915c" />
    </svg>
  )
}

function RushyIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Body - running pose */}
      <ellipse cx="52" cy="96" rx="24" ry="18" fill="#e65100" />
      {/* Neck */}
      <rect x="44" y="72" width="12" height="14" rx="3" fill="#ffb347" />
      {/* Head - tilted forward */}
      <ellipse cx="52" cy="60" rx="22" ry="24" fill="#ffb347" />
      {/* Short spiky hair */}
      <ellipse cx="52" cy="40" rx="20" ry="10" fill="#8B4513" />
      <rect x="38" y="34" width="5" height="12" rx="2" fill="#8B4513" transform="rotate(-10,40,40)" />
      <rect x="48" y="30" width="5" height="14" rx="2" fill="#8B4513" />
      <rect x="58" y="33" width="5" height="12" rx="2" fill="#8B4513" transform="rotate(10,60,39)" />
      {/* Eyes - excited */}
      <ellipse cx="44" cy="60" rx="6" ry="7" fill="white" />
      <ellipse cx="60" cy="60" rx="6" ry="7" fill="white" />
      <circle cx="45" cy="61" r="3.5" fill="#1a1a1a" />
      <circle cx="61" cy="61" r="3.5" fill="#1a1a1a" />
      <circle cx="46" cy="60" r="1" fill="white" />
      <circle cx="62" cy="60" r="1" fill="white" />
      {/* Grin */}
      <path d="M40 72 Q52 82 64 72" stroke="#c0392b" strokeWidth="2" fill="white" />
    </svg>
  )
}

function WilkoIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Body */}
      <ellipse cx="50" cy="96" rx="26" ry="18" fill="#1565c0" />
      {/* Neck */}
      <rect x="44" y="73" width="12" height="13" rx="3" fill="#a0785a" />
      {/* Head */}
      <ellipse cx="50" cy="62" rx="24" ry="25" fill="#a0785a" />
      {/* Short dark hair */}
      <ellipse cx="50" cy="42" rx="22" ry="12" fill="#2c1a0e" />
      {/* Serious eyes */}
      <ellipse cx="42" cy="62" rx="6" ry="5.5" fill="white" />
      <ellipse cx="58" cy="62" rx="6" ry="5.5" fill="white" />
      <circle cx="43" cy="62" r="3" fill="#1a1a1a" />
      <circle cx="59" cy="62" r="3" fill="#1a1a1a" />
      {/* Neutral expression */}
      <line x1="41" y1="75" x2="59" y2="75" stroke="#7a5c3e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FreddieIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Body */}
      <ellipse cx="50" cy="97" rx="25" ry="17" fill="#7b1fa2" />
      {/* Neck */}
      <rect x="44" y="73" width="12" height="14" rx="3" fill="#f4c2a1" />
      {/* Head */}
      <ellipse cx="50" cy="61" rx="23" ry="25" fill="#f4c2a1" />
      {/* Wavy hair */}
      <path d="M27 50 Q30 35 50 36 Q70 35 73 50" fill="#d4a017" stroke="#d4a017" strokeWidth="1" />
      <path d="M27 50 Q25 42 30 38" fill="#d4a017" />
      {/* Friendly eyes */}
      <ellipse cx="42" cy="61" rx="6" ry="6.5" fill="white" />
      <ellipse cx="58" cy="61" rx="6" ry="6.5" fill="white" />
      <circle cx="43" cy="62" r="3.5" fill="#3d2b1f" />
      <circle cx="59" cy="62" r="3.5" fill="#3d2b1f" />
      {/* Smile */}
      <path d="M40 73 Q50 81 60 73" stroke="#c0795a" strokeWidth="2" fill="none" />
    </svg>
  )
}

function MarcoIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Body */}
      <ellipse cx="50" cy="96" rx="25" ry="18" fill="#00838f" />
      {/* Neck */}
      <rect x="44" y="73" width="12" height="13" rx="3" fill="#e8b89a" />
      {/* Head */}
      <ellipse cx="50" cy="62" rx="23" ry="25" fill="#e8b89a" />
      {/* Neat hair */}
      <path d="M28 52 Q30 36 50 35 Q70 36 72 52" fill="#4a3000" />
      {/* Calm eyes */}
      <ellipse cx="42" cy="62" rx="5.5" ry="5" fill="white" />
      <ellipse cx="58" cy="62" rx="5.5" ry="5" fill="white" />
      <circle cx="43" cy="62" r="3" fill="#2c1a0e" />
      <circle cx="59" cy="62" r="3" fill="#2c1a0e" />
      {/* Calm smile */}
      <path d="M41 74 Q50 79 59 74" stroke="#b07c5e" strokeWidth="2" fill="none" />
    </svg>
  )
}

function AaronIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Goalkeeper gloves suggestion */}
      <ellipse cx="50" cy="96" rx="26" ry="18" fill="#1a1a2e" />
      {/* Gloves */}
      <ellipse cx="22" cy="90" rx="10" ry="7" fill="#333" />
      <ellipse cx="78" cy="90" rx="10" ry="7" fill="#333" />
      {/* Neck */}
      <rect x="44" y="72" width="12" height="14" rx="3" fill="#f5deb3" />
      {/* Head */}
      <ellipse cx="50" cy="61" rx="23" ry="25" fill="#f5deb3" />
      {/* Spiky blonde hair */}
      <path d="M28 50 Q32 32 50 30 Q68 32 72 50" fill="#f4d03f" />
      <rect x="36" y="26" width="6" height="16" rx="3" fill="#f4d03f" transform="rotate(-15,39,34)" />
      <rect x="47" y="24" width="6" height="18" rx="3" fill="#f4d03f" />
      <rect x="58" y="26" width="6" height="16" rx="3" fill="#f4d03f" transform="rotate(15,61,34)" />
      {/* Eyes - confident */}
      <ellipse cx="42" cy="62" rx="6" ry="6" fill="white" />
      <ellipse cx="58" cy="62" rx="6" ry="6" fill="white" />
      <circle cx="43" cy="62" r="3.5" fill="#3d2b1f" />
      <circle cx="59" cy="62" r="3.5" fill="#3d2b1f" />
      <circle cx="44" cy="61" r="1" fill="white" />
      <circle cx="60" cy="61" r="1" fill="white" />
      {/* Confident smile */}
      <path d="M41 74 Q50 80 59 74" stroke="#c0a080" strokeWidth="2" fill="none" />
    </svg>
  )
}

function TitanIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      {/* Bulky body */}
      <ellipse cx="50" cy="95" rx="30" ry="20" fill="#212121" />
      {/* Neck - thick */}
      <rect x="42" y="72" width="16" height="15" rx="4" fill="#8d5524" />
      {/* Head - square jaw */}
      <rect x="26" y="38" width="48" height="45" rx="15" fill="#8d5524" />
      {/* Short military hair */}
      <rect x="27" y="38" width="46" height="12" rx="8" fill="#3d2b1f" />
      {/* Strong eyes */}
      <ellipse cx="41" cy="60" rx="7" ry="5.5" fill="white" />
      <ellipse cx="59" cy="60" rx="7" ry="5.5" fill="white" />
      <circle cx="42" cy="60" r="3.5" fill="#1a1a1a" />
      <circle cx="60" cy="60" r="3.5" fill="#1a1a1a" />
      {/* Jaw line */}
      <path d="M36 76 Q50 84 64 76" stroke="#6d4c41" strokeWidth="2" fill="none" />
      {/* Scar */}
      <line x1="65" y1="55" x2="70" y2="68" stroke="#5d4037" strokeWidth="2" />
    </svg>
  )
}

function DefaultIllustration() {
  return (
    <svg viewBox="0 0 100 120" className="card-svg">
      <circle cx="50" cy="55" r="30" fill="#bdbdbd" />
      <text x="50" y="62" textAnchor="middle" fill="#757575" fontSize="28">?</text>
    </svg>
  )
}
