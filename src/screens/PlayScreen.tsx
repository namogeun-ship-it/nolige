import { useEffect, useRef, useState } from 'react'
import type { GameState, Word } from '../types'
import {
  countCorrect,
  countPass,
  performerNames,
  quotaLeft,
  relayCorrectTotal,
  relayGoal,
  relayPassTotal,
} from '../lib/score'
import ScaledWord from '../components/ScaledWord'
import TimerRing from '../components/TimerRing'
import ConfirmDialog from '../components/ConfirmDialog'
import { playCorrect, playCountdown, playPass, playStart, playTick } from '../lib/sound'

interface Props {
  game: GameState
  currentWord: Word | null
  onBeginPlaying: () => void
  onCorrect: () => void
  onPass: () => void
  onEndTurnEarly: () => void
  onQuit: () => void
}

export default function PlayScreen({
  game,
  currentWord,
  onBeginPlaying,
  onCorrect,
  onPass,
  onEndTurnEarly,
  onQuit,
}: Props) {
  const [countdown, setCountdown] = useState(3)
  const [showHint, setShowHint] = useState(false)
  const [dialog, setDialog] = useState<'quit' | 'end-turn' | null>(null)

  const isRelay = game.settings.mode === 'relay'
  const turn = game.turns[game.turnIndex]
  const names = performerNames(game)
  const performer = names[turn?.performerIndex ?? 0] ?? '설명자'
  const bodyOnly = game.settings.explainRule === 'body-only'

  // 팀전은 이번 차례 기준, 릴레이전은 팀 전체 기준으로 센다
  const correct = isRelay ? relayCorrectTotal(game) : turn ? countCorrect(turn) : 0
  const goal = isRelay ? relayGoal(game) : null
  const myLeft = isRelay ? quotaLeft(game, turn?.performerIndex ?? 0) : 0
  const passed = isRelay ? relayPassTotal(game) : turn ? countPass(turn) : 0

  const passLeft =
    game.settings.passLimit === 'unlimited' ? Infinity : game.settings.passLimit - passed
  const canPass = passLeft > 0
  const urgent = game.phase === 'playing' && game.remainingSec <= 10

  // 3-2-1 카운트다운
  useEffect(() => {
    if (game.phase !== 'countdown') return
    setCountdown(3)
    const id = window.setInterval(() => setCountdown((c) => c - 1), 800)
    return () => window.clearInterval(id)
  }, [game.phase, game.turnIndex])

  useEffect(() => {
    if (game.phase !== 'countdown') return
    if (countdown > 0) playCountdown()
    else {
      playStart()
      onBeginPlaying()
    }
  }, [countdown, game.phase, onBeginPlaying])

  // 마지막 10초는 초읽기 소리를 낸다
  const lastTickSec = useRef<number | null>(null)
  useEffect(() => {
    if (game.phase !== 'playing') {
      lastTickSec.current = null
      return
    }
    const sec = Math.ceil(game.remainingSec)
    if (sec > 10 || sec <= 0 || sec === lastTickSec.current) return
    lastTickSec.current = sec
    playTick()
  }, [game.phase, game.remainingSec])

  // 제시어가 바뀌면 힌트는 다시 접는다
  useEffect(() => setShowHint(false), [game.currentWordId])

  if (game.phase === 'countdown') {
    return (
      <div
        className={`flex h-full flex-col items-center justify-center gap-6 text-white ${
          isRelay ? 'bg-sky-500' : 'bg-orange-500'
        }`}
      >
        <p className={`text-3xl font-bold ${isRelay ? 'text-sky-100' : 'text-orange-100'}`}>
          {performer} 차례
        </p>
        <p key={countdown} className="animate-count-pop text-[220px] leading-none font-extrabold">
          {countdown > 0 ? countdown : '시작!'}
        </p>
        <p
          className={`text-2xl font-semibold ${isRelay ? 'text-sky-100' : 'text-orange-100'}`}
        >
          {bodyOnly ? '몸으로만 설명해요' : '말로 설명해도 돼요'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      {urgent && (
        <div className="animate-urgent-edge pointer-events-none absolute inset-0 z-10 rounded-none" />
      )}

      <header className="flex shrink-0 items-center gap-2 overflow-hidden px-3 py-1 sm:gap-4 sm:px-6 [@media(min-height:640px)]:py-3">
        <button
          type="button"
          onClick={() => setDialog('quit')}
          className="min-h-[52px] shrink-0 rounded-2xl bg-white px-3 text-sm font-semibold whitespace-nowrap text-slate-500 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
        >
          나가기
        </button>

        <TimerRing remainingSec={game.remainingSec} totalSec={game.settings.timeLimitSec} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-slate-800 sm:text-2xl">{performer}</p>
          <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">
            {isRelay ? `내 몫 ${myLeft}개 남음` : `${game.turnIndex + 1}번째 차례`}
          </p>
        </div>

        {/* 좁은 화면에서는 규칙을 이모지 하나로 줄인다 */}
        <span
          className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold whitespace-nowrap sm:px-4 sm:text-base ${
            bodyOnly ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
          }`}
        >
          {bodyOnly ? '🙊' : '🗣️'}
          <span className="hidden md:inline"> {bodyOnly ? '몸으로만' : '말 설명 허용'}</span>
        </span>

        <span className="shrink-0 rounded-2xl bg-green-100 px-3 py-2 text-xl font-extrabold tabular-nums text-green-700 sm:px-5 sm:py-3 sm:text-2xl">
          ✅ {correct}
          {goal !== null && <span className="text-green-500"> / {goal}</span>}
        </span>

        {!isRelay && (
          <button
            type="button"
            onClick={() => setDialog('end-turn')}
            className="hidden min-h-[52px] shrink-0 rounded-2xl bg-white px-3 text-sm font-semibold whitespace-nowrap text-slate-500 shadow-sm active:scale-95 sm:block sm:min-h-[60px] sm:px-5 sm:text-base"
          >
            턴 끝내기
          </button>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-3 sm:px-6">
        {currentWord ? (
          <>
            <ScaledWord text={currentWord.text} />
            {game.settings.hintsEnabled && currentWord.hints.length > 0 && (
              <div className="shrink-0 pb-1 [@media(min-height:640px)]:pb-3">
                {showHint ? (
                  <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {currentWord.hints.map((h) => (
                      <li
                        key={h}
                        className="rounded-2xl bg-amber-100 px-4 py-2 text-base font-semibold text-amber-800 sm:px-5 sm:py-3 sm:text-xl"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="min-h-[44px] rounded-2xl bg-amber-200 px-6 text-base font-bold text-amber-800 active:scale-95 sm:text-xl [@media(min-height:640px)]:min-h-[60px] [@media(min-height:640px)]:px-8"
                    >
                      💡 힌트 보기
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-3xl font-bold text-slate-500">낼 수 있는 제시어가 없어요</p>
            <p className="text-lg text-slate-400">제시어 관리에서 주제에 단어를 더 넣어 주세요.</p>
          </div>
        )}
      </main>

      {/* 세로가 짧은 가로 모드 휴대폰에서는 단추를 낮춰 제시어 자리를 넓힌다 */}
      <footer className="flex shrink-0 gap-3 p-2 sm:gap-4 [@media(min-height:640px)]:p-4">
        <button
          type="button"
          onClick={() => {
            playPass()
            onPass()
          }}
          disabled={!canPass || !currentWord}
          className="min-h-[84px] flex-1 rounded-3xl bg-slate-300 text-2xl font-extrabold text-slate-700 shadow-lg disabled:opacity-40 active:scale-95 sm:text-4xl [@media(min-height:640px)]:min-h-[120px]"
        >
          패스
          <span className="mt-1 block text-lg font-bold text-slate-500">
            {isRelay ? (
              canPass ? (
                <>
                  {myLeft > 1 ? '다른 제시어로 바꿔요' : '이 제시어를 다음 사람에게'}
                  {game.settings.passLimit !== 'unlimited' && ` · ${passLeft}번 남음`}
                </>
              ) : (
                '팀 패스를 다 썼어요'
              )
            ) : game.settings.passLimit === 'unlimited' ? (
              '무제한'
            ) : canPass ? (
              `${passLeft}번 남음`
            ) : (
              '다 썼어요'
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            playCorrect()
            onCorrect()
          }}
          disabled={!currentWord}
          className="min-h-[84px] flex-[1.4] rounded-3xl bg-green-500 text-3xl font-extrabold text-white shadow-lg shadow-green-200 disabled:opacity-40 active:scale-95 sm:text-5xl [@media(min-height:640px)]:min-h-[120px]"
        >
          정답!
        </button>
      </footer>

      {dialog === 'quit' && (
        <ConfirmDialog
          title="게임을 그만할까요?"
          message="지금까지의 점수는 사라져요."
          confirmLabel="그만하기"
          onConfirm={onQuit}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'end-turn' && (
        <ConfirmDialog
          title="이번 차례를 끝낼까요?"
          message="시간이 남아 있어도 결과 화면으로 넘어가요."
          confirmLabel="끝내기"
          tone="normal"
          onConfirm={() => {
            setDialog(null)
            onEndTurnEarly()
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  )
}
