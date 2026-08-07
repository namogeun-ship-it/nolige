import type { GameState } from '../types'
import {
  nextPerformerIndex,
  performerNames,
  quotaLeft,
  relayCorrectTotal,
  relayGoal,
} from '../lib/score'
import { formatDuration } from '../lib/score'

interface Props {
  game: GameState
  onReady: () => void
}

/**
 * 릴레이전에서 다음 사람에게 기기를 넘기는 동안 보여주는 화면.
 * 넘기는 시간까지 재면 억울하니 이 화면에서는 시간이 멈춘다.
 */
export default function HandoffScreen({ game, onReady }: Props) {
  const names = performerNames(game)
  const currentIndex = game.turns[game.turnIndex]?.performerIndex ?? 0
  const nextIndex = nextPerformerIndex(game, currentIndex) ?? currentIndex
  const goal = relayGoal(game)
  const done = relayCorrectTotal(game)

  return (
    <div className="flex h-full flex-col bg-sky-500 text-white">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-8">
        <p className="text-2xl font-bold text-sky-100">기기를 넘겨 주세요</p>
        <p className="text-center text-6xl font-extrabold sm:text-7xl">{names[nextIndex]} 차례!</p>
        <p className="text-center text-2xl font-semibold text-sky-100">
          {game.currentWordId
            ? '앞사람이 넘긴 제시어를 이어서 설명해요'
            : '새 제시어로 시작해요'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="rounded-2xl bg-white/20 px-6 py-3 text-2xl font-bold">
            ⏱ 남은 시간 {formatDuration(game.remainingSec)}
          </span>
          <span className="rounded-2xl bg-white/20 px-6 py-3 text-2xl font-bold">
            ✅ {done} / {goal}
          </span>
        </div>

        <ul className="flex flex-wrap justify-center gap-3">
          {names.map((name, i) => {
            const left = quotaLeft(game, i)
            return (
              <li
                key={i}
                className={`rounded-2xl px-5 py-3 text-lg font-bold ${
                  left === 0
                    ? 'bg-white/25 text-sky-100 line-through'
                    : i === nextIndex
                      ? 'bg-white text-sky-700'
                      : 'bg-white/15 text-white'
                }`}
              >
                {name} {left === 0 ? '완료' : `${left}개 남음`}
              </li>
            )
          })}
        </ul>
      </div>

      <footer className="shrink-0 p-4">
        <button
          type="button"
          onClick={onReady}
          className="min-h-[120px] w-full rounded-3xl bg-white text-4xl font-extrabold text-sky-600 shadow-lg active:scale-95"
        >
          준비됐어요! 시작
        </button>
      </footer>
    </div>
  )
}
