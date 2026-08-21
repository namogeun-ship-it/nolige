/**
 * 오디오 파일 없이 Web Audio API로 짧은 소리를 만들어 낸다.
 * 오프라인에서도 소리가 나야 해서 파일을 쓰지 않는다.
 */

let context: AudioContext | null = null
let enabled = true

type AudioContextCtor = typeof AudioContext
function getAudioContextCtor(): AudioContextCtor | null {
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/**
 * 사파리는 사용자가 화면을 만지기 전에는 소리를 못 낸다.
 * 그래서 첫 터치 때 한 번 깨워 둔다.
 */
export function primeSound(): void {
  if (context) {
    if (context.state === 'suspended') void context.resume()
    return
  }
  const Ctor = getAudioContextCtor()
  if (!Ctor) return
  try {
    context = new Ctor()
    if (context.state === 'suspended') void context.resume()
  } catch {
    context = null
  }
}

export function setSoundEnabled(next: boolean): void {
  enabled = next
  if (next) primeSound()
}

/**
 * 폭발음 전용 출력 통로.
 *
 * 큰 소리를 여러 겹 쌓으면 그대로 더해져서 찢어지는 소리가 난다.
 * 압축기를 한 번 거치면 찢어지지 않으면서도 훨씬 크고 묵직하게 들린다.
 * 다른 소리는 이 통로를 쓰지 않는다. 짧은 효과음까지 눌리면 답답해진다.
 */
let boomBus: DynamicsCompressorNode | null = null
function getBoomBus(): AudioNode | null {
  if (!context) return null
  if (boomBus) return boomBus
  try {
    const comp = context.createDynamicsCompressor()
    comp.threshold.setValueAtTime(-20, context.currentTime)
    comp.knee.setValueAtTime(26, context.currentTime)
    comp.ratio.setValueAtTime(14, context.currentTime)
    comp.attack.setValueAtTime(0.002, context.currentTime)
    comp.release.setValueAtTime(0.45, context.currentTime)
    comp.connect(context.destination)
    boomBus = comp
    return comp
  } catch {
    return null
  }
}

interface ToneOptions {
  /** 시작 주파수(Hz) */
  from: number
  /** 끝 주파수(Hz). 생략하면 음이 변하지 않는다 */
  to?: number
  /** 길이(초) */
  duration: number
  /** 소리 크기 (0~1) */
  volume?: number
  /** 시작을 얼마나 미룰지(초) */
  delay?: number
  type?: OscillatorType
  /** 내보낼 곳. 생략하면 스피커로 바로 나간다 */
  out?: AudioNode | null
}

function tone({ from, to, duration, volume = 0.18, delay = 0, type = 'sine', out }: ToneOptions): void {
  if (!enabled || !context) return
  try {
    const startAt = context.currentTime + delay
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, startAt)
    if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(to, startAt + duration)

    // 딸깍 소리가 나지 않게 소리를 부드럽게 올렸다 내린다
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    osc.connect(gain)
    gain.connect(out ?? context.destination)
    osc.start(startAt)
    osc.stop(startAt + duration + 0.02)
  } catch {
    // 소리가 안 나도 게임은 계속돼야 한다
  }
}

interface NoiseOptions {
  /** 길이(초) */
  duration: number
  /** 소리 크기 (0~1) */
  volume?: number
  /** 시작을 얼마나 미룰지(초) */
  delay?: number
  /** 저역 통과 필터를 이 주파수에서 시작해 */
  from?: number
  /** 이 주파수까지 내린다. 높은 소리가 먼저 사라져 멀어지는 느낌이 난다 */
  to?: number
  /** 내보낼 곳. 생략하면 스피커로 바로 나간다 */
  out?: AudioNode | null
}

/**
 * 백색 잡음 한 덩어리.
 *
 * 폭발음은 음정이 있는 소리가 아니라 잡음이다.
 * 오실레이터만으로는 삐 소리에 가까워서, 잡음을 만들어 저역 통과 필터를 쓸어내린다.
 */
function noise({
  duration,
  volume = 0.3,
  delay = 0,
  from = 5000,
  to = 120,
  out,
}: NoiseOptions): void {
  if (!enabled || !context) return
  try {
    const startAt = context.currentTime + delay
    const frames = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, frames, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1

    const source = context.createBufferSource()
    source.buffer = buffer

    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(from, startAt)
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), startAt + duration)

    const gain = context.createGain()
    gain.gain.setValueAtTime(volume, startAt)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(out ?? context.destination)
    source.start(startAt)
    source.stop(startAt + duration + 0.02)
  } catch {
    // 소리가 안 나도 게임은 계속돼야 한다
  }
}

