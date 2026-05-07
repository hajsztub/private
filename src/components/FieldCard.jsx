import React, { useRef, useState } from 'react'
import './FieldCard.css'

// ── Avatar: try PNG first, fall back to SVG art ───────────────────────────

function AvatarImage({ id, color }) {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <img
        className="fc-avatar-img"
        src={`/avatars/${id}.png`}
        alt=""
        onError={() => setFailed(true)}
        draggable={false}
      />
    )
  }
  return <AvatarSVG id={id} color={color} />
}

const TYPE_COLOR = {
  attack:     '#b71c1c',
  midfield:   '#6a1b9a',
  defense:    '#0d47a1',
  goalkeeper: '#1b5e20',
  starter:    '#37474f',
}

const RARITY_BORDER = {
  common:    'rgba(255,255,255,0.6)',
  rare:      '#ff9800',
  legendary: '#ffd700',
  starter:   'rgba(255,255,255,0.4)',
}

// ── FieldCard ─────────────────────────────────────────────────────────────
// size: 'hand' | 'field' (same visual size, different context)

export default function FieldCard({
  card,
  selected,
  dimmed,
  faceDown,
  isNew,
  onTap,
  onLongPress,
  draggable,
  onDragStart,
}) {
  const longRef = useRef(null)
  const typeColor = TYPE_COLOR[card.type] || TYPE_COLOR.attack
  const rarityBorder = RARITY_BORDER[card.rarity] || RARITY_BORDER.common
  const isGK = card.type === 'goalkeeper'
  const atkVal = card.currentAttackStat ?? card.attackStat ?? 0
  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0

  const handleTouchStart = (e) => {
    longRef.current = setTimeout(() => {
      longRef.current = null
      onLongPress?.()
    }, 480)
    onDragStart?.(e, card)
  }

  const handleTouchEnd = () => {
    if (longRef.current) {
      clearTimeout(longRef.current)
      longRef.current = null
    }
  }

  if (faceDown) {
    return (
      <div className="fc fc--back" onClick={onTap}>
        <div className="fc-back-inner">
          <div className="fc-back-ball">⚽</div>
          <div className="fc-back-text">FC</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={[
        'fc',
        selected ? 'fc--selected' : '',
        dimmed ? 'fc--dim' : '',
        card.isLocked ? 'fc--locked' : '',
        isNew ? 'fc--new' : '',
        card.rarity === 'legendary' ? 'fc--legendary' : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--type-c': typeColor,
        '--rarity-b': rarityBorder,
        '--card-bg': card.color || '#e8f5e9',
      }}
      onClick={onTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Avatar zone */}
      <div className="fc-art" style={{ background: `linear-gradient(160deg, ${card.color || '#e8f5e9'}, #fff)` }}>
        <AvatarImage id={card.id} color={card.color} />
        <div className="fc-type-pip" style={{ background: typeColor }}>{card.typeLabel}</div>
        {card.rarity === 'legendary' && <div className="fc-legend-glow" />}
        {card.rarity === 'rare' && <div className="fc-rare-shine" />}
      </div>

      {/* Info zone */}
      <div className="fc-body">
        <div className="fc-name">{card.name}</div>
        <div className="fc-stats">
          {isGK ? (
            <span className="fc-stat fc-stat--def">🛡 {defVal}</span>
          ) : (
            <>
              <span className="fc-stat fc-stat--atk">⚔ {atkVal}</span>
              <span className="fc-stat fc-stat--def">🛡 {defVal}</span>
            </>
          )}
        </div>
        <div className="fc-skill">{card.abilityName}</div>
      </div>

      {/* Status badges */}
      {card.isLocked && <div className="fc-status fc-status--lock">🔒 {card.lockedRounds}r</div>}
      {isNew && <div className="fc-status fc-status--new">NEW</div>}
    </div>
  )
}

// ── Horizontal GK card (landscape orientation) ────────────────────────────

export function GKCard({ card, side, onTap }) {
  const [imgFailed, setImgFailed] = useState(false)
  if (!card) return <div className="gk-card gk-card--empty">— brak bramkarza —</div>

  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0

  return (
    <div
      className={`gk-card gk-card--${side}`}
      style={{ '--gk-bg': card.color || '#cfd8dc' }}
      onClick={onTap}
    >
      <div className="gk-avatar-wrap">
        {!imgFailed ? (
          <img
            className="gk-avatar-img"
            src={`/avatars/${card.id}.png`}
            alt={card.name}
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <AvatarSVG id={card.id} color={card.color} className="gk-avatar-svg" />
        )}
      </div>
      <div className="gk-info">
        <span className="gk-type-badge">B</span>
        <span className="gk-name">{card.name}</span>
        <span className="gk-ability">{card.abilityName}</span>
      </div>
      <div className="gk-defense">
        <span className="gk-def-icon">🛡</span>
        <span className="gk-def-val">{defVal}</span>
      </div>
    </div>
  )
}

// ── SVG Fallback Avatars ──────────────────────────────────────────────────

function AvatarSVG({ id, color, className }) {
  const svgs = {
    hugo: <HugoSVG />, harry: <HarrySVG />, rushy: <RushySVG />,
    wilko: <WilkoSVG />, freddie: <FreddieSVG />, marco: <MarcoSVG />,
    aaron: <AaronSVG />, titan: <TitanSVG />,
    starter_gk1: <StarterGKSVG hair="none" />, starter_gk2: <StarterGKSVG hair="short" />,
    starter_def1: <StarterOutfieldSVG shirt="#1565c0" />, starter_def2: <StarterOutfieldSVG shirt="#1565c0" hair="bald" />,
    starter_def3: <StarterOutfieldSVG shirt="#1565c0" hair="dark" />,
    starter_mid1: <StarterOutfieldSVG shirt="#6a1b9a" />, starter_mid2: <StarterOutfieldSVG shirt="#6a1b9a" hair="bald" />,
    starter_mid3: <StarterOutfieldSVG shirt="#6a1b9a" hair="dark" />,
    starter_atk1: <StarterOutfieldSVG shirt="#b71c1c" />, starter_atk2: <StarterOutfieldSVG shirt="#b71c1c" hair="dark" />,
    starter_atk3: <StarterOutfieldSVG shirt="#b71c1c" hair="curly" />,
  }
  const Comp = svgs[id]
  if (Comp) return <div className={`fc-svg-wrap ${className || ''}`}>{Comp}</div>
  return <DefaultSVG color={color} className={className} />
}

// ── SVG Art (from PlayerCard.jsx, adapted) ────────────────────────────────

function HugoSVG() {
  return (
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="40" cy="72" rx="22" ry="16" fill="#4a7c4e" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#c68642" />
      <ellipse cx="40" cy="48" rx="20" ry="22" fill="#c68642" />
      {[24,31,40,49,56].map((cx,i) => <circle key={i} cx={cx} cy={[36,29,27,29,36][i]} r="9" fill="#2c1a0e"/>)}
      <ellipse cx="33" cy="49" rx="5" ry="5.5" fill="white" />
      <ellipse cx="47" cy="49" rx="5" ry="5.5" fill="white" />
      <circle cx="34" cy="50" r="2.5" fill="#2c1a0e" />
      <circle cx="48" cy="50" r="2.5" fill="#2c1a0e" />
      <path d="M31 59 Q40 67 49 59" stroke="#a0522d" strokeWidth="2" fill="white" />
      <circle cx="40" cy="80" r="7" fill="white" stroke="#333" strokeWidth="1" />
    </svg>
  )
}

function HarrySVG() {
  return (
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="40" cy="74" rx="22" ry="15" fill="#5a6268" />
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
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="42" cy="74" rx="20" ry="14" fill="#e65100" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#ffb347" />
      <ellipse cx="42" cy="47" rx="19" ry="21" fill="#ffb347" />
      <ellipse cx="42" cy="30" rx="17" ry="9" fill="#8B4513" />
      <ellipse cx="34" cy="47" rx="5.5" ry="6" fill="white" />
      <ellipse cx="50" cy="47" rx="5.5" ry="6" fill="white" />
      <circle cx="35" cy="48" r="3" fill="#1a1a1a" />
      <circle cx="51" cy="48" r="3" fill="#1a1a1a" />
      <path d="M32 58 Q42 66 52 58" stroke="#c0392b" strokeWidth="2" fill="white" />
    </svg>
  )
}

function WilkoSVG() {
  return (
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
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
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
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
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
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
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="40" cy="74" rx="22" ry="15" fill="#1a1a2e" />
      <rect x="35" y="56" width="10" height="12" rx="3" fill="#f5deb3" />
      <ellipse cx="40" cy="47" rx="20" ry="22" fill="#f5deb3" />
      <path d="M22 38 Q26 24 40 22 Q54 24 58 38" fill="#f4d03f" />
      {[28,37,47].map((x,i) => <rect key={i} x={x} y={[19,17,19][i]} width="5" height={[14,16,14][i]} rx="2.5" fill="#f4d03f" transform={i===0?'rotate(-15,30,26)':i===2?'rotate(15,49,26)':''} />)}
      <ellipse cx="33" cy="47" rx="5.5" ry="5.5" fill="white" />
      <ellipse cx="47" cy="47" rx="5.5" ry="5.5" fill="white" />
      <circle cx="34" cy="47" r="3" fill="#2c1a0e" />
      <circle cx="48" cy="47" r="3" fill="#2c1a0e" />
      <path d="M33 57 Q40 62 47 57" stroke="#c0a080" strokeWidth="2" fill="none" />
    </svg>
  )
}

function TitanSVG() {
  return (
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="40" cy="74" rx="24" ry="16" fill="#212121" />
      <rect x="33" y="56" width="14" height="13" rx="4" fill="#8d5524" />
      <rect x="21" y="30" width="38" height="36" rx="12" fill="#8d5524" />
      <rect x="21" y="30" width="38" height="11" rx="8" fill="#3d2b1f" />
      <ellipse cx="32" cy="48" rx="6" ry="5" fill="white" />
      <ellipse cx="48" cy="48" rx="6" ry="5" fill="white" />
      <circle cx="33" cy="48" r="3" fill="#1a1a1a" />
      <circle cx="49" cy="48" r="3" fill="#1a1a1a" />
      <path d="M30 58 Q40 64 50 58" stroke="#6d4c41" strokeWidth="2" fill="none" />
    </svg>
  )
}

function StarterGKSVG({ hair }) {
  const hairColor = hair === 'short' ? '#c0a060' : '#555'
  return (
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="40" cy="74" rx="22" ry="15" fill="#212121" />
      <rect x="34" y="56" width="12" height="12" rx="3" fill="#e0b090" />
      <ellipse cx="40" cy="46" rx="20" ry="22" fill="#e0b090" />
      {hair !== 'none' && <ellipse cx="40" cy="29" rx="18" ry="10" fill={hairColor} />}
      <ellipse cx="32" cy="46" rx="5" ry="4.5" fill="white" />
      <ellipse cx="48" cy="46" rx="5" ry="4.5" fill="white" />
      <circle cx="33" cy="46" r="2.5" fill="#1a1a1a" />
      <circle cx="49" cy="46" r="2.5" fill="#1a1a1a" />
      <path d="M32 57 Q40 61 48 57" stroke="#c09070" strokeWidth="2" fill="none" />
    </svg>
  )
}

function StarterOutfieldSVG({ shirt, hair }) {
  const skinColor = hair === 'dark' ? '#8d5524' : hair === 'curly' ? '#a0522d' : '#e0b090'
  const hairFill = hair === 'bald' ? 'none' : hair === 'dark' ? '#2c1a0e' : hair === 'curly' ? '#2c1a0e' : '#c0a060'
  return (
    <svg viewBox="0 0 80 90" style={{width:'100%',height:'100%'}}>
      <ellipse cx="40" cy="74" rx="22" ry="15" fill={shirt} />
      <rect x="34" y="56" width="12" height="12" rx="3" fill={skinColor} />
      <ellipse cx="40" cy="46" rx="20" ry="22" fill={skinColor} />
      {hair !== 'bald' && <ellipse cx="40" cy="29" rx="18" ry="10" fill={hairFill} />}
      {hair === 'curly' && <>
        <circle cx="28" cy="29" r="8" fill={hairFill} />
        <circle cx="35" cy="24" r="8" fill={hairFill} />
        <circle cx="45" cy="24" r="8" fill={hairFill} />
        <circle cx="52" cy="29" r="8" fill={hairFill} />
      </>}
      <ellipse cx="32" cy="46" rx="5" ry="4.5" fill="white" />
      <ellipse cx="48" cy="46" rx="5" ry="4.5" fill="white" />
      <circle cx="33" cy="46" r="2.5" fill="#1a1a1a" />
      <circle cx="49" cy="46" r="2.5" fill="#1a1a1a" />
      <path d="M32 57 Q40 61 48 57" stroke="#7a5040" strokeWidth="2" fill="none" />
    </svg>
  )
}

function DefaultSVG({ color, className }) {
  return (
    <div className={`fc-default-avatar ${className || ''}`} style={{ background: color || '#bbb' }}>
      <span>?</span>
    </div>
  )
}
