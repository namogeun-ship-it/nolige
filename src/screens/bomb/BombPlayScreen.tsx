import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
 * 째깍 소리 간격(밀리초).
 * 시계처럼 일정해야 듣기 편하다. 불규칙한 것은 눈에 보이는 심지 쪽이다.
 */
const TICK_MS = 900
const HURRY_TICK_MS = 260

/**
 * 심지가 한 번에 타들어가는 간격(밀리초).
 *
 * 일정하게 타면 몇 번 해 본 아이는 눈으로 재어 터질 때를 짐작한다.
 * 그래서 매번 다음 간격을 새로 뽑는다. 한참 멈춰 있다가 갑자기 훅 타들어가기도 하고,
 * 연달아 빠르게 타기도 한다. 터지는 시각 자체는 판이 시작될 때 이미 정해져 있고
 * 여기서 바뀌는 것은 눈에 보이는 속도뿐이다.
 */
const BURN_PACE = {
  normal: { min: 450, spread: 1800 },
  hurry: { min: 140, spread: 420 },
} as const

function nextBurnGap(hurrying: boolean): number {
  const { min, spread } = hurrying ? BURN_PACE.hurry : BURN_PACE.normal
  return min + Math.random() * spread
}

/**
 * 심지 그림의 좌표계와 모양.
 * 폭탄 꼭대기(왼쪽 아래 끝)에서 오른쪽 위로 휘어 오르는 선이고,
 * 불꽃은 이 선을 따라 오른쪽 끝에서 폭탄 쪽으로 내려온다.
 */
const FUSE_BOX = { w: 150, h: 62 }
const FUSE_PATH = 'M 75 62 C 83 46 96 24 144 11'

