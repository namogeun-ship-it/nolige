import type { LiarGameState, Resumable, Screen } from '../types'
import { performerNames, totalTurns } from '../lib/score'
import { speechNumber, totalSpeeches } from '../lib/liar'

interface Props {
  navigate: (screen: Screen) => void
  resumable: Resumable | null
  onResume: () => void
  onDiscardResume: () => void
}

/** 라이어 게임이 어디까지 진행됐는지 한 줄로 */
function liarProgress(state: LiarGameState): string {
  switch (state.phase) {
    case 'reveal':
      return `제시어 확인 ${state.revealedCount + 1}/${state.order.length}번째`
    case 'talk':
      return `설명 ${speechNumber(state)}/${totalSpeeches(state)}번째`
    case 'vote':
      return `투표 ${state.voteAt + 1}/${state.order.length}번째`
    case 'tally':
      return '개표 결과'
    case 'guess':
      return '라이어의 마지막 기회'
    default:
      return '판 결과'
  }
}

export default function HomeScreen({ navigate, resumable, onResume, onDiscardResume }: Props) {
  const resumeLabel = !resumable
    ? ''
    : resumable.kind === 'liar'
      ? `라이어 게임 · ${liarProgress(resumable.state)}`
      : (() => {
          const state = resumable.state
          const modeName = state.settings.mode === 'team' ? '팀 대항전' : '릴레이전'
          const names = performerNames(state)
          const performer = names[state.turns[state.turnIndex]?.performerIndex ?? 0] ?? ''
          return `몸으로 말해요 · ${modeName} · ${state.turnIndex + 1}/${totalTurns(state)}번째 차례 (${performer})`
        })()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto p-5 sm:gap-8 sm:p-8">
      <header className="text-center">
        <div className="text-6xl">🎲</div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl">
          놀이게임
        </h1>
        <p className="mt-2 text-lg text-slate-500">오늘은 어떤 게임을 할까요?</p>
      </header>

      {resumable && (
        <div className="flex w-full max-w-3xl flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-slate-700">하던 게임이 남아 있어요</p>
            <p className="truncate text-base text-slate-400">{resumeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onDiscardResume}
            className="min-h-[60px] flex-1 shrink-0 rounded-2xl bg-slate-100 px-6 text-lg font-semibold whitespace-nowrap text-slate-500 active:scale-95 sm:flex-none"
          >
            지우기
          </button>
          <button
            type="button"
            onClick={onResume}
            className="min-h-[60px] flex-[2] shrink-0 rounded-2xl bg-green-500 px-8 text-lg font-bold whitespace-nowrap text-white active:scale-95 sm:flex-none"
          >
            이어서 하기
          </button>
        </div>
      )}

      <main className="flex w-full max-w-3xl flex-col gap-5 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate({ name: 'charades' })}
          className="flex-1 rounded-3xl bg-orange-500 px-8 py-10 text-3xl font-bold text-white shadow-lg shadow-orange-200 active:scale-95"
        >
          🙆 몸으로 말해요
          <span className="mt-2 block text-base font-medium text-orange-100">
            제시어를 몸짓으로 설명해요
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: 'liar-setup' })}
          className="flex-1 rounded-3xl bg-violet-500 px-8 py-10 text-3xl font-bold text-white shadow-lg shadow-violet-200 active:scale-95"
        >
          🤥 라이어 게임
          <span className="mt-2 block text-base font-medium text-violet-100">
            제시어를 모르는 거짓말쟁이를 찾아요
          </span>
        </button>
      </main>

      <footer className="flex gap-4">
        <button
          type="button"
          onClick={() => navigate({ name: 'words' })}
          className="min-h-[60px] rounded-2xl bg-white px-6 py-4 text-lg font-semibold whitespace-nowrap text-slate-700 shadow active:scale-95 sm:px-8 sm:text-xl"
        >
          📚 제시어 관리
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: 'settings' })}
          className="min-h-[60px] rounded-2xl bg-white px-6 py-4 text-lg font-semibold whitespace-nowrap text-slate-700 shadow active:scale-95 sm:px-8 sm:text-xl"
        >
          ⚙️ 설정
        </button>
      </footer>
    </div>
  )
}
