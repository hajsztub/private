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
  const [src, setSrc] = useState(`/avatars/${id}.png`)
  return (
    <img
      className={`fc-art-img ${className || ''}`}
      src={src}
      alt=""
      onError={() => {
        if (src !== '/avatars/placeholder.png') setSrc('/avatars/placeholder.png')
      }}
      draggable={false}
    />
  )
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
  fieldSize = false,
  canActivateAbility = false,
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
        card.isDestroyed ? 'fc--destroyed' : card.isLocked ? 'fc--locked' : '',
        isNew ? 'fc--new' : '',
        `fc--${rarity}`,
        fieldSize ? 'fc--field' : '',
        upgradeLevel >= 3 ? 'fc--maxed' : '',
        canActivateAbility ? 'fc--can-activate' : '',
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
        {upgradeLevel >= 3 && <div className="fc-maxed-overlay" />}

        {/* Top row: position badge + rating */}
        <div className="fc-top">
          <span className="fc-pos-badge" style={{ background: typeColor }}>{typeLabel}</span>
          <span className="fc-rating">{primaryRating}</span>
        </div>

        {/* Bottom overlay: name + stats */}
        <div className="fc-bottom">
          <div className="fc-name">{card.name}</div>
          <div className="fc-stats-row">
            <span className="fc-mini-stat fc-mini-stat--atk">×{atkVal}</span>
            <span className="fc-mini-stat fc-mini-stat--def">D{defVal}</span>
          </div>
          {goalCount > 0 && (
            <div className="fc-goals">
              ⚽{goalCount > 1 ? <span className="fc-goals-num">{goalCount}</span> : null}
            </div>
          )}
        </div>

        {/* Upgrade pips / max crown */}
        {upgradeLevel >= 3 ? (
          <div className="fc-maxed-crown">✦</div>
        ) : upgradeLevel > 0 ? (
          <div className="fc-pips">
            {Array.from({ length: upgradeLevel }).map((_, i) => (
              <span key={i} className="fc-pip" />
            ))}
          </div>
        ) : null}

        {/* Destroyed / lock / new badges */}
        {card.isDestroyed && <div className="fc-destroyed-overlay" />}
        {card.isDestroyed && <div className="fc-badge fc-badge--destroyed">✕</div>}
        {!card.isDestroyed && card.isLocked && <div className="fc-badge fc-badge--lock">●{card.lockedRounds}r</div>}
        {isNew && <div className="fc-badge fc-badge--new">NEW</div>}
        {canActivateAbility && <div className="fc-ability-dot">▶</div>}
      </div>
    </div>
  )
}

// ── Horizontal GK card ────────────────────────────────────────────────────────

export function GKCard({ card, side, onTap }) {
  const [gkSrc, setGkSrc] = useState(null)
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
      className={`gk-card gk-card--${rarity}`}
      style={{
        '--gk-color': card.color || '#0d2a1a',
        '--rarity-b': RARITY_BORDER[rarity],
        '--rarity-s': RARITY_SHADOW[rarity],
      }}
      onClick={onTap}
    >
      {/* Full-bleed avatar */}
      <div className="gk-art">
        <img
          className="gk-art-img"
          src={gkSrc || `/avatars/${card.id}.png`}
          alt={card.name}
          onError={() => { if (!gkSrc || gkSrc !== '/avatars/placeholder.png') setGkSrc('/avatars/placeholder.png') }}
          draggable={false}
        />
        {rarity === 'legendary' && <div className="fc-legendary-shimmer" />}
      </div>

      {/* Top-left: GK badge */}
      <div className="gk-top">
        <span className="gk-pos-badge">GK</span>
      </div>

      {/* Bottom overlay: name + DEF */}
      <div className="gk-bottom">
        <span className="gk-name">{card.name}</span>
        <span className="gk-def-val">D{defVal}</span>
      </div>
    </div>
  )
}

// ── Generic procedural avatar ─────────────────────────────────────────────────

function idHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

const SKINS  = ['#f4c2a1', '#d4a373', '#c68642', '#a0785a', '#8d5524', '#f5deb3', '#e8b89a']
const HAIRS  = ['short', 'dark', 'bald', 'curly', 'blonde', 'grey', 'afro', 'cap']
const HAIR_C = ['#2c1a0e', '#c0a060', '#8b4513', '#4a3000', '#f4d03f', '#888', '#1a1a1a', '#3d2b1f']

