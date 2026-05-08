// Background music controller — single shared <audio> element
// Call init() once on app start, then play/pause/setEnabled as needed.

const MUSIC_SRC = '/music_bg.mp3'
const MUSIC_VOLUME = 0.18

let audio = null
let enabled = true

function getAudio() {
  if (!audio) {
    audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.volume = MUSIC_VOLUME
    audio.preload = 'auto'
  }
  return audio
}

export const Music = {
  init(musicEnabled) {
    enabled = musicEnabled
    if (!enabled) return
    const a = getAudio()
    // Autoplay needs a user gesture — attempt here, retry on first interaction
    a.play().catch(() => {
      const resume = () => {
        if (enabled) a.play().catch(() => {})
        window.removeEventListener('pointerdown', resume)
        window.removeEventListener('keydown', resume)
      }
      window.addEventListener('pointerdown', resume, { once: true })
      window.addEventListener('keydown', resume, { once: true })
    })

    // Resume when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!enabled) return
      if (document.visibilityState === 'visible') {
        a.play().catch(() => {})
      } else {
        a.pause()
      }
    })
  },

  setEnabled(val) {
    enabled = val
    const a = getAudio()
    if (enabled) {
      a.play().catch(() => {})
    } else {
      a.pause()
    }
  },
}
