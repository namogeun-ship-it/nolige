import { useEffect, useState } from 'react'
import type { LiarGameState } from '../../types'
import { currentVoter, isMeLabel } from '../../lib/liar'
import ConfirmDialog from '../../components/ConfirmDialog'
import { playPeek } from '../../lib/sound'

interface Props {
  game: LiarGameState
  onCastVote: (voterIndex: number, targetIndex: number) => void
  onAccuse: (targetIndex: number) => void
  onQuit: () => void
}

/**
 * 라이어를 찾는 투표 화면.
 * 앱 투표는 기기를 한 바퀴 돌리며 한 명씩 몰래 고르고,
 * 손 지목은 다 같이 손가락으로 가리킨 결과만 눌러서 넘긴다.
 */
export default function LiarVoteScreen({ game, onCastVote, onAccuse, onQuit }: Props) {
  const byApp = game.settings.voteMode === 'app'
  const [ready, setReady] = useState(!byApp)
  const [pending, setPending] = useState<number | null>(null)
  const [quitting, setQuitting] = useState(false)

  const voter = currentVoter(game)
  const voterName = game.settings.playerNames[voter] ?? '참가자'

  // 다음 사람 차례가 되면 다시 넘겨받기 화면부터 시작한다
  useEffect(() => {
    if (byApp) setReady(false)
  }, [byApp, game.voteAt])

  const pick = (target: number) => {
    playPeek()
    if (byApp) onCastVote(voter, target)
    else setPending(target)
  }

  if (byApp && !ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-violet-500 px-6 text-center">
        <p className="text-2xl font-bold text-violet-100 sm:text-3xl">투표할 차례예요</p>
        <p className="max-w-full truncate text-6xl font-extrabold text-white sm:text-8xl">
          {voterName}
        </p>
        <p className="text-lg font-semibold text-violet-100 sm:text-2xl">
          기기를 넘겨받고, 다른 사람에게 화면이 보이지 않게 들어 주세요
        </p>
        <button
          type="button"
          onClick={() => setReady(true)}
          className="min-h-[76px] w-full max-w-xl rounded-3xl bg-white px-8 text-2xl font-extrabold text-violet-700 shadow-lg active:scale-95 sm:text-3xl"
        >
          내가 {isMeLabel(voterName)}
        </button>
        <p className="text-base text-violet-200">
          {game.voteAt + 1} / {game.order.length}번째 투표
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-violet-50">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setQuitting(true)}
          className="min-h-[52px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold text-slate-500 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
        >
          나가기
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-violet-700 sm:text-2xl">
            {byApp ? `${voterName} 님의 비밀 투표` : '라이어로 지목된 사람'}
          </p>
          <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">
            {byApp
              ? `누가 라이어일까요? ${game.voteAt + 1} / ${game.order.length}번째`
              : '다 같이 손가락으로 지목하고, 가장 많이 지목된 사람을 눌러 주세요'}
          </p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {game.settings.playerNames.map((name, index) => {
            // 앱 투표에서는 자기 자신을 찍을 수 없다
            const disabled = byApp && index === voter
            return (
              <button
                key={index}
                type="button"
                onClick={() => pick(index)}
                disabled={disabled}
                className="min-h-[88px] rounded-3xl bg-white px-5 text-2xl font-extrabold text-slate-700 shadow disabled:opacity-30 active:scale-95 sm:text-3xl"
              >
                <span className="mr-2 text-lg font-bold text-violet-400">{index + 1}</span>
                {name}
                {disabled && <span className="block text-base font-semibold text-slate-400">나</span>}
              </button>
            )
          })}
        </div>
      </main>

      {pending !== null && (
        <ConfirmDialog
          title={`${game.settings.playerNames[pending]} 님을 지목할까요?`}
          message="이 사람이 라이어인지 바로 밝혀집니다."
          confirmLabel="지목하기"
          tone="normal"
          onConfirm={() => {
            const target = pending
            setPending(null)
            onAccuse(target)
          }}
          onCancel={() => setPending(null)}
        />
      )}
      {quitting && (
        <ConfirmDialog
          title="라이어 게임을 그만할까요?"
          message="지금 판과 전적이 사라져요."
          confirmLabel="그만하기"
          onConfirm={onQuit}
          onCancel={() => setQuitting(false)}
        />
      )}
    </div>
  )
}
