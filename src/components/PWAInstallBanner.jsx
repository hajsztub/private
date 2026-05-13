import React, { useState, useEffect, useRef } from 'react'
import './PWAInstallBanner.css'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isNativeApp() {
  return window.Capacitor?.isNativePlatform?.() === true
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

function isChromeIOS() {
  return isIOS() && /CriOS/i.test(navigator.userAgent)
}

function isFirefoxIOS() {
  return isIOS() && /FxiOS/i.test(navigator.userAgent)
}

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function getBrowser() {
  if (isChromeIOS()) return 'chrome-ios'
  if (isFirefoxIOS()) return 'firefox-ios'
  if (isIOS()) return 'safari'
  return 'android'
}

const INSTRUCTIONS = {
  'safari': {
    steps: [
      {
        title: 'Kliknij przycisk Udostępnij',
        desc: 'Ikonka',
        icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2z"/></svg>,
        descSuffix: 'na dole ekranu',
      },
      { title: 'Wybierz „Dodaj do ekranu głównego"', desc: 'Przewiń listę opcji w dół i kliknij tę opcję' },
      { title: 'Kliknij „Dodaj"', desc: 'Ikona gry pojawi się na Twoim pulpicie' },
    ],
  },
  'chrome-ios': {
    steps: [
      {
        title: 'Kliknij menu „⋯"',
        desc: 'Trzy kropki',
        icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>,
        descSuffix: 'w prawym dolnym rogu Chrome',
      },
      { title: 'Wybierz „Dodaj do ekranu głównego"', desc: 'Kliknij tę opcję na liście' },
      { title: 'Kliknij „Dodaj"', desc: 'Ikona gry pojawi się na Twoim pulpicie' },
    ],
  },
  'firefox-ios': {
    steps: [
      {
        title: 'Kliknij menu „⋯"',
        desc: 'Trzy kropki',
        icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>,
        descSuffix: 'na dole ekranu',
      },
      { title: 'Wybierz „Dodaj do ekranu głównego"', desc: 'Kliknij tę opcję na liście' },
      { title: 'Kliknij „Dodaj"', desc: 'Ikona gry pojawi się na Twoim pulpicie' },
    ],
  },
}

export default function PWAInstallBanner({ hidden }) {
  const [visible, setVisible]         = useState(false)
  const [dismissed, setDismissed]     = useState(false)
  const [showHelp, setShowHelp]       = useState(false)
  const deferredPromptRef             = useRef(null)
  const browser                       = getBrowser()
  const needsManual                   = browser !== 'android'

  useEffect(() => {
    if (isNativeApp() || isStandalone() || !isMobile()) return

    if (needsManual) {
      const t = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(t)
    }

    const handler = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setTimeout(() => setVisible(true), 1000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [needsManual])

  const dismiss = () => {
    setDismissed(true)
    setShowHelp(false)
  }

  const handleInstall = async () => {
    if (needsManual) { setShowHelp(true); return }
    const prompt = deferredPromptRef.current
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    deferredPromptRef.current = null
  }

  if (!visible || dismissed || hidden) return null

  const instructions = INSTRUCTIONS[browser]

  return (
    <>
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

      {showHelp && instructions && (
        <div className="pwa-ios-overlay" onClick={() => setShowHelp(false)}>
          <div className="pwa-ios-panel" onClick={e => e.stopPropagation()}>
            <div className="pwa-ios-handle" />
            <div className="pwa-ios-title">Jak zainstalować?</div>
            <div className="pwa-ios-subtitle">Dodaj GOAL TCG do ekranu głównego w 3 krokach</div>

            <div className="pwa-ios-steps">
              {instructions.steps.map((step, i) => (
                <div key={i} className="pwa-ios-step">
                  <div className="pwa-ios-step-num">{i + 1}</div>
                  <div className="pwa-ios-step-body">
                    <div className="pwa-ios-step-title">{step.title}</div>
                    <div className="pwa-ios-step-desc">
                      {step.desc}
                      {step.icon && <span className="pwa-ios-icon-inline">{step.icon}</span>}
                      {step.descSuffix && ` ${step.descSuffix}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="pwa-ios-ok" onClick={dismiss}>Rozumiem</button>
          </div>
        </div>
      )}
    </>
  )
}
