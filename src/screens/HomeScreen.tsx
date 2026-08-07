import type { GameState, Screen } from '../types'
import { performerNames, totalTurns } from '../lib/score'

interface Props {
  navigate: (screen: Screen) => void
  resumable: GameState | null
  onResume: () => void
  onDiscardResume: () => void
}

export default function HomeScreen({ navigate, resumable, onResume, onDiscardResume }: Props) {
  const resumeLabel = resumable
    ? (() => {
        const modeName = resumable.settings.mode === 'team' ? '팀 대항전' : '릴레이전'
        const names = performerNames(resumable)
        const performer = names[resumable.turns[resumable.turnIndex]?.performerIndex ?? 0] ?? ''
        return `${modeName} · ${resumable.turnIndex + 1}/${totalTurns(resumable)}번째 차례 (${performer})`
      })()
    : ''

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      <header className="text-center">
        <div className="text-6xl">🙆</div>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-orange-600">
          몸으로 말해요
        </h1>
        <p className="mt-2 text-lg text-slate-500">화면의 제시어를 몸짓으로 설명해요</p>
      </header>

      {resumable && (
        <div className="flex w-full max-w-3xl items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-slate-700">하던 게임이 남아 있어요</p>
            <p className="truncate text-base text-slate-400">{resumeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onDiscardResume}
            className="min-h-[60px] shrink-0 rounded-2xl bg-slate-100 px-6 text-lg font-semibold text-slate-500 active:scale-95"
          >
            지우기
          </button>
          <button
            type="button"
            onClick={onResume}
            className="min-h-[60px] shrink-0 rounded-2xl bg-green-500 px-8 text-lg font-bold text-white active:scale-95"
          >
            이어서 하기
          </button>
        </div>
      )}

      <main className="flex w-full max-w-3xl flex-col gap-5 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate({ name: 'setup', mode: 'team' })}
          className="flex-1 rounded-3xl bg-orange-500 px-8 py-10 text-3xl font-bold text-white shadow-lg shadow-orange-200 active:scale-95"
        >
          🆚 팀 대항전
          <span className="mt-2 block text-base font-medium text-orange-100">
            팀끼리 번갈아 설명해요
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: 'setup', mode: 'relay' })}
          className="flex-1 rounded-3xl bg-sky-500 px-8 py-10 text-3xl font-bold text-white shadow-lg shadow-sky-200 active:scale-95"
        >
          🏃 릴레이전 (단체)
          <span className="mt-2 block text-base font-medium text-sky-100">
            한 명씩 이어서 도전해요
          </span>
        </button>
      </main>

      <footer className="flex gap-4">
        <button
          type="button"
          onClick={() => navigate({ name: 'words' })}
          className="min-h-[60px] rounded-2xl bg-white px-8 py-4 text-xl font-semibold text-slate-700 shadow active:scale-95"
        >
          📚 제시어 관리
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: 'settings' })}
          className="min-h-[60px] rounded-2xl bg-white px-8 py-4 text-xl font-semibold text-slate-700 shadow active:scale-95"
        >
          ⚙️ 설정
        </button>
      </footer>
    </div>
  )
}
