// Web Audio API sound synthesizer — no audio files needed

let ctx = null

function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch {}
  }
  return ctx
}

function resumeCtx() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume()
  return c
}

function playTone(freq, type, duration, volume = 0.15, startDelay = 0) {
  const c = resumeCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = type
  osc.frequency.value = freq
  const t = c.currentTime + startDelay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.start(t)
  osc.stop(t + duration)
}

function playNoise(duration, volume = 0.05, startDelay = 0) {
  const c = resumeCtx()
  if (!c) return
  const bufSize = c.sampleRate * duration
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  const gain = c.createGain()
  src.buffer = buf
  src.connect(gain)
  gain.connect(c.destination)
  const t = c.currentTime + startDelay
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.start(t)
}

export const SFX = {
  cardPlace() {
    playTone(200, 'sine', 0.08, 0.12)
    playNoise(0.05, 0.03)
  },

  goalPlayer() {
    // Rising fanfare + crowd roar
    const fanfare = [523, 659, 784, 1047, 1319]
    fanfare.forEach((f, i) => {
      playTone(f, 'square', 0.18, 0.18, i * 0.07)
      playTone(f * 0.5, 'sine', 0.22, 0.12, i * 0.07)
    })
    playTone(2093, 'sine', 0.25, 0.12, 0.45)
    playNoise(0.8, 0.07, 0.05)
    playNoise(0.6, 0.05, 0.5)
    playNoise(0.5, 0.04, 1.0)
  },

  goalAI() {
    // Sad descending with low thud
    const notes = [440, 350, 280, 220, 165]
    notes.forEach((f, i) => {
      playTone(f, 'sawtooth', 0.22, 0.12, i * 0.09)
    })
    playTone(80, 'sine', 0.3, 0.2, 0.05)
    playNoise(0.4, 0.04, 0.1)
  },

  coinFlip() {
    for (let i = 0; i < 6; i++) {
      playTone(800 + i * 100, 'sine', 0.04, 0.06, i * 0.05)
    }
  },

  coinBall() {
    playTone(880, 'sine', 0.15, 0.15)
    playTone(1100, 'sine', 0.12, 0.1, 0.05)
    playNoise(0.08, 0.03)
  },

  coinGlove() {
    playTone(300, 'sawtooth', 0.15, 0.1)
    playTone(200, 'sine', 0.12, 0.08, 0.06)
  },

  endTurn() {
    playTone(440, 'sine', 0.08, 0.1)
    playTone(550, 'sine', 0.06, 0.08, 0.05)
  },

  activateAbility() {
    playTone(660, 'triangle', 0.12, 0.12)
    playTone(880, 'sine', 0.08, 0.1, 0.04)
  },

  cardSelect() {
    playTone(500, 'sine', 0.04, 0.08)
  },

  error() {
    playTone(180, 'sawtooth', 0.1, 0.08)
    playTone(160, 'sawtooth', 0.08, 0.07, 0.06)
  },

  matchStart() {
    const notes = [392, 494, 587, 784]
    notes.forEach((f, i) => playTone(f, 'sine', 0.2, 0.1, i * 0.1))
  },

  matchEnd() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319]
    notes.forEach((f, i) => playTone(f, 'sine', 0.25, 0.1, i * 0.08))
  },

  substitution() {
    playTone(350, 'sine', 0.1, 0.1)
    playTone(450, 'sine', 0.08, 0.1, 0.06)
    playTone(550, 'sine', 0.06, 0.1, 0.12)
  },

  cardDestroy() {
    // Heavy crunch — low descending tones + burst of noise
    playNoise(0.18, 0.12)
    playTone(180, 'sawtooth', 0.25, 0.18)
    playTone(120, 'sawtooth', 0.3, 0.14, 0.06)
    playTone(80, 'sine', 0.35, 0.1, 0.14)
    playTone(60, 'sine', 0.4, 0.08, 0.22)
  },
}
