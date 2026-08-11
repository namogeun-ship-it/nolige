import { useEffect } from 'react'
import type { LiarGameState } from '../../types'
import { playSuspense } from '../../lib/sound'
import { useEdgeColor } from '../../hooks/useEdgeColor'

interface Props {
  game: LiarGameState
  onJudge: (right: boolean) => void
}

/**
 * 라이어를 제대로 지목했을 때의 마지막 관문.
 * 라이어가 제시어를 알아맞히면 뒤집기에 성공한다.
 * 제시어를 아는 시민들이 듣고 맞았는지 눌러 준다. 화면에는 제시어를 띄우지 않는다.
 */
export default function LiarGuessScreen({ game, onJudge }: Props) {
  useEdgeColor('var(--color-red-500)')
  const liarName = game.settings.playerNames[game.liarIndex] ?? '라이어'

  useEffect(() => {
    playSuspense()
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-red-500 px-5 py-6 text-center sm:gap-7 sm:px-8">
      <p className="text-6xl sm:text-8xl">🤥</p>
      <div>
        <p className="text-2xl font-bold text-red-100 sm:text-3xl">지목당한 사람은 라이어였어요</p>
        <p className="mt-2 max-w-full truncate text-5xl font-extrabold text-white sm:text-7xl">
          {liarName}
        </p>
      </div>
      <p className="max-w-3xl text-xl font-semibold break-keep text-red-100 sm:text-2xl">
        마지막 기회예요. {liarName} 님이 제시어가 무엇이었는지 말해 보세요. 맞히면 라이어가
        이깁니다.
      </p>
      <p className="text-lg font-semibold text-red-200">
        제시어를 아는 사람들이 듣고 아래에서 눌러 주세요
      </p>

      <div className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={() => onJudge(false)}
          className="min-h-[88px] flex-1 rounded-3xl bg-white text-2xl font-extrabold text-slate-700 shadow-lg active:scale-95 sm:text-3xl"
        >
          못 맞혔어요
          <span className="mt-1 block text-base font-semibold text-slate-400">시민 승리</span>
        </button>
        <button
          type="button"
          onClick={() => onJudge(true)}
          className="min-h-[88px] flex-1 rounded-3xl bg-slate-900 text-2xl font-extrabold text-white shadow-lg active:scale-95 sm:text-3xl"
        >
          맞혔어요
          <span className="mt-1 block text-base font-semibold text-slate-400">라이어 승리</span>
        </button>
      </div>
    </div>
  )
}
