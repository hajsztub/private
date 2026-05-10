import React from 'react'
import './GoalkeeperSlot.css'

export default function GoalkeeperSlot({ goalkeeper, playerId }) {
  if (!goalkeeper) {
    return (
      <div className="gk-slot gk-slot--empty">
        <span>BRAMKARZ</span>
      </div>
    )
  }

  return (
    <div className="gk-slot">
      <div className="gk-slot__header">
        <span className="gk-slot__label">BRAMKARZ</span>
        <span className="gk-slot__player-id">{playerId}</span>
      </div>
      <div className="gk-slot__portrait">
        <div className="gk-portrait-bg">
          <GoalkeeperSVG id={goalkeeper.id} />
        </div>
      </div>
      <div className="gk-slot__name-bar">
        <span className="gk-slot__name">{goalkeeper.name}</span>
      </div>
      <div className="gk-slot__ability">
        <span className="gk-ability-name">{goalkeeper.abilityName}</span>
        <p className="gk-ability-desc">
          <span className="gk-ability-label">
            {goalkeeper.abilityType === 'passive' ? 'PASYWNA:' : 'AKTYWACJA:'}
          </span>{' '}
          {goalkeeper.abilityDescription}
        </p>
      </div>
      <div className="gk-slot__defense">
        <span className="gk-defense-value">{goalkeeper.currentDefenseStat ?? goalkeeper.defenseStat}</span>
      </div>
    </div>
  )
}

function GoalkeeperSVG({ id }) {
  if (id === 'aaron') {
    return (
      <svg viewBox="0 0 120 100" style={{ width: '100%', height: '100%' }}>
        <ellipse cx="60" cy="80" rx="35" ry="20" fill="#1a1a2e" />
        <ellipse cx="28" cy="72" rx="12" ry="8" fill="#333" />
        <ellipse cx="92" cy="72" rx="12" ry="8" fill="#333" />
        <rect x="52" y="58" width="16" height="14" rx="4" fill="#f5deb3" />
        <ellipse cx="60" cy="50" rx="28" ry="30" fill="#f5deb3" />
        <path d="M33 40 Q38 22 60 20 Q82 22 87 40" fill="#f4d03f" />
        <rect x="42" y="17" width="8" height="19" rx="4" fill="#f4d03f" transform="rotate(-15,46,26)" />
        <rect x="56" y="14" width="8" height="22" rx="4" fill="#f4d03f" />
        <rect x="70" y="17" width="8" height="19" rx="4" fill="#f4d03f" transform="rotate(15,74,26)" />
        <ellipse cx="50" cy="51" rx="7" ry="7" fill="white" />
        <ellipse cx="70" cy="51" rx="7" ry="7" fill="white" />
        <circle cx="51" cy="51" r="4" fill="#3d2b1f" />
        <circle cx="71" cy="51" r="4" fill="#3d2b1f" />
        <circle cx="52" cy="50" r="1.5" fill="white" />
        <circle cx="72" cy="50" r="1.5" fill="white" />
        <path d="M49 64 Q60 70 71 64" stroke="#c0a080" strokeWidth="2" fill="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 100" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="60" cy="78" rx="35" ry="20" fill="#212121" />
      <rect x="52" y="56" width="16" height="15" rx="5" fill="#8d5524" />
      <rect x="33" y="30" width="54" height="45" rx="18" fill="#8d5524" />
      <rect x="33" y="30" width="54" height="15" rx="10" fill="#3d2b1f" />
      <ellipse cx="50" cy="54" rx="8" ry="6" fill="white" />
      <ellipse cx="70" cy="54" rx="8" ry="6" fill="white" />
      <circle cx="51" cy="54" r="4" fill="#1a1a1a" />
      <circle cx="71" cy="54" r="4" fill="#1a1a1a" />
      <path d="M48 68 Q60 76 72 68" stroke="#6d4c41" strokeWidth="2" fill="none" />
    </svg>
  )
}
