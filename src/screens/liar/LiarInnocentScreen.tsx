import { useEffect } from 'react'
import type { LiarGameState } from '../../types'
import { playSuspense } from '../../lib/sound'

interface Props {
  game: LiarGameState
  onContinue: () => void
}

/**
 * 지목당한 사람이 시민이었을 때 그 사실부터 알리는 화면.
 * 라이어를 잡았을 때만큼 이 순간도 재미있어야 해서 결과로 바로 넘기지 않는다.
 * 아직 라이어가 누구인지는 밝히지 않는다. 한 바퀴를 더 돌 수도 있기 때문이다.
 */
export default function LiarInnocentScreen({ game, onContinue }: Props) {
  const name = game.accusedIndex !== null ? game.settings.playerNames[game.accusedIndex] : '이 사람'
  // 한 번 더 찾아볼 기회가 남아 있는지, 남았다면 설명을 더 듣는지 바로 다시 지목하는지
  const canRevote = game.settings.wrongPick === 'revote' && !game.revoteUsed
  const canTalkAgain = game.settings.wrongPick === 'extra-round' && !game.extraRoundUsed

  useEffect(() => {
    playSuspense()
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-amber-500 px-5 py-6 text-center sm:gap-7 sm:px-8">
      <p className="text-6xl sm:text-8xl">🙅</p>
      <div className="max-w-3xl">
        <p className="max-w-full truncate text-5xl font-extrabold text-white sm:text-7xl">{name}</p>
        <p className="mt-3 text-3xl leading-tight font-extrabold break-keep text-white sm:text-5xl">
          선량한 시민을 라이어로 잘못 지목했습니다!
        </p>
      </div>
      <p className="max-w-3xl text-xl font-semibold break-keep text-amber-100 sm:text-2xl">
        {canRevote
          ? '라이어는 아직 숨어 있어요. 설명은 그만 듣고 바로 다시 지목해요.'
          : canTalkAgain
            ? '라이어는 아직 숨어 있어요. 설명을 한 바퀴 더 듣고 다시 투표해요.'
            : '라이어는 끝까지 들키지 않았어요.'}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="min-h-[88px] w-full max-w-3xl rounded-3xl bg-white px-8 text-2xl font-extrabold text-amber-700 shadow-lg active:scale-95 sm:text-3xl"
      >
        {canRevote ? '다시 지목하기 →' : canTalkAgain ? '한 바퀴 더 돌기 →' : '결과 보기 →'}
      </button>
    </div>
  )
}
