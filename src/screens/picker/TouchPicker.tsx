import { useEffect, useRef, useState } from 'react'
import { playCountdown, playFanfare, playPeek } from '../../lib/sound'
import { pickRandom } from '../../lib/picker'

interface Props {
  /** 몇 명을 뽑을지 */
  pickCount: number
  /** 화면 위쪽 안내 문구를 바꾼다 */
  onGuideChange: (guide: string) => void
}

interface Finger {
  /** 손가락 하나를 구분하는 번호. 브라우저가 붙여 준다 */
  id: number
  x: number
  y: number
}

/** 손가락마다 다른 색을 준다. 열 손가락까지 겹치지 않는다. */
const COLORS = [
  'var(--color-violet-500)',
  'var(--color-orange-500)',
  'var(--color-sky-500)',
  'var(--color-green-500)',
  'var(--color-pink-500)',
  'var(--color-amber-400)',
  'var(--color-teal-400)',
  'var(--color-red-500)',
  'var(--color-indigo-400)',
  'var(--color-lime-400)',
]

/** 손가락이 다 모인 뒤 뽑기까지 세는 횟수 */
const COUNT_FROM = 3

/**
 * 다 같이 화면에 손가락을 올리면 그중에서 뽑아 준다.
 * 뽑은 뒤에는 손을 떼도 결과가 남고, 다시 손가락을 올리면 새로 시작한다.
 */
export default function TouchPicker({ pickCount, onGuideChange }: Props) {
  const [fingers, setFingers] = useState<Finger[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [picked, setPicked] = useState<number[] | null>(null)

  const areaRef = useRef<HTMLDivElement>(null)
  // 뽑는 순간에 최신 손가락 목록이 필요하다
  const fingersRef = useRef(fingers)
  fingersRef.current = fingers
  const pickedRef = useRef(picked)
  pickedRef.current = picked

  // 뽑을 인원보다 손가락이 많아야 뽑는 의미가 있다
  const enough = fingers.length >= 2 && fingers.length > pickCount

  const pointFrom = (e: React.PointerEvent): Finger => {
    const box = areaRef.current?.getBoundingClientRect()
    return {
      id: e.pointerId,
      x: e.clientX - (box?.left ?? 0),
      y: e.clientY - (box?.top ?? 0),
    }
  }

  const handleDown = (e: React.PointerEvent) => {
    // 결과가 떠 있을 때 손가락을 올리면 처음부터 다시 한다
    if (pickedRef.current) {
      setPicked(null)
      setFingers([pointFrom(e)])
      playPeek()
      return
    }
    setFingers((prev) => [...prev.filter((f) => f.id !== e.pointerId), pointFrom(e)])
    playPeek()
  }

  const handleMove = (e: React.PointerEvent) => {
    if (pickedRef.current) return
    setFingers((prev) =>
      prev.some((f) => f.id === e.pointerId)
        ? prev.map((f) => (f.id === e.pointerId ? pointFrom(e) : f))
        : prev,
    )
  }

  const handleUp = (e: React.PointerEvent) => {
    // 뽑은 뒤에는 손을 떼도 결과를 그대로 둔다
    if (pickedRef.current) return
    setFingers((prev) => prev.filter((f) => f.id !== e.pointerId))
  }

  // 손가락이 다 모이면 숫자를 세고, 손가락 수가 바뀌면 처음부터 다시 센다
  useEffect(() => {
    if (picked || !enough) {
      setCountdown(null)
      return
    }
    setCountdown(COUNT_FROM)
    const id = window.setInterval(() => {
      setCountdown((c) => (c === null ? null : c - 1))
    }, 700)
    return () => window.clearInterval(id)
  }, [picked, enough, fingers.length, pickCount])

  // 다 세면 뽑는다
  useEffect(() => {
    if (countdown === null) return
    if (countdown > 0) {
      playCountdown()
      return
    }
    setPicked(pickRandom(fingersRef.current.map((f) => f.id), pickCount))
    playFanfare()
  }, [countdown, pickCount])

  // 지금 무엇을 해야 하는지 위쪽 안내에 알린다
  useEffect(() => {
    onGuideChange(
      picked
        ? '다시 하려면 손가락을 올리세요'
        : fingers.length === 0
          ? '다 같이 화면에 손가락을 올려 주세요'
          : !enough
            ? `손가락이 ${pickCount + 1}개 이상 올라와야 뽑아요`
            : '손을 떼지 말고 그대로 기다리세요',
    )
  }, [picked, fingers.length, enough, pickCount, onGuideChange])

  return (
    <div
      ref={areaRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-0 flex-1 touch-none overflow-hidden select-none"
    >
      {fingers.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-7xl sm:text-9xl">👆</span>
          <p className="text-3xl font-extrabold break-keep text-white sm:text-5xl">
            다 같이 화면에 손가락을 올려 주세요
          </p>
          <p className="text-lg font-semibold break-keep text-slate-400 sm:text-2xl">
            모두 올린 채로 기다리면 그중 {pickCount}명을 뽑아요
          </p>
        </div>
      )}

      {countdown !== null && countdown > 0 && (
        <p
          key={countdown}
          className="animate-count-pop pointer-events-none absolute inset-0 flex items-center justify-center text-[180px] leading-none font-extrabold text-white/15 sm:text-[280px]"
        >
          {countdown}
        </p>
      )}

      {picked && (
        <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-4xl font-extrabold text-white sm:text-6xl">
          {pickCount > 1 ? `${pickCount}명 뽑혔어요` : '술래!'}
        </p>
      )}

      {fingers.map((finger, index) => {
        const isPicked = picked?.includes(finger.id) ?? false
        const dimmed = picked !== null && !isPicked
        return (
          <div
            key={finger.id}
            style={{
              left: finger.x,
              top: finger.y,
              backgroundColor: COLORS[index % COLORS.length],
            }}
            // 손가락이 놓인 자리가 원의 한가운데가 되도록 옮긴다
            className={`pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-extrabold text-white transition-all duration-300 ${
              isPicked
                ? 'size-48 text-4xl ring-8 ring-white sm:size-72 sm:text-6xl'
                : 'size-28 text-3xl sm:size-36 sm:text-4xl'
            } ${dimmed ? 'opacity-20' : 'opacity-95'}`}
          >
            {isPicked ? '술래' : index + 1}
          </div>
        )
      })}
    </div>
  )
}
