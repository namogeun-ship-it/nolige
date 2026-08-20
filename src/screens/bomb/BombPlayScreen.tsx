import { useEffect, useRef, useState } from 'react'
import type { BombGameState } from '../../types'
import { fuseLeftRatio, isHurrying, spacedChosung, topicPrompt } from '../../lib/bomb'
import ScaledWord from '../../components/ScaledWord'
import ConfirmDialog from '../../components/ConfirmDialog'
import { playCountdown, playFuseTick, playStart } from '../../lib/sound'
import { useEdgeColor } from '../../hooks/useEdgeColor'

interface Props {
  game: BombGameState
  onBeginPlaying: () => void
  onQuit: () => void
}

/**
 * 째깍 소리와 심지가 움직이는 간격(밀리초).
 *
 * 일정한 박자로 타면 몇 번 해 본 아이는 박자를 세어 터질 때를 짐작한다.
 * 그래서 매번 다음 간격을 새로 뽑는다. 한참 멈춰 있다가 갑자기 훅 타들어가기도 하고,
 * 연달아 빠르게 타기도 한다. 터지는 시각 자체는 판이 시작될 때 이미 정해져 있고
 * 여기서 바뀌는 것은 보이고 들리는 박자뿐이다.
 */
const PACE = {
  normal: { min: 450, spread: 1500 },
  hurry: { min: 130, spread: 280 },
} as const

function nextGap(hurrying: boolean): number {
  const { min, spread } = hurrying ? PACE.hurry : PACE.normal
  return min + Math.random() * spread
}

/**
 * 폭탄이 도는 동안의 화면.
 * 아이들이 폰을 손에서 손으로 넘기기만 하므로 누를 것을 두지 않는다.
 * 나가기 말고는 아무 단추도 없어서 넘기다 잘못 눌러 판이 끊길 일이 없다.
 */