/** 정답: 짧게 올라가는 두 음 */
export function playCorrect(): void {
  tone({ from: 660, to: 990, duration: 0.12, volume: 0.2 })
  tone({ from: 990, to: 1320, duration: 0.14, volume: 0.16, delay: 0.1 })
}

/** 패스: 힘 빠지게 내려가는 한 음 */
export function playPass(): void {
  tone({ from: 420, to: 220, duration: 0.22, volume: 0.16, type: 'triangle' })
}

/** 마지막 10초 초읽기 */
export function playTick(): void {
  tone({ from: 880, duration: 0.06, volume: 0.12, type: 'square' })
}

/** 카운트다운 3-2-1 */
export function playCountdown(): void {
  tone({ from: 520, duration: 0.1, volume: 0.14 })
}

/** 카운트다운이 끝나고 시작할 때 */
export function playStart(): void {
  tone({ from: 660, to: 880, duration: 0.2, volume: 0.2 })
}

/** 시간이 다 됐을 때 */
export function playTimeUp(): void {
  tone({ from: 440, to: 180, duration: 0.55, volume: 0.22, type: 'sawtooth' })
}

/** 라이어 게임: 제시어를 몰래 확인할 때 나는 짧은 소리 */
export function playPeek(): void {
  tone({ from: 780, to: 1040, duration: 0.1, volume: 0.14 })
}

/** 라이어 게임: 정체를 밝히기 직전의 긴장감 */
export function playSuspense(): void {
  tone({ from: 200, to: 150, duration: 0.5, volume: 0.16, type: 'triangle' })
  tone({ from: 300, duration: 0.3, volume: 0.1, delay: 0.4, type: 'triangle' })
}

/** 라이어 게임: 라이어가 잡혔을 때 */
export function playBusted(): void {
  tone({ from: 880, to: 660, duration: 0.14, volume: 0.2 })
  tone({ from: 660, to: 440, duration: 0.3, volume: 0.2, delay: 0.14, type: 'sawtooth' })
}

/** 팀전 우승, 릴레이전 통과 */
export function playFanfare(): void {
  const notes = [523, 659, 784, 1047]
  notes.forEach((hz, i) => tone({ from: hz, duration: 0.18, volume: 0.18, delay: i * 0.13 }))
}

/** 폭탄 돌리기: 심지 타는 째깍 소리. 짧고 마른 소리라 말소리를 가리지 않는다 */
export function playFuseTick(): void {
  tone({ from: 1400, to: 900, duration: 0.035, volume: 0.09, type: 'square' })
}

/**
 * 폭탄 돌리기: 터졌다.
 *
 * 여덟 겹을 한꺼번에 쌓아 올린다. 폭발음은 한 소리가 아니라
 * 파열, 몸통, 저음, 그리고 뒤늦게 돌아오는 잔향이 겹친 것이기 때문이다.
 * 전부 압축기를 거쳐 나가므로 찢어지지 않으면서 크게 들린다.
 */
export function playBoom(): void {
  const out = getBoomBus()

  // 터지는 순간의 날카로운 파열
  noise({ duration: 0.12, volume: 0.5, from: 14000, to: 4000, out })
  // 폭발의 몸통. 높은 소리가 빠르게 사라지며 멀어진다
  noise({ duration: 1.7, volume: 0.8, from: 9000, to: 55, out })
  // 배를 치는 저음
  tone({ from: 210, to: 18, duration: 1.7, volume: 0.5, type: 'sawtooth', out })
  // 그보다 더 아래에서 오래 남는 울림
  tone({ from: 72, to: 13, duration: 2.3, volume: 0.5, type: 'sine', out })
  // 파편이 튀는 금속성
  tone({ from: 1900, to: 40, duration: 0.34, volume: 0.3, type: 'triangle', out })
  // 벽에 부딪혀 돌아오는 잔향 세 겹
  noise({ duration: 1.7, volume: 0.34, delay: 0.18, from: 2400, to: 38, out })
  noise({ duration: 1.5, volume: 0.22, delay: 0.52, from: 950, to: 28, out })
  noise({ duration: 1.3, volume: 0.13, delay: 1.0, from: 420, to: 22, out })
}
