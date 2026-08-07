import { useState } from 'react'
import type { GameState } from '../types'
import { countCorrect, countPass, performerNames, totalTurns } from '../lib/score'
import ConfirmDialog from '../components/ConfirmDialog'

interface Props {
  game: GameState
  onToggleEntry: (turnIndex: number, entryIndex: number) => void
  onNext: () => void
  onQuit: () => void
}

export default function RoundResultScreen({ game, onToggleEntry, onNext, onQuit }: Props) {
  const [askQuit, setAskQuit] = useState(false)
  const turn = game.turns[game.turnIndex]
  const names = performerNames(game)
  const performer = names[turn?.performerIndex ?? 0] ?? '설명자'
  const correct = turn ? countCorrect(turn) : 0
  const passed = turn ? countPass(turn) : 0
  const isLastTurn = game.turnIndex + 1 >= totalTurns(game)
  const nextLabel = isLastTurn ? '최종 결과 보기 →' : '다음 팀 →'

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-8 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-400">{game.turnIndex + 1}번째 차례 끝</p>
            <h1 className="mt-1 text-4xl font-extrabold text-slate-800">{performer}</h1>
          </div>
          <button
            type="button"
            onClick={() => setAskQuit(true)}
            className="min-h-[60px] shrink-0 rounded-2xl bg-white px-6 text-base font-semibold text-slate-500 shadow-sm active:scale-95"
          >
            나가기
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-2xl bg-green-100 px-6 py-3 text-2xl font-extrabold text-green-700">
            맞힘 {correct}
          </span>
          <span className="rounded-2xl bg-slate-200 px-6 py-3 text-2xl font-extrabold text-slate-600">
            패스 {passed}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8">
        {turn && turn.entries.length > 0 ? (
          <>
            <p className="mb-3 text-base text-slate-400">
              잘못 눌렀다면 제시어를 눌러서 맞힘과 패스를 바꿀 수 있어요.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {turn.entries.map((entry, i) => {
                const isCorrect = entry.result === 'correct'
                return (
                  <li key={`${entry.wordId}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onToggleEntry(game.turnIndex, i)}
                      className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl px-5 py-3 text-left active:scale-[0.98] ${
                        isCorrect ? 'bg-green-100' : 'bg-slate-200'
                      }`}
                    >
                      <span className="text-3xl">{isCorrect ? '✅' : '⏭️'}</span>
                      <span
                        className={`min-w-0 flex-1 truncate text-2xl font-bold ${
                          isCorrect ? 'text-green-800' : 'text-slate-500 line-through'
                        }`}
                      >
                        {entry.text}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-3xl font-bold text-slate-400">이번 차례에는 나온 제시어가 없어요</p>
            <p className="text-lg text-slate-400">다음 차례에 힘내 봐요.</p>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-8 py-4">
        <button
          type="button"
          onClick={onNext}
          className="min-h-[84px] rounded-2xl bg-orange-500 px-12 text-2xl font-extrabold text-white shadow-lg shadow-orange-200 active:scale-95"
        >
          {nextLabel}
        </button>
      </footer>

      {askQuit && (
        <ConfirmDialog
          title="게임을 그만할까요?"
          message="지금까지의 점수는 사라져요."
          confirmLabel="그만하기"
          onConfirm={onQuit}
          onCancel={() => setAskQuit(false)}
        />
      )}
    </div>
  )
}
