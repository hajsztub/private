import React from 'react'
import './PlayerCard.css'

const TYPE_COLORS = {
  attack: '#c62828',
  midfield: '#6a1b9a',
  defense: '#1565c0',
  goalkeeper: '#37474f',
  starter: '#546e7a',
}

const TYPE_BG = {
  attack: 'linear-gradient(160deg, #ffebee, #ffcdd2)',
  midfield: 'linear-gradient(160deg, #f3e5f5, #e1bee7)',
  defense: 'linear-gradient(160deg, #e3f2fd, #bbdefb)',
  goalkeeper: 'linear-gradient(160deg, #eceff1, #cfd8dc)',
  starter: 'linear-gradient(160deg, #eceff1, #b0bec5)',
}

// Map card id to illustration component
const ILLUSTRATIONS = {
  hugo: HugoSVG,
  harry: HarrySVG,
  rushy: RushySVG,
  wilko: WilkoSVG,
  freddie: FreddieSVG,
  marco: MarcoSVG,
  aaron: AaronSVG,
  titan: TitanSVG,
}

function getIllustration(cardId) {
  return ILLUSTRATIONS[cardId] || DefaultSVG
}

export default function PlayerCard({
  card,
  onClick,
  selected,
  dimmed,
  showBack,
  size = 'normal', // 'normal' | 'small' | 'mini'
  onActivate,
  canActivate,
  isCurrentPlayer,
  showActivateBtn,
}) {
  if (showBack) {
    return (
      <div className={`pc pc--back pc--${size} ${onClick ? 'pc--clickable' : ''}`} onClick={onClick}>
        <div className="pc-back-inner">
          <span className="pc-back-icon">⚽</span>
          <span className="pc-back-text">FOOTBALL<br/>CARDS</span>
        </div>
      </div>
    )
  }

  const Illus = getIllustration(card.id)
  const typeColor = TYPE_COLORS[card.type] || TYPE_COLORS.attack
  const typeBg = TYPE_BG[card.type] || TYPE_BG.attack
  const isGK = card.type === 'goalkeeper'

  const atkVal = card.currentAttackStat ?? card.attackStat ?? 0
  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0
  const primaryVal = isGK ? defVal : atkVal
  const secondaryVal = isGK ? null : defVal

  const canActivateThis = showActivateBtn && canActivate && isCurrentPlayer
    && !card.isLocked && !card.justPlaced && card.abilityType !== 'passive'

  return (
    <div
      className={[
        'pc',
        `pc--${size}`,
        selected ? 'pc--selected' : '',
        dimmed ? 'pc--dimmed' : '',
        card.isLocked ? 'pc--locked' : '',
        card.justPlaced ? 'pc--new' : '',
        onClick ? 'pc--clickable' : '',
      ].filter(Boolean).join(' ')}
      style={{ background: typeBg }}
      onClick={onClick}
    >
      {/* Type badge */}
      <div className="pc-type" style={{ background: typeColor }}>
        {card.typeLabel}
      </div>

      {/* Illustration */}
      <div className="pc-illus">
        <Illus />
      </div>

      {/* Name */}
      <div className="pc-name">{card.name}</div>

      {/* Ability */}
      <div className="pc-ability">
        <div className="pc-ability-name">{card.abilityName}</div>
        {size !== 'mini' && (
          <div className="pc-ability-text">
            {card.abilityType === 'passive'
              ? <><span className="pc-label pc-label--passive">PASYWNA</span> {card.abilityDescription}</>
              : <><span className="pc-label pc-label--active">AKTYWACJA</span> {card.abilityDescription}</>
            }
          </div>
        )}
        {size !== 'mini' && card.noActivationDescription && card.abilityType !== 'passive' && (
          <div className="pc-ability-text">
            <span className="pc-label pc-label--noa">BRAK AKT.</span> {card.noActivationDescription}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="pc-stats">
        <div className="pc-stat pc-stat--atk">{isGK ? defVal : atkVal}</div>
        <div className="pc-stat-name">{card.name}</div>
        {!isGK && <div className="pc-stat pc-stat--def">{defVal}</div>}
        {isGK && <div className="pc-stat pc-stat--gk-def">{defVal}</div>}
      </div>

      {/* Activate button */}
      {canActivateThis && (
        <button
          className="pc-activate"
          onClick={e => { e.stopPropagation(); onActivate?.(card.instanceId) }}
        >
          {'▶︎'} Aktywuj
        </button>
      )}

      {/* Locked overlay */}
      {card.isLocked && (
        <div className="pc-locked-overlay">● {card.lockedRounds}</div>
      )}
    </div>
  )
}

// ── SVG Illustrations ──────────────────────────────────────────────────────

function HugoSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="72" rx="22" ry="16" fill="#4a7c4e" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#c68642" />
      <ellipse cx="40" cy="48" rx="20" ry="22" fill="#c68642" />
      <circle cx="24" cy="36" r="9" fill="#2c1a0e" />
      <circle cx="31" cy="29" r="9" fill="#2c1a0e" />
      <circle cx="40" cy="27" r="9" fill="#2c1a0e" />
      <circle cx="49" cy="29" r="9" fill="#2c1a0e" />
      <circle cx="56" cy="36" r="9" fill="#2c1a0e" />
      <ellipse cx="33" cy="49" rx="5" ry="5.5" fill="white" />
      <ellipse cx="47" cy="49" rx="5" ry="5.5" fill="white" />
      <circle cx="34" cy="50" r="2.5" fill="#2c1a0e" />
      <circle cx="48" cy="50" r="2.5" fill="#2c1a0e" />
      <path d="M31 59 Q40 67 49 59" stroke="#a0522d" strokeWidth="2" fill="white" />
      <circle cx="40" cy="80" r="7" fill="white" stroke="#333" strokeWidth="1" />
      <path d="M35 77 L40 72 L45 77 L43 83 L37 83 Z" fill="#333" />
    </svg>
  )
}

function HarrySVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="74" rx="22" ry="15" fill="#5a6268" />
      <text x="40" y="78" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">110</text>
      <rect x="35" y="56" width="10" height="13" rx="3" fill="#d4a373" />
      <ellipse cx="40" cy="46" rx="20" ry="22" fill="#d4a373" />
      <path d="M24 37 L35 41" stroke="#8b6347" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M45 41 L56 37" stroke="#8b6347" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="32" cy="46" rx="5.5" ry="4" fill="white" />
      <ellipse cx="48" cy="46" rx="5.5" ry="4" fill="white" />
      <circle cx="33" cy="46" r="2.5" fill="#2c1a0e" />
      <circle cx="49" cy="46" r="2.5" fill="#2c1a0e" />
      <path d="M32 57 Q40 54 48 57" stroke="#8b6347" strokeWidth="2" fill="none" />
      <ellipse cx="20" cy="47" rx="4" ry="5.5" fill="#c4915c" />
      <ellipse cx="60" cy="47" rx="4" ry="5.5" fill="#c4915c" />
    </svg>
  )
}

function RushySVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="42" cy="74" rx="20" ry="14" fill="#e65100" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#ffb347" />
      <ellipse cx="42" cy="47" rx="19" ry="21" fill="#ffb347" />
      <ellipse cx="42" cy="30" rx="17" ry="9" fill="#8B4513" />
      <rect x="30" y="25" width="4" height="10" rx="2" fill="#8B4513" transform="rotate(-10,32,30)" />
      <rect x="39" y="22" width="4" height="12" rx="2" fill="#8B4513" />
      <rect x="48" y="25" width="4" height="10" rx="2" fill="#8B4513" transform="rotate(10,50,30)" />
      <ellipse cx="34" cy="47" rx="5.5" ry="6" fill="white" />
      <ellipse cx="50" cy="47" rx="5.5" ry="6" fill="white" />
      <circle cx="35" cy="48" r="3" fill="#1a1a1a" />
      <circle cx="51" cy="48" r="3" fill="#1a1a1a" />
      <circle cx="36" cy="47" r="1" fill="white" />
      <circle cx="52" cy="47" r="1" fill="white" />
      <path d="M32 58 Q42 66 52 58" stroke="#c0392b" strokeWidth="2" fill="white" />
    </svg>
  )
}

function WilkoSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="74" rx="22" ry="15" fill="#1565c0" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#a0785a" />
      <ellipse cx="40" cy="47" rx="20" ry="22" fill="#a0785a" />
      <ellipse cx="40" cy="30" rx="19" ry="10" fill="#2c1a0e" />
      <ellipse cx="33" cy="47" rx="5" ry="5" fill="white" />
      <ellipse cx="47" cy="47" rx="5" ry="5" fill="white" />
      <circle cx="34" cy="47" r="2.5" fill="#1a1a1a" />
      <circle cx="48" cy="47" r="2.5" fill="#1a1a1a" />
      <line x1="33" y1="57" x2="47" y2="57" stroke="#7a5c3e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FreddieSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="74" rx="21" ry="14" fill="#7b1fa2" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#f4c2a1" />
      <ellipse cx="40" cy="47" rx="20" ry="22" fill="#f4c2a1" />
      <path d="M21 40 Q25 26 40 28 Q55 26 59 40" fill="#d4a017" />
      <ellipse cx="33" cy="47" rx="5.5" ry="6" fill="white" />
      <ellipse cx="47" cy="47" rx="5.5" ry="6" fill="white" />
      <circle cx="34" cy="48" r="3" fill="#2c1a0e" />
      <circle cx="48" cy="48" r="3" fill="#2c1a0e" />
      <path d="M31 58 Q40 64 49 58" stroke="#c0795a" strokeWidth="2" fill="none" />
    </svg>
  )
}

function MarcoSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="74" rx="21" ry="14" fill="#00838f" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#e8b89a" />
      <ellipse cx="40" cy="47" rx="20" ry="22" fill="#e8b89a" />
      <path d="M22 40 Q25 27 40 27 Q55 27 58 40" fill="#4a3000" />
      <ellipse cx="33" cy="47" rx="5" ry="5" fill="white" />
      <ellipse cx="47" cy="47" rx="5" ry="5" fill="white" />
      <circle cx="34" cy="47" r="2.5" fill="#2c1a0e" />
      <circle cx="48" cy="47" r="2.5" fill="#2c1a0e" />
      <path d="M33 57 Q40 62 47 57" stroke="#b07c5e" strokeWidth="2" fill="none" />
    </svg>
  )
}

function AaronSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="74" rx="22" ry="15" fill="#1a1a2e" />
      <ellipse cx="16" cy="70" rx="9" ry="6" fill="#333" />
      <ellipse cx="64" cy="70" rx="9" ry="6" fill="#333" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#f5deb3" />
      <ellipse cx="40" cy="47" rx="20" ry="22" fill="#f5deb3" />
      <path d="M22 38 Q26 24 40 22 Q54 24 58 38" fill="#f4d03f" />
      <rect x="28" y="19" width="5" height="14" rx="2.5" fill="#f4d03f" transform="rotate(-15,30,26)" />
      <rect x="37" y="17" width="5" height="16" rx="2.5" fill="#f4d03f" />
      <rect x="47" y="19" width="5" height="14" rx="2.5" fill="#f4d03f" transform="rotate(15,49,26)" />
      <ellipse cx="33" cy="47" rx="5.5" ry="5.5" fill="white" />
      <ellipse cx="47" cy="47" rx="5.5" ry="5.5" fill="white" />
      <circle cx="34" cy="47" r="3" fill="#2c1a0e" />
      <circle cx="48" cy="47" r="3" fill="#2c1a0e" />
      <circle cx="35" cy="46" r="1" fill="white" />
      <circle cx="49" cy="46" r="1" fill="white" />
      <path d="M33 57 Q40 62 47 57" stroke="#c0a080" strokeWidth="2" fill="none" />
    </svg>
  )
}

function TitanSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <ellipse cx="40" cy="74" rx="24" ry="16" fill="#212121" />
      <rect x="33" y="56" width="14" height="13" rx="4" fill="#8d5524" />
      <rect x="21" y="30" width="38" height="36" rx="12" fill="#8d5524" />
      <rect x="21" y="30" width="38" height="11" rx="8" fill="#3d2b1f" />
      <ellipse cx="32" cy="48" rx="6" ry="5" fill="white" />
      <ellipse cx="48" cy="48" rx="6" ry="5" fill="white" />
      <circle cx="33" cy="48" r="3" fill="#1a1a1a" />
      <circle cx="49" cy="48" r="3" fill="#1a1a1a" />
      <path d="M30 58 Q40 64 50 58" stroke="#6d4c41" strokeWidth="2" fill="none" />
      <line x1="52" y1="42" x2="56" y2="54" stroke="#5d4037" strokeWidth="1.5" />
    </svg>
  )
}

function DefaultSVG() {
  return (
    <svg viewBox="0 0 80 90" className="pc-svg">
      <circle cx="40" cy="45" r="25" fill="#bdbdbd" />
      <text x="40" y="53" textAnchor="middle" fill="#757575" fontSize="24">?</text>
    </svg>
  )
}