export default function BombPlayScreen({ game, onBeginPlaying, onQuit }: Props) {
  const [countdown, setCountdown] = useState(3)
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

  // 심지 위에서 불꽃이 있을 자리를 재려면 선의 전체 길이를 알아야 한다
  const fuseRef = useRef<SVGPathElement>(null)
  const [fuseLength, setFuseLength] = useState(0)
  useLayoutEffect(() => {
    if (fuseRef.current) setFuseLength(fuseRef.current.getTotalLength())
  }, [game.phase])

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

  // 째깍 소리는 시계처럼 일정하게
  useEffect(() => {
    if (game.phase !== 'playing') return
    const id = window.setInterval(playFuseTick, hurrying ? HURRY_TICK_MS : TICK_MS)
    return () => window.clearInterval(id)
  }, [game.phase, game.round, hurrying])

  // 심지는 불규칙하게. 멈춰 있다가 갑자기 훅 타들어간다
  useEffect(() => {
    if (game.phase !== 'playing') return
    let timer = 0
    const burn = () => {
      setShownPercent(targetPercent.current)
      timer = window.setTimeout(burn, nextBurnGap(hurrying))
    }
    timer = window.setTimeout(burn, nextBurnGap(hurrying))
    return () => window.clearTimeout(timer)
  }, [game.phase, game.round, hurrying])

  // 새 판은 심지가 그대로인 상태에서 시작한다
  useEffect(() => setShownPercent(100), [game.round])

  // 문제가 바뀌면 힌트는 처음부터 다시
  useEffect(() => setHintCount(0), [game.topic.label])

  // 답을 한꺼번에 늘어놓으면 그걸 차례로 읽기만 하면 되므로 한 번에 하나씩만 보여 준다.
  // 눌러도 다음 하나로 바뀔 뿐이라 앞의 것은 화면에 남지 않는다.
  // 답을 한 바퀴 다 보여 준 뒤 처음으로 되돌리면, 아이들이 이미 말한 것을 또 말하게 된다.
  // 그래서 되돌리지 않고 거기서 멈추고 다 썼다고 알린다.
  const answers = game.topic.answers
  const usedAllHints = hintCount >= answers.length
  const shownHint =
    hintCount > 0 && answers.length > 0 ? answers[Math.min(hintCount, answers.length) - 1] : null

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

  // 심지에서 아직 안 탄 부분의 길이. 불꽃은 그 끝에 선다
  const burnAt = fuseLength * (shownPercent / 100)
  const flame = fuseLength > 0 ? fuseRef.current?.getPointAtLength(burnAt) : undefined

  return (
    <div className={`flex h-full flex-col ${hurrying ? 'animate-danger-flash' : ''}`}>
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

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-3 pb-2 sm:px-6 sm:pb-4">
        {/*
          타들어가는 심지. 불꽃이 오른쪽 끝에서 폭탄 쪽으로 내려온다.
          길이는 이번 판의 실제 길이가 아니라 가장 늦게 터질 수 있는 시각 기준이라,
          심지가 아직 남아 보여도 터질 수 있다. 남은 시간을 알려 주는 표시가 아니다.
        */}
        <svg
          viewBox={`0 0 ${FUSE_BOX.w} ${FUSE_BOX.h}`}
          className="w-[min(80vw,34vh)] shrink-0 overflow-visible [@media(min-height:640px)]:w-[min(93vw,50vh)]"
          aria-hidden
        >
          <defs>
            <radialGradient id="flame-glow">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#fb923c" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d={FUSE_PATH}
            fill="none"
            strokeLinecap="round"
            strokeWidth={2.5}
            className="stroke-slate-200"
          />
          <path
            ref={fuseRef}
            d={FUSE_PATH}
            fill="none"
            strokeLinecap="round"
            strokeWidth={4}
            className="stroke-slate-700"
            strokeDasharray={`${burnAt} ${Math.max(1, fuseLength)}`}
            style={{ transition: 'stroke-dasharray 420ms ease-in-out' }}
          />
          {flame && (
            <g
              style={{
                transform: `translate(${flame.x}px, ${flame.y}px)`,
                transition: 'transform 420ms ease-in-out',
              }}
            >
              <circle r={13} fill="url(#flame-glow)" />
              <g className="animate-flame-flicker">
                <text textAnchor="middle" dominantBaseline="central" fontSize={16}>
                  🔥
                </text>
              </g>
            </g>
          )}
        </svg>

        {/*
          폭탄. 흔들지 않고 가만히 둔다.
          움직이는 것은 심지와 소리뿐이라야 안에 적힌 제시어를 읽을 수 있다.
          위쪽 여백을 음수로 줘서 심지 끝이 폭탄 안으로 물리게 한다.
        */}
        <div className="relative -mt-[1.5%] aspect-square w-[min(70vw,30vh)] shrink-0 [@media(min-height:640px)]:w-[min(88vw,44vh)]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-600 via-slate-800 to-slate-950 shadow-2xl shadow-slate-400">
            <span className="absolute top-[15%] left-[17%] h-[13%] w-[24%] -rotate-12 rounded-full bg-white/25 blur-[3px]" />
          </div>
          {/* 제시어가 들어가는 액자. 원 안에 네모를 두면 글자가 어디까지인지 한눈에 들어온다 */}
          <div className="absolute inset-[17%] flex rounded-2xl bg-slate-950/55 p-[5%] shadow-inner ring-2 ring-white/25 ring-inset">
            <ScaledWord
              text={label}
              className="text-white"
              multiline={game.topic.kind === 'topic'}
            />
          </div>
        </div>

        <div className="shrink-0 pt-2">
          <p className="text-center text-lg font-semibold text-slate-500 sm:text-2xl">
            {topicPrompt(game.topic)}
          </p>
          {game.settings.hintsEnabled && answers.length > 0 && (
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
                disabled={usedAllHints}
                onClick={() => setHintCount((c) => Math.min(c + 1, answers.length))}
                className="min-h-[44px] rounded-2xl bg-amber-200 px-5 text-base font-bold whitespace-nowrap text-amber-800 disabled:bg-slate-100 disabled:text-slate-400 active:scale-95 sm:min-h-[56px] sm:px-7 sm:text-xl"
              >
                {usedAllHints ? '힌트가 끝났어요' : hintCount === 0 ? '💡 힌트' : '💡 다른 힌트'}
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
