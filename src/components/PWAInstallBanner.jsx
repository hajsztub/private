import React, { useState, useEffect, useRef } from 'react'
import './PWAInstallBanner.css'

const STORAGE_KEY = 'pwa_install_dismissed_at'
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function wasDismissedRecently() {
  const ts = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
  return ts && Date.now() - ts < DISMISS_TTL
}

export default function PWAInstallBanner() {
  const [visible, setVisible]         = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const deferredPromptRef             = useRef(null)

  useEffect(() => {
    if (isStandalone() || !isMobile() || wasDismissedRecently()) return

    if (isIOS()) {
      // Safari has no beforeinstallprompt — show after a delay
      const t = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(t)
    }

    // Chrome/Android: wait for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setTimeout(() => setVisible(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    setShowIOSHelp(false)
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }

  const handleInstall = async () => {
    if (isIOS()) { setShowIOSHelp(true); return }
    const prompt = deferredPromptRef.current
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    deferredPromptRef.current = null
  }

  if (!visible) return null

  return (
    <>
      {/* ── Bottom banner ── */}
      <div className="pwa-banner">
        <img src="/pwa-192x192.png" className="pwa-banner-icon" alt="GOAL TCG" />
        <div className="pwa-banner-info">
          <span className="pwa-banner-name">GOAL TCG</span>
          <span className="pwa-banner-sub">Dodaj do ekranu głównego</span>
        </div>
        <button className="pwa-banner-install" onClick={handleInstall}>
          Zainstaluj
        </button>
        <button className="pwa-banner-dismiss" onClick={dismiss} aria-label="Zamknij">✕</button>
      </div>

      {/* ── iOS instruction overlay ── */}
      {showIOSHelp && (
        <div className="pwa-ios-overlay" onClick={() => setShowIOSHelp(false)}>
          <div className="pwa-ios-panel" onClick={e => e.stopPropagation()}>
            <div className="pwa-ios-handle" />
            <div className="pwa-ios-title">Jak zainstalować?</div>
            <div className="pwa-ios-subtitle">Dodaj GOAL TCG do ekranu głównego w 3 krokach</div>

            <div className="pwa-ios-steps">
              <div className="pwa-ios-step">
                <div className="pwa-ios-step-num">1</div>
                <div className="pwa-ios-step-body">
                  <div className="pwa-ios-step-title">Kliknij przycisk Udostępnij</div>
                  <div className="pwa-ios-step-desc">
                    Ikonka <span className="pwa-ios-icon-inline">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2z"/></svg>
                    </span> na dole ekranu Safari
                  </div>
                </div>
              </div>

              <div className="pwa-ios-step">
                <div className="pwa-ios-step-num">2</div>
                <div className="pwa-ios-step-body">
                  <div className="pwa-ios-step-title">Wybierz „Dodaj do ekranu głównego"</div>
                  <div className="pwa-ios-step-desc">Przewiń listę opcji w dół i kliknij tę opcję</div>
                </div>
              </div>

              <div className="pwa-ios-step">
                <div className="pwa-ios-step-num">3</div>
                <div className="pwa-ios-step-body">
                  <div className="pwa-ios-step-title">Kliknij „Dodaj"</div>
                  <div className="pwa-ios-step-desc">Ikona gry pojawi się na Twoim pulpicie</div>
                </div>
              </div>
            </div>

            <button className="pwa-ios-ok" onClick={dismiss}>Rozumiem</button>
          </div>
        </div>
      )}
    </>
  )
}