function GenericPlayerSVG({ shirt, seed }) {
  const h = idHash(seed)
  const skin     = SKINS[h % SKINS.length]
  const hairKey  = HAIRS[(h >> 3) % HAIRS.length]
  const hairFill = HAIR_C[(h >> 6) % HAIR_C.length]

  const isBald   = hairKey === 'bald'
  const isAfro   = hairKey === 'afro'
  const isCap    = hairKey === 'cap'
  const isCurly  = hairKey === 'curly'
  const isBlonde = hairKey === 'blonde'

  // eyebrow angle varies
  const browAngle = (h >> 9) % 2 === 0 ? 1 : -1

  return (
    <svg viewBox="0 0 80 90" style={{ width: '100%', height: '100%' }}>
      {/* Body / shirt */}
      <ellipse cx="40" cy="74" rx="22" ry="15" fill={shirt} />
      {/* Neck */}
      <rect x="35" y="56" width="10" height="12" rx="3" fill={skin} />
      {/* Head */}
      <ellipse cx="40" cy="46" rx="20" ry="22" fill={skin} />

      {/* Hair */}
      {!isBald && !isAfro && !isCap && (
        <ellipse cx="40" cy="29" rx="18" ry={isBlonde ? 11 : 10} fill={hairFill} />
      )}
      {isCurly && (
        <>
          <circle cx="27" cy="30" r="8" fill={hairFill} />
          <circle cx="35" cy="24" r="8" fill={hairFill} />
          <circle cx="45" cy="24" r="8" fill={hairFill} />
          <circle cx="53" cy="30" r="8" fill={hairFill} />
        </>
      )}
      {isAfro && (
        <ellipse cx="40" cy="26" rx="22" ry="16" fill={hairFill} />
      )}
      {isCap && (
        <>
          <rect x="20" y="26" width="40" height="10" rx="5" fill={hairFill} />
          <rect x="17" y="32" width="46" height="5" rx="2" fill={hairFill} />
        </>
      )}

      {/* Eyebrows */}
      <line x1="28" y1={38 - browAngle} x2="37" y2={39 + browAngle} stroke={hairFill === '#f4d03f' ? '#a08020' : hairFill} strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1={39 + browAngle} x2="52" y2={38 - browAngle} stroke={hairFill === '#f4d03f' ? '#a08020' : hairFill} strokeWidth="2" strokeLinecap="round" />

      {/* Eyes */}
      <ellipse cx="33" cy="46" rx="5" ry="4.5" fill="white" />
      <ellipse cx="47" cy="46" rx="5" ry="4.5" fill="white" />
      <circle cx="34" cy="46" r="2.5" fill="#1a1a1a" />
      <circle cx="48" cy="46" r="2.5" fill="#1a1a1a" />

      {/* Ears */}
      <ellipse cx="20" cy="46" rx="3.5" ry="5" fill={skin} />
      <ellipse cx="60" cy="46" rx="3.5" ry="5" fill={skin} />

      {/* Mouth — varies: smile, neutral, smirk */}
      {(h >> 12) % 3 === 0
        ? <path d="M32 57 Q40 63 48 57" stroke="#9a6040" strokeWidth="2" fill="none" strokeLinecap="round" />
        : (h >> 12) % 3 === 1
          ? <line x1="33" y1="57" x2="47" y2="57" stroke="#9a6040" strokeWidth="2" strokeLinecap="round" />
          : <path d="M33 56 Q38 60 46 57" stroke="#9a6040" strokeWidth="2" fill="none" strokeLinecap="round" />
      }
    </svg>
  )
}

// ── SVG Fallback Avatars ──────────────────────────────────────────────────────

// Shirt colors matching card type color palette
const TYPE_SHIRT = {
  attack:     '#b71c1c',
  midfield:   '#6a1b9a',
  defense:    '#1565c0',
  goalkeeper: '#00695c',
}

// Card type lookup for generic avatars (used when PNG not available)
const CARD_TYPES = {
  lorenzo:'attack', diego:'attack', max:'midfield', lucas:'goalkeeper',
  samuel:'defense', alejandro:'attack', benjamin:'midfield', oliver:'goalkeeper',
  pierre:'defense', ivan:'attack', finn:'midfield', rafael:'goalkeeper',
  eric:'defense', miquel:'attack', tyler:'midfield', matteo:'goalkeeper',
  jackson:'defense', victor:'midfield', leon:'goalkeeper', fabio:'defense',
  oscar:'attack', liam:'midfield', yusuf:'goalkeeper', niklas:'defense',
  thiago:'attack', jasper:'midfield', nathan:'goalkeeper', kurt:'defense',
  enrique:'attack', dylan:'midfield', gabriel:'goalkeeper', luka:'defense',
  esteban:'attack', felix:'midfield', kyle:'goalkeeper', stefano:'defense',
  rodrigo:'attack', milo:'midfield', tom:'goalkeeper', gerald:'defense',
  juan:'attack', sven:'midfield', kenzo:'goalkeeper', roman:'defense',
  xander:'attack', satoshi:'midfield', carlos:'goalkeeper', cedric:'attack',
  maxim:'midfield', paul:'defense', quentin:'attack', isak:'midfield',
  clery:'defense', ajri:'attack', silas:'midfield', claus:'goalkeeper',
  jim:'goalkeeper', bardo:'attack', harvy:'defense', zenit:'defense',
  grey:'midfield',
  starter_def4:'defense', starter_mid4:'midfield', starter_atk4:'attack',
}

function AvatarSVG({ id, color, className }) {
  const handcrafted = {
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
  const el = handcrafted[id]
  if (el) return <div className={`fc-svg-wrap ${className || ''}`}>{el}</div>

  // Generic procedural avatar for all other players
  const cardType = CARD_TYPES[id]
  const shirt = cardType ? TYPE_SHIRT[cardType] : (color || '#1a3a5c')
  return (
    <div className={`fc-svg-wrap ${className || ''}`}>
      <GenericPlayerSVG shirt={shirt} seed={id} />
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
