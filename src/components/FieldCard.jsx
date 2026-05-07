import React, { useRef, useState } from 'react'
import './FieldCard.css'

const TYPE_COLOR = {
  attack:     '#e53935',
  midfield:   '#8e24aa',
  defense:    '#1e88e5',
  goalkeeper: '#00897b',
  starter:    '#546e7a',
}

const TYPE_LABEL = {
  attack:     'ATK',
  midfield:   'MID',
  defense:    'DEF',
  goalkeeper: 'GK',
  starter:    'STR',
}

const RARITY_BORDER = {
  common:    'rgba(255,255,255,0.28)',
  rare:      '#ff9800',
  legendary: '#ffd700',
  starter:   'rgba(255,255,255,0.18)',
}

const RARITY_SHADOW = {
  common:    'none',
  rare:      '0 0 10px rgba(255,152,0,0.6), 0 4px 14px rgba(0,0,0,0.5)',
  legendary: '0 0 20px rgba(255,215,0,0.75), 0 4px 16px rgba(0,0,0,0.5)',
  starter:   '0 4px 12px rgba(0,0,0,0.4)',
}

function getPrimaryRating(card) {
  const atk = card.currentAttackStat ?? card.attackStat ?? 0
  const def = card.currentDefenseStat ?? card.defenseStat ?? 0
  if (card.type === 'goalkeeper' || card.type === 'defense') return def
  if (card.type === 'attack') return atk
  return Math.max(atk, def)
}

function AvatarArt({ id, color, className }) {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <img
        className={`fc-art-img ${className || ''}`}
        src={`/avatars/${id}.png`}
        alt=""
        onError={() => setFailed(true)}
        draggable={false}
      />
    )
  }
  return <AvatarSVG id={id} color={color} className={className} />
}

// ── FieldCard (vertical, full-bleed) ─────────────────────────────────────────

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
  goalCount = 0,
}) {
  const longRef = useRef(null)
  const typeColor = TYPE_COLOR[card.type] || TYPE_COLOR.attack
  const typeLabel = TYPE_LABEL[card.type] || 'ATK'
  const rarity = card.rarity || 'common'
  const rarityBorder = RARITY_BORDER[rarity]
  const rarityShadow = RARITY_SHADOW[rarity]
  const primaryRating = getPrimaryRating(card)
  const atkVal = card.currentAttackStat ?? card.attackStat ?? 0
  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0
  const upgradeLevel = card.upgradeLevel || 0

  const handleTouchStart = (e) => {
    longRef.current = setTimeout(() => {
      longRef.current = null
      onLongPress?.()
    }, 480)
    onDragStart?.(e, card)
  }
  const handleTouchEnd = () => {
    if (longRef.current) { clearTimeout(longRef.current); longRef.current = null }
  }

  if (faceDown) {
    return (
      <div className="fc fc--back" onClick={onTap}>
        <div className="fc-back-pattern" />
        <div className="fc-back-logo">
          <span className="fc-back-ball">⚽</span>
          <span className="fc-back-label">GOAL</span>
          <span className="fc-back-sub">TCG</span>
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
        `fc--${rarity}`,
      ].filter(Boolean).join(' ')}
      style={{
        '--type-c': typeColor,
        '--rarity-b': rarityBorder,
        '--rarity-s': rarityShadow,
        '--card-color': card.color || '#1a2a1a',
      }}
      onClick={onTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Full-bleed art */}
      <div className="fc-art">
        <AvatarArt id={card.id} color={card.color} />
        {rarity === 'legendary' && <div className="fc-legendary-shimmer" />}
        {rarity === 'rare' && <div className="fc-rare-shine" />}

        {/* Top row: position badge + rating */}
        <div className="fc-top">
          <span className="fc-pos-badge" style={{ background: typeColor }}>{typeLabel}</span>
          <span className="fc-rating">{primaryRating}</span>
        </div>

        {/* Bottom overlay: name + stats */}
        <div className="fc-bottom">
          <div className="fc-name">{card.name}</div>
          <div className="fc-stats-row">
            <span className="fc-mini-stat fc-mini-stat--atk">⚔{atkVal}</span>
            <span className="fc-mini-stat fc-mini-stat--def">🛡{defVal}</span>
          </div>
          {goalCount > 0 && (
            <div className="fc-goals">
              ⚽{goalCount > 1 ? <span className="fc-goals-num">{goalCount}</span> : null}
            </div>
          )}
        </div>

        {/* Upgrade pips */}
        {upgradeLevel > 0 && (
          <div className="fc-pips">
            {Array.from({ length: upgradeLevel }).map((_, i) => (
              <span key={i} className="fc-pip" />
            ))}
          </div>
        )}

        {/* Lock / new badges */}
        {card.isLocked && <div className="fc-badge fc-badge--lock">🔒{card.lockedRounds}r</div>}
        {isNew && <div className="fc-badge fc-badge--new">NEW</div>}
      </div>
    </div>
  )
}

