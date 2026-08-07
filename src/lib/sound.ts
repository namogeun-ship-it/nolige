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
}

function tone({ from, to, duration, volume = 0.18, delay = 0, type = 'sine' }: ToneOptions): void {
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
    gain.connect(context.destination)
    osc.start(startAt)
    osc.stop(startAt + duration + 0.02)
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

/** 팀전 우승, 릴레이전 통과 */
export function playFanfare(): void {
  const notes = [523, 659, 784, 1047]
  notes.forEach((hz, i) => tone({ from: hz, duration: 0.18, volume: 0.18, delay: i * 0.13 }))
}
