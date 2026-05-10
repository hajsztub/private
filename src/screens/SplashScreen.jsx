import React, { useEffect, useState } from 'react'
import './SplashScreen.css'

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    const duration = 2200
    const interval = 30
    const step = (interval / duration) * 100
    const timer = setInterval(() => {
      setProgress(p => {
        const next = p + step
        if (next >= 100) {
          clearInterval(timer)
          setTimeout(onDone, 200)
          return 100
        }
        return next
      })
    }, interval)
    return () => clearInterval(timer)
  }, [onDone])

  return (
    <div className="splash">
      <div className="splash-content">
        {!imgFailed ? (
          <img
            src="/logo.png"
            alt="GOAL TCG"
            className="splash-logo"
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <div className="splash-logo-fallback">
            <span className="splash-ball">⚽</span>
            <div className="splash-text">
              <span className="splash-goal">GOAL</span>
              <span className="splash-tcg">TCG</span>
            </div>
          </div>
        )}

        <div className="splash-bar-wrap">
          <div className="splash-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="splash-loading">Ładowanie…</div>
      </div>
    </div>
  )
}