// ── Horizontal GK card ────────────────────────────────────────────────────────

export function GKCard({ card, side, onTap }) {
  const [imgFailed, setImgFailed] = useState(false)
  if (!card) {
    return (
      <div className="gk-card gk-card--empty">
        <span>— brak bramkarza —</span>
      </div>
    )
  }

  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0
  const rarity = card.rarity || 'common'

  return (
    <div
      className={`gk-card gk-card--${side} gk-card--${rarity}`}
      style={{
        '--gk-color': card.color || '#0d2a1a',
        '--rarity-b': RARITY_BORDER[rarity],
        '--rarity-s': RARITY_SHADOW[rarity],
      }}
      onClick={onTap}
    >
      <div className="gk-art">
        {!imgFailed ? (
          <img
            className="gk-art-img"
            src={`/avatars/${card.id}.png`}
            alt={card.name}
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <AvatarSVG id={card.id} color={card.color} className="gk-art-svg" />
        )}
      </div>
      <div className="gk-info">
        <span className="gk-pos-badge">GK</span>
        <span className="gk-name">{card.name}</span>
        {card.abilityName && <span className="gk-ability">{card.abilityName}</span>}
      </div>
      <div className="gk-def-block">
        <span className="gk-def-label">DEF</span>
        <span className="gk-def-val">{defVal}</span>
      </div>
    </div>
  )
}

// ── SVG Fallback Avatars ──────────────────────────────────────────────────────

function AvatarSVG({ id, color, className }) {
  const map = {
    hugo:        <HugoSVG />,
    harry:       <HarrySVG />,
    rushy:       <RushySVG />,
    wilko:       <WilkoSVG />,
    freddie:     <FreddieSVG />,
    marco:       <MarcoSVG />,
    aaron:       <AaronSVG />,
    titan:       <TitanSVG />,
    starter_gk1: <StarterGKSVG hair="none" />,
    starter_gk2: <StarterGKSVG hair="short" />,
    starter_def1: <StarterOutfieldSVG shirt="#1565c0" />,
    starter_def2: <StarterOutfieldSVG shirt="#1565c0" hair="bald" />,
    starter_def3: <StarterOutfieldSVG shirt="#1565c0" hair="dark" />,
    starter_mid1: <StarterOutfieldSVG shirt="#6a1b9a" />,
    starter_mid2: <StarterOutfieldSVG shirt="#6a1b9a" hair="bald" />,
    starter_mid3: <StarterOutfieldSVG shirt="#6a1b9a" hair="dark" />,
    starter_atk1: <StarterOutfieldSVG shirt="#b71c1c" />,
    starter_atk2: <StarterOutfieldSVG shirt="#b71c1c" hair="dark" />,
    starter_atk3: <StarterOutfieldSVG shirt="#b71c1c" hair="curly" />,
  }
  const el = map[id]
  if (el) return <div className={`fc-svg-wrap ${className || ''}`}>{el}</div>
  return (
    <div className={`fc-svg-wrap fc-default-avatar ${className || ''}`} style={{ background: color || '#1a2a1a' }}>
      <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.3)' }}>?</span>
    </div>
  )
}

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
