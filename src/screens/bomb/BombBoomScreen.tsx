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
 *
 * 화면 전체가 한 번 하얗게 번쩍하고, 흔들리고, 붉게 남는다.
 * 폭탄 돌리기에서 유일하게 크게 놀라는 순간이라 아낄 이유가 없다.
 */
export default function BombBoomScreen({ game, onNextRound, onQuit }: Props) {
  useEdgeColor('var(--color-red-600)')

  useEffect(() => {
    playBoom()
  }, [])

  // 흔드는 것은 안쪽 내용뿐이다. 바깥 상자까지 흔들면 화면 가장자리가 들려서 뒷배경이 보인다
  return (
    <div className="relative h-full overflow-hidden bg-red-600">
      {/* 터지는 순간의 섬광. 곧바로 사라진다 */}
      <div className="animate-boom-white pointer-events-none absolute inset-0 z-20 bg-white" />

      <div className="animate-screen-shake relative z-10 flex h-full flex-col items-center gap-6 overflow-y-auto p-5 text-white sm:gap-8 sm:p-8">
        <div className="mt-auto text-center">
          <p className="animate-boom-flash text-[min(58vw,32vh)] leading-none">💥</p>
          <h1 className="mt-1 text-6xl font-extrabold drop-shadow-lg sm:text-8xl">터졌다!</h1>
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
    </div>
  )
}
