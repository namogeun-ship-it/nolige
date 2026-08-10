import { useEffect } from 'react'
import type { LiarGameState } from '../../types'
import { playBusted, playFanfare } from '../../lib/sound'

interface Props {
  game: LiarGameState
  onPlayAgain: () => void
  onGoHome: () => void
}

/** 제시어와 라이어를 공개하고 승패를 알려주는 화면. */
export default function LiarResultScreen({ game, onPlayAgain, onGoHome }: Props) {
  const names = game.settings.playerNames
  const citizensWin = game.winner === 'citizens'
  const liarName = names[game.liarIndex] ?? '라이어'
  const accusedName = game.accusedIndex !== null ? names[game.accusedIndex] : null

  useEffect(() => {
    if (citizensWin) playFanfare()
    else playBusted()
  }, [citizensWin])

  // 이번 판이 어떻게 끝났는지 한 줄로 설명한다
  const summary = citizensWin
    ? `${liarName} 님을 찾아냈고, 제시어도 지켜 냈어요.`
    : game.liarGuessedRight
      ? `${liarName} 님이 라이어였지만 제시어를 알아맞혔어요.`
      : accusedName
        ? `${accusedName} 님은 시민이었어요. 라이어 ${liarName} 님이 끝까지 숨었어요.`
        : `라이어 ${liarName} 님이 끝까지 숨었어요.`

  return (
    <div className="flex h-full flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
          <div
            className={`w-full rounded-3xl px-6 py-6 shadow-lg ${
              citizensWin ? 'bg-green-500 shadow-green-200' : 'bg-slate-900'
            }`}
          >
            <p className="text-6xl sm:text-7xl">{citizensWin ? '🎉' : '🤥'}</p>
            <p className="mt-2 text-4xl font-extrabold text-white sm:text-6xl">
              {citizensWin ? '시민 승리' : '라이어 승리'}
            </p>
            <p
              className={`mt-2 text-lg font-semibold sm:text-2xl ${
                citizensWin ? 'text-green-100' : 'text-slate-300'
              }`}
            >
              {summary}
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-base font-bold text-slate-400">제시어</p>
              <p className="mt-1 text-4xl font-extrabold break-keep text-slate-800 sm:text-5xl">
                {game.wordText}
              </p>
              <p className="mt-2 text-lg font-semibold text-violet-500">{game.categoryName}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-base font-bold text-slate-400">라이어</p>
              <p className="mt-1 text-4xl font-extrabold break-keep text-red-500 sm:text-5xl">
                {liarName}
              </p>
              {accusedName && (
                <p className="mt-2 text-lg font-semibold text-slate-400">
                  지목된 사람: {accusedName}
                </p>
              )}
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-base font-bold text-slate-400">지금까지 전적</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-700 sm:text-4xl">
              <span className="text-green-600">시민 {game.tally.citizens}</span>
              <span className="mx-3 text-slate-300">:</span>
              <span className="text-red-500">라이어 {game.tally.liar}</span>
            </p>
          </div>
        </div>
      </main>

      <footer className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4 sm:gap-4 sm:p-6">
        <button
          type="button"
          onClick={onGoHome}
          className="min-h-[76px] flex-1 rounded-3xl bg-slate-100 text-xl font-bold text-slate-600 active:scale-95 sm:text-2xl"
        >
          홈으로
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-[76px] flex-[2] rounded-3xl bg-violet-500 text-2xl font-extrabold text-white shadow-lg shadow-violet-200 active:scale-95 sm:text-3xl"
        >
          한 판 더 →
          <span className="mt-1 block text-base font-semibold text-violet-100">
            새 제시어로 라이어도 다시 뽑아요
          </span>
        </button>
      </footer>
    </div>
  )
}
