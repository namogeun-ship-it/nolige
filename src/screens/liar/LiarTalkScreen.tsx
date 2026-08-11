import { useEffect, useRef, useState } from 'react'
import type { LiarGameState } from '../../types'
import { currentSpeaker, speechNumber, totalRounds, totalSpeeches } from '../../lib/liar'
import TimerRing from '../../components/TimerRing'
import ConfirmDialog from '../../components/ConfirmDialog'
import { playTick, playTimeUp } from '../../lib/sound'
import { useEdgeColor } from '../../hooks/useEdgeColor'

interface Props {
  game: LiarGameState
  onNext: () => void
  onPrev: () => void
  onSkipToVote: () => void
  onQuit: () => void
}

/** 순서대로 제시어를 설명하는 화면. 지금 누구 차례인지와 남은 시간만 크게 보여준다. */
export default function LiarTalkScreen({ game, onNext, onPrev, onSkipToVote, onQuit }: Props) {
  useEdgeColor('var(--color-violet-50)')
  const [dialog, setDialog] = useState<'quit' | 'skip' | null>(null)

  const timed = game.settings.speakSec > 0
  const speaker = currentSpeaker(game)
  const name = game.settings.playerNames[speaker] ?? '참가자'
  const rounds = totalRounds(game)
  const isLastSpeech = speechNumber(game) === totalSpeeches(game)
  const timeUp = timed && game.remainingSec <= 0

  // 마지막 5초 초읽기와 시간 종료 소리
  const lastTickSec = useRef<number | null>(null)
  useEffect(() => {
    if (!timed) return
    const sec = Math.ceil(game.remainingSec)
    if (sec === lastTickSec.current) return
    lastTickSec.current = sec
    if (sec > 0 && sec <= 5) playTick()
    if (sec === 0) playTimeUp()
  }, [timed, game.remainingSec])

  useEffect(() => {
    lastTickSec.current = null
  }, [game.round, game.speakAt])

  return (
    <div className="flex h-full flex-col bg-violet-50">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setDialog('quit')}
          className="min-h-[52px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold text-slate-500 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
        >
          나가기
        </button>
        {timed && (
          <TimerRing
            remainingSec={game.remainingSec}
            totalSec={game.settings.speakSec}
            tone="violet"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-violet-700 sm:text-2xl">
            설명 {speechNumber(game)} / {totalSpeeches(game)}
          </p>
          <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">
            {rounds > 1 ? `${game.round}바퀴째 · ` : ''}
            {game.extraRoundUsed && game.round === rounds
              ? '엉뚱한 사람을 지목해서 얻은 마지막 한 바퀴예요'
              : '제시어를 말하지 말고 돌려서 설명하세요'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog('skip')}
          className="hidden min-h-[52px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold text-slate-500 shadow-sm active:scale-95 sm:block sm:min-h-[60px] sm:px-5 sm:text-base"
        >
          바로 투표
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 sm:gap-6 sm:px-6">
        <p className="text-xl font-bold text-slate-400 sm:text-3xl">지금 설명할 사람</p>
        <p
          key={`${game.round}-${game.speakAt}`}
          className="animate-card-in max-w-full truncate text-6xl leading-none font-extrabold text-violet-700 sm:text-8xl"
        >
          {name}
        </p>
        {timeUp && (
          <p className="text-2xl font-extrabold text-red-500 sm:text-3xl">시간이 다 됐어요</p>
        )}

        <ol className="flex max-w-4xl flex-wrap justify-center gap-2 sm:gap-3">
          {game.order.map((p, i) => {
            const done = i < game.speakAt
            const now = i === game.speakAt
            return (
              <li
                key={p}
                className={`rounded-2xl px-4 py-2 text-base font-semibold sm:text-xl ${
                  now
                    ? 'bg-violet-500 text-white'
                    : done
                      ? 'bg-violet-100 text-violet-400'
                      : 'bg-white text-slate-500'
                }`}
              >
                {i + 1}. {game.settings.playerNames[p]}
              </li>
            )
          })}
        </ol>
      </main>

      <footer className="flex shrink-0 gap-3 p-4 sm:gap-4 sm:p-6">
        <button
          type="button"
          onClick={onPrev}
          disabled={game.round === 1 && game.speakAt === 0}
          className="min-h-[76px] flex-1 rounded-3xl bg-white text-xl font-bold text-slate-500 shadow disabled:opacity-40 active:scale-95 sm:text-2xl"
        >
          ← 앞사람
        </button>
        <button
          type="button"
          onClick={onNext}
          className="min-h-[76px] flex-[2.5] rounded-3xl bg-violet-500 text-2xl font-extrabold text-white shadow-lg shadow-violet-200 active:scale-95 sm:text-3xl"
        >
          {isLastSpeech ? '설명 끝, 투표하기 →' : '다음 사람 →'}
        </button>
      </footer>

      {dialog === 'quit' && (
        <ConfirmDialog
          title="라이어 게임을 그만할까요?"
          message="지금 판과 전적이 사라져요."
          confirmLabel="그만하기"
          onConfirm={onQuit}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'skip' && (
        <ConfirmDialog
          title="남은 설명을 건너뛸까요?"
          message="바로 투표 화면으로 넘어가요."
          confirmLabel="투표하기"
          tone="normal"
          onConfirm={() => {
            setDialog(null)
            onSkipToVote()
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  )
}
