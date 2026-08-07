import { useEffect } from 'react'
import type { GameState } from '../types'
import { playFanfare, playTimeUp } from '../lib/sound'
import {
  formatDuration,
  performerNames,
  quotaLeft,
  relayCleared,
  relayCorrectTotal,
  relayGoal,
  relayPassTotal,
  standings,
} from '../lib/score'

interface Props {
  game: GameState
  onToggleEntry: (turnIndex: number, entryIndex: number) => void
  onPlayAgain: () => void
  onGoHome: () => void
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function FinalResultScreen({ game, onToggleEntry, onPlayAgain, onGoHome }: Props) {
  // 화면에 들어올 때 한 번만 울린다
  const succeeded = game.settings.mode === 'team' || relayCleared(game)
  useEffect(() => {
    if (succeeded) playFanfare()
    else playTimeUp()
    // 결과가 정정돼도 소리를 다시 내지는 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return game.settings.mode === 'relay' ? (
    <RelayResult game={game} onToggleEntry={onToggleEntry} onPlayAgain={onPlayAgain} onGoHome={onGoHome} />
  ) : (
    <TeamResult game={game} onPlayAgain={onPlayAgain} onGoHome={onGoHome} />
  )
}

function Footer({ onPlayAgain, onGoHome }: { onPlayAgain: () => void; onGoHome: () => void }) {
  return (
    <footer className="flex shrink-0 justify-center gap-4 border-t border-slate-200 bg-white px-8 py-4">
      <button
        type="button"
        onClick={onGoHome}
        className="min-h-[76px] rounded-2xl bg-slate-100 px-10 text-xl font-bold text-slate-600 active:scale-95"
      >
        🏠 홈으로
      </button>
      <button
        type="button"
        onClick={onPlayAgain}
        className="min-h-[76px] rounded-2xl bg-green-500 px-12 text-2xl font-extrabold text-white shadow-lg shadow-green-200 active:scale-95"
      >
        🔁 다시 하기
      </button>
    </footer>
  )
}

// ─────────────────────────────────────────────
// 팀 대항전: 팀별 점수 순위
// ─────────────────────────────────────────────

function TeamResult({
  game,
  onPlayAgain,
  onGoHome,
}: {
  game: GameState
  onPlayAgain: () => void
  onGoHome: () => void
}) {
  const rows = standings(game)
  const winners = rows.filter((r) => r.rank === 1)

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-8 pt-8 pb-4 text-center">
        <p className="text-6xl">🎉</p>
        <h1 className="mt-2 text-4xl font-extrabold text-orange-600">
          {winners.length > 1
            ? `공동 우승! ${winners.map((w) => w.name).join(', ')}`
            : `${winners[0]?.name ?? ''} 우승!`}
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8">
        <ul className="mx-auto flex max-w-3xl flex-col gap-3">
          {rows.map((row) => {
            const isWinner = row.rank === 1
            return (
              <li
                key={row.index}
                className={`flex items-center gap-5 rounded-3xl px-6 py-5 ${
                  isWinner ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white shadow-sm'
                }`}
              >
                <span className="w-14 shrink-0 text-center text-4xl font-extrabold">
                  {MEDALS[row.rank - 1] ?? row.rank}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-3xl font-extrabold ${
                    isWinner ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {row.name}
                </span>
                <span
                  className={`shrink-0 text-xl font-semibold ${
                    isWinner ? 'text-orange-100' : 'text-slate-400'
                  }`}
                >
                  패스 {row.passed}
                </span>
                <span className="shrink-0 text-4xl font-extrabold tabular-nums">{row.correct}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <Footer onPlayAgain={onPlayAgain} onGoHome={onGoHome} />
    </div>
  )
}

// ─────────────────────────────────────────────
// 릴레이전: 편을 가르지 않고 다 같이 통과했는지만 본다
// ─────────────────────────────────────────────

function RelayResult({
  game,
  onToggleEntry,
  onPlayAgain,
  onGoHome,
}: {
  game: GameState
  onToggleEntry: (turnIndex: number, entryIndex: number) => void
  onPlayAgain: () => void
  onGoHome: () => void
}) {
  const cleared = relayCleared(game)
  const goal = relayGoal(game)
  const done = relayCorrectTotal(game)
  const names = performerNames(game)
  const usedSec = game.settings.timeLimitSec - game.remainingSec

  return (
    <div className="flex h-full flex-col">
      <header
        className={`shrink-0 px-8 pt-6 pb-5 text-center text-white ${
          cleared ? 'bg-sky-500' : 'bg-slate-500'
        }`}
      >
        <p className="text-5xl">{cleared ? '🎉' : '⏰'}</p>
        <h1 className="mt-1 text-4xl font-extrabold">{cleared ? '통과!' : '시간 끝!'}</h1>
        <p className="mt-2 text-xl font-semibold text-white/80">
          {cleared
            ? `${formatDuration(usedSec)} 만에 ${goal}개를 다 맞혔어요`
            : `${goal}개 중 ${done}개를 맞혔어요`}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
        <div className="mx-auto max-w-4xl">
          <ul className="mb-6 flex flex-wrap justify-center gap-3">
            {names.map((name, i) => {
              const left = quotaLeft(game, i)
              const mine = game.settings.mode === 'relay' ? game.settings.wordsPerPlayer - left : 0
              return (
                <li
                  key={i}
                  className={`rounded-2xl px-5 py-3 text-lg font-bold ${
                    left === 0 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {name} {mine}개{left > 0 && ` (${left}개 남음)`}
                </li>
              )
            })}
            <li className="rounded-2xl bg-slate-100 px-5 py-3 text-lg font-bold text-slate-500">
              패스 {relayPassTotal(game)}번
            </li>
          </ul>

          <p className="mb-3 text-base text-slate-400">
            잘못 눌렀다면 제시어를 눌러서 맞힘과 패스를 바꿀 수 있어요.
          </p>
          <div className="flex flex-col gap-5">
            {game.turns.map((turn, turnIndex) =>
              turn.entries.length === 0 ? null : (
                <div key={turnIndex}>
                  <p className="mb-2 text-lg font-bold text-slate-500">
                    {names[turn.performerIndex]}
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {turn.entries.map((entry, entryIndex) => {
                      const isCorrect = entry.result === 'correct'
                      return (
                        <li key={`${entry.wordId}-${entryIndex}`}>
                          <button
                            type="button"
                            onClick={() => onToggleEntry(turnIndex, entryIndex)}
                            className={`flex min-h-[68px] w-full items-center gap-3 rounded-2xl px-5 py-3 text-left active:scale-[0.98] ${
                              isCorrect ? 'bg-green-100' : 'bg-slate-200'
                            }`}
                          >
                            <span className="text-2xl">{isCorrect ? '✅' : '⏭️'}</span>
                            <span
                              className={`min-w-0 flex-1 truncate text-xl font-bold ${
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
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <Footer onPlayAgain={onPlayAgain} onGoHome={onGoHome} />
    </div>
  )
}
