import type { Screen } from '../types'

interface Props {
  navigate: (screen: Screen) => void
  onBack: () => void
}

/** 몸으로 말해요를 고른 뒤 팀 대항전과 릴레이전 중에서 고르는 화면. */
export default function CharadesMenuScreen({ navigate, onBack }: Props) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-4 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[60px] rounded-2xl bg-white px-6 text-lg font-semibold text-slate-600 shadow-sm active:scale-95"
        >
          ← 홈
        </button>
        <h1 className="text-3xl font-extrabold text-orange-600">몸으로 말해요</h1>
      </header>

      {/* 가운데 정렬은 mt-auto·mb-auto로 한다. justify-center는 내용이 넘칠 때 위가 잘린다 */}
      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto p-5 sm:gap-8 sm:p-8">
        <p className="mt-auto text-center text-lg text-slate-500">
          화면의 제시어를 몸짓이나 말로 설명해요. 어떻게 겨룰까요?
        </p>
        <main className="mb-auto flex w-full max-w-3xl flex-col gap-5 sm:flex-row">
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
      </div>
    </div>
  )
}
