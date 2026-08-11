import type { LiarGameState } from '../../types'
import { countVotes, topVoted } from '../../lib/liar'
import { useEdgeColor } from '../../hooks/useEdgeColor'

interface Props {
  game: LiarGameState
  onAccuse: (targetIndex: number) => void
  onRevote: () => void
}

/** 앱 비밀투표를 개표하는 화면. 표가 갈리면 다시 투표할 수 있다. */
export default function LiarTallyScreen({ game, onAccuse, onRevote }: Props) {
  useEdgeColor('var(--color-violet-50)')
  const rows = countVotes(game).filter((r) => r.votes > 0)
  const top = topVoted(game)
  const tied = top.length > 1
  const names = game.settings.playerNames

  return (
    <div className="flex h-full flex-col bg-violet-50">
      <header className="shrink-0 px-4 py-3 text-center sm:px-6 sm:py-4">
        <h1 className="text-3xl font-extrabold text-violet-700 sm:text-4xl">개표 결과</h1>
        <p className="mt-1 text-base font-semibold text-slate-400 sm:text-lg">
          {tied ? '표가 갈렸어요' : `${top[0] ? names[top[0].index] : ''} 님이 가장 많이 지목됐어요`}
        </p>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-3">
          {rows.map((row) => {
            const isTop = row.votes === (top[0]?.votes ?? 0)
            const voters = game.votes
              .map((target, voter) => (target === row.index ? names[voter] : null))
              .filter((n): n is string => n !== null)
            return (
              <div
                key={row.index}
                className={`rounded-3xl px-5 py-4 shadow-sm ${isTop ? 'bg-violet-500' : 'bg-white'}`}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className={`min-w-0 flex-1 truncate text-2xl font-extrabold sm:text-3xl ${
                      isTop ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {names[row.index]}
                  </span>
                  <span
                    className={`shrink-0 text-2xl font-extrabold tabular-nums sm:text-3xl ${
                      isTop ? 'text-white' : 'text-violet-500'
                    }`}
                  >
                    {row.votes}표
                  </span>
                </div>
                <p
                  className={`mt-1 truncate text-base font-semibold ${
                    isTop ? 'text-violet-100' : 'text-slate-400'
                  }`}
                >
                  {voters.join(', ')}
                </p>
              </div>
            )
          })}
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-white p-4 sm:p-6">
        {tied ? (
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-center text-lg font-semibold text-slate-500">
              한 명을 골라 지목하거나, 이야기를 더 나눈 뒤 다시 투표하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {top.map((t) => (
                <button
                  key={t.index}
                  type="button"
                  onClick={() => onAccuse(t.index)}
                  className="min-h-[76px] min-w-[160px] rounded-3xl bg-violet-500 px-6 text-xl font-extrabold text-white shadow-lg shadow-violet-200 active:scale-95 sm:text-2xl"
                >
                  {names[t.index]} 지목
                </button>
              ))}
              <button
                type="button"
                onClick={onRevote}
                className="min-h-[76px] min-w-[160px] rounded-3xl bg-slate-100 px-6 text-xl font-bold text-slate-600 active:scale-95 sm:text-2xl"
              >
                다시 투표
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-4xl gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onRevote}
              className="min-h-[76px] flex-1 rounded-3xl bg-slate-100 text-xl font-bold text-slate-600 active:scale-95 sm:text-2xl"
            >
              다시 투표
            </button>
            <button
              type="button"
              onClick={() => top[0] && onAccuse(top[0].index)}
              className="min-h-[76px] flex-[2.5] rounded-3xl bg-violet-500 text-2xl font-extrabold text-white shadow-lg shadow-violet-200 active:scale-95 sm:text-3xl"
            >
              {top[0] ? `${names[top[0].index]} 님 지목하기 →` : '지목하기'}
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
