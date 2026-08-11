import { useEffect, useState } from 'react'
import type { LiarGameState } from '../../types'
import ScaledWord from '../../components/ScaledWord'
import ConfirmDialog from '../../components/ConfirmDialog'
import { playPeek } from '../../lib/sound'
import { useEdgeColor } from '../../hooks/useEdgeColor'

interface Props {
  game: LiarGameState
  onDone: () => void
  onQuit: () => void
}

/**
 * 기기 하나를 돌려 가며 각자 제시어를 확인하는 화면.
 * 옆 사람이 넘겨다보지 못하도록 화면을 꾹 누르고 있는 동안에만 보여준다.
 */
export default function LiarRevealScreen({ game, onDone, onQuit }: Props) {
  useEdgeColor('var(--color-violet-50)')
  const [holding, setHolding] = useState(false)
  const [seen, setSeen] = useState(false)
  const [quitting, setQuitting] = useState(false)

  const playerIndex = game.order[game.revealedCount] ?? 0
  const name = game.settings.playerNames[playerIndex] ?? '참가자'
  const isLiar = playerIndex === game.liarIndex
  const isLast = game.revealedCount === game.order.length - 1

  // 다음 사람에게 넘어가면 처음 상태로 되돌린다
  useEffect(() => {
    setHolding(false)
    setSeen(false)
  }, [game.revealedCount])

  const startPeek = () => {
    if (!holding) playPeek()
    setHolding(true)
    setSeen(true)
  }
  const stopPeek = () => setHolding(false)

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
            제시어 확인 {game.revealedCount + 1} / {game.order.length}
          </p>
          <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">
            한 사람씩 확인하고 다음 사람에게 넘겨 주세요
          </p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center px-4 pb-4 sm:px-6">
        <p className="shrink-0 py-2 text-center text-2xl font-extrabold text-slate-700 sm:text-4xl">
          {name} 님 차례
        </p>

        <button
          type="button"
          onPointerDown={startPeek}
          onPointerUp={stopPeek}
          onPointerLeave={stopPeek}
          onPointerCancel={stopPeek}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex min-h-0 w-full max-w-4xl flex-1 flex-col items-center justify-center rounded-3xl px-5 py-4 text-center shadow-lg transition-colors ${
            holding
              ? isLiar
                ? 'bg-red-500 shadow-red-200'
                : 'bg-white shadow-violet-200'
              : 'bg-violet-500 shadow-violet-200'
          }`}
        >
          {holding ? (
            isLiar ? (
              <>
                {game.settings.tellCategoryToLiar && (
                  <span className="rounded-full bg-red-100 px-4 py-1 text-base font-bold text-red-700 sm:text-xl">
                    주제는 {game.categoryName}
                  </span>
                )}
                <span className="mt-3 text-5xl sm:text-7xl">🤥</span>
                <span className="mt-3 text-4xl leading-tight font-extrabold text-white sm:text-6xl">
                  당신은 라이어입니다
                </span>
                <span className="mt-3 text-lg font-semibold text-red-100 sm:text-2xl">
                  다른 사람 설명을 듣고 제시어를 알아내세요
                </span>
              </>
            ) : (
              <>
                <span className="shrink-0 rounded-full bg-violet-100 px-4 py-1 text-base font-bold text-violet-700 sm:text-xl">
                  {game.categoryName}
                </span>
                <ScaledWord text={game.wordText} />
                <span className="shrink-0 text-base font-semibold text-slate-400 sm:text-xl">
                  라이어가 눈치채지 못하게 설명할 말을 미리 생각해 두세요
                </span>
              </>
            )
          ) : (
            <>
              <span className="text-5xl sm:text-7xl">👆</span>
              <span className="mt-4 text-3xl font-extrabold text-white sm:text-5xl">
                꾹 누르고 있으면 보여요
              </span>
              <span className="mt-3 text-lg font-semibold text-violet-100 sm:text-2xl">
                손을 떼면 바로 가려집니다. 다른 사람은 화면을 보지 마세요
              </span>
            </>
          )}
        </button>
      </main>

      <footer className="shrink-0 px-4 pb-4 sm:px-6 sm:pb-6">
        <button
          type="button"
          onClick={onDone}
          disabled={!seen || holding}
          className="min-h-[76px] w-full rounded-3xl bg-green-500 text-2xl font-extrabold text-white shadow-lg shadow-green-200 disabled:bg-slate-300 disabled:shadow-none active:scale-95 sm:text-3xl"
        >
          {seen
            ? isLast
              ? '확인했어요, 설명 시작하기 →'
              : '확인했어요, 다음 사람에게 →'
            : '먼저 위를 꾹 눌러 확인하세요'}
        </button>
      </footer>

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
