import { useEffect } from 'react'
import type { BombGameState } from '../../types'
import { playBoom } from '../../lib/sound'
import { useEdgeColor } from '../../hooks/useEdgeColor'

interface Props {
  game: BombGameState
  onNextRound: () => void
  onQuit: () => void
}

/**
 * 터진 순간의 화면.
 * 앱은 누가 들고 있었는지 모른다. 그건 둘러앉은 아이들이 서로 보고 안다.
 */
export default function BombBoomScreen({ game, onNextRound, onQuit }: Props) {
  useEdgeColor('var(--color-red-600)')

  useEffect(() => {
    playBoom()
  }, [])

  return (
    <div className="flex h-full flex-col items-center gap-6 overflow-y-auto bg-red-600 p-5 text-white sm:gap-8 sm:p-8">
      <div className="mt-auto text-center">
        <p className="animate-boom-flash text-[150px] leading-none sm:text-[220px]">💥</p>
        <h1 className="mt-2 text-5xl font-extrabold sm:text-7xl">터졌다!</h1>
        <p className="mt-4 text-xl font-semibold text-red-100 sm:text-2xl">
          지금 들고 있는 사람이 걸렸어요
        </p>
      </div>

      <div className="mb-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onQuit}
          className="min-h-[68px] flex-1 rounded-2xl bg-red-500/70 text-xl font-bold text-white active:scale-95"
        >
          그만하기
        </button>
        <button
          type="button"
          onClick={onNextRound}
          className="min-h-[68px] flex-[2] rounded-2xl bg-white text-2xl font-extrabold text-red-600 shadow-lg active:scale-95"
        >
          {game.round + 1}판 시작 →
        </button>
      </div>
    </div>
  )
}