export default function BombPlayScreen({ game, onBeginPlaying, onQuit }: Props) {
  const [countdown, setCountdown] = useState(3)
  // 지금까지 힌트를 몇 번 눌렀는지. 0이면 아직 아무것도 안 보여 준 상태다
  const [hintCount, setHintCount] = useState(0)
  const [askQuit, setAskQuit] = useState(false)

  const hurrying = isHurrying(game)

  // 화면에 그려지는 심지 길이. 실제 값을 그때그때 따라가지 않고
  // 불규칙한 간격으로 툭툭 따라잡아서, 타는 속도가 일정해 보이지 않게 한다
  const [shownPercent, setShownPercent] = useState(100)
  const targetPercent = useRef(100)
  targetPercent.current = fuseLeftRatio(game) * 100
  const label = game.topic.kind === 'chosung' ? spacedChosung(game.topic.label) : game.topic.label

  // 카운트다운 화면만 배경이 진하다
  useEdgeColor(game.phase === 'countdown' ? 'var(--color-red-500)' : '')

  // 3-2-1 카운트다운
  useEffect(() => {
    if (game.phase !== 'countdown') return
    setCountdown(3)
    const id = window.setInterval(() => setCountdown((c) => c - 1), 800)
    return () => window.clearInterval(id)
  }, [game.phase, game.round])

  useEffect(() => {
    if (game.phase !== 'countdown') return
    if (countdown > 0) playCountdown()
    else {
      playStart()
      onBeginPlaying()
    }
  }, [countdown, game.phase, onBeginPlaying])

  // 심지 타는 소리와 심지 그림을 같은 박자로 움직인다.
  // 박자는 매번 새로 뽑아서 멈췄다 훅 타들어가는 것처럼 보이게 한다.
  useEffect(() => {
    if (game.phase !== 'playing') return
    let timer = 0
    const burn = () => {
      playFuseTick()
      setShownPercent(targetPercent.current)
      timer = window.setTimeout(burn, nextGap(hurrying))
    }
    timer = window.setTimeout(burn, nextGap(hurrying))
    return () => window.clearTimeout(timer)
  }, [game.phase, game.round, hurrying])

  // 새 판은 심지가 그대로인 상태에서 시작한다
  useEffect(() => setShownPercent(100), [game.round])

  // 문제가 바뀌면 힌트는 처음부터 다시
  useEffect(() => setHintCount(0), [game.topic.label])

  // 답을 한꺼번에 늘어놓으면 그걸 차례로 읽기만 하면 되므로 한 번에 하나씩만 보여 준다.
  // 눌러도 다음 하나로 바뀔 뿐이라 앞의 것은 화면에 남지 않는다.
  const answers = game.topic.answers
  const shownHint = hintCount > 0 ? answers[(hintCount - 1) % answers.length] : null

  if (game.phase === 'countdown') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-red-500 text-white">
        <p className="text-3xl font-bold text-red-100">{game.round}판</p>
        <p key={countdown} className="animate-count-pop text-[220px] leading-none font-extrabold">
          {countdown > 0 ? countdown : '💣'}
        </p>
        <p className="text-2xl font-semibold text-red-100">말하고 옆 사람에게 넘기세요</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 overflow-hidden px-3 py-1 sm:gap-4 sm:px-6 [@media(min-height:640px)]:py-3">
        <button
          type="button"
          onClick={() => setAskQuit(true)}
          className="min-h-[52px] shrink-0 rounded-2xl bg-white px-3 text-sm font-semibold whitespace-nowrap text-slate-500 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
        >
          나가기
        </button>

        <p className="min-w-0 flex-1 truncate text-lg font-extrabold text-slate-800 sm:text-2xl">
          {game.round}판
        </p>

        <span className="shrink-0 rounded-2xl bg-red-100 px-3 py-2 text-sm font-bold whitespace-nowrap text-red-700 sm:px-5 sm:py-3 sm:text-base">
          {game.topic.kind === 'chosung' ? '초성' : '주제'}
        </span>
      </header>

      {/*
        타들어가는 심지. 불꽃이 왼쪽 폭탄 쪽으로 다가온다.
        길이는 이번 판의 실제 길이가 아니라 설정에서 고른 가장 긴 시간 기준이라,
        심지가 많이 남아 보여도 터질 수 있다. 남은 시간을 알려 주는 표시가 아니다.
      */}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-2 sm:gap-3 sm:px-6 sm:pb-3">
        <span
          className="animate-bomb-pulse shrink-0 text-3xl sm:text-4xl"
          style={{ animationDuration: hurrying ? '0.4s' : '1s' }}
        >
          💣
        </span>
        <div className="relative h-2.5 flex-1 rounded-full bg-slate-200 sm:h-3">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-slate-700"
            style={{ width: `${shownPercent}%`, transition: 'width 260ms ease-out' }}
          />
          <span
            className={`absolute -top-3 -translate-x-1/2 text-2xl sm:-top-4 sm:text-3xl ${
              hurrying ? 'animate-bomb-pulse' : ''
            }`}
            style={{
              left: `${shownPercent}%`,
              transition: 'left 260ms ease-out',
              animationDuration: '0.35s',
            }}
          >
            🔥
          </span>
        </div>
      </div>

      <main className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-6 sm:pb-5">
        <ScaledWord text={label} />
        <div className="shrink-0">
          <p className="text-center text-lg font-semibold text-slate-500 sm:text-2xl">
            {topicPrompt(game.topic)}
          </p>
          {game.settings.hintsEnabled && game.topic.answers.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-3">
              {shownHint && (
                <span
                  key={shownHint}
                  className="animate-card-in rounded-2xl bg-amber-100 px-5 py-2 text-lg font-bold text-amber-800 sm:px-6 sm:py-3 sm:text-2xl"
                >
                  {shownHint}
                </span>
              )}
              <button
                type="button"
                onClick={() => setHintCount((c) => c + 1)}
                className="min-h-[44px] rounded-2xl bg-amber-200 px-5 text-base font-bold whitespace-nowrap text-amber-800 active:scale-95 sm:min-h-[56px] sm:px-7 sm:text-xl"
              >
                {hintCount === 0 ? '💡 힌트' : '💡 다른 힌트'}
              </button>
            </div>
          )}
        </div>
      </main>

      {askQuit && (
        <ConfirmDialog
          title="게임을 그만할까요?"
          message="돌고 있던 폭탄은 사라져요."
          confirmLabel="그만하기"
          onConfirm={onQuit}
          onCancel={() => setAskQuit(false)}
        />
      )}
    </div>
  )
}
