import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GameSettings, GameState, TurnRecord, Word, WordResult } from '../types'
import { buildDeck } from '../lib/wordPool'
import { nextPerformerIndex, quotaLeft, totalTurns } from '../lib/score'
import {
  clearGameState,
  loadRecentWordIds,
  rememberUsedWordIds,
  saveGameState,
} from '../lib/storage'

/**
 * 섞어 둔 묶음에서 다음 제시어를 한 장 꺼낸다.
 * 묶음을 다 쓰면 그때 한 번만 다시 섞으므로, 묶음 하나가 도는 동안은 중복이 나올 수 없다.
 */
function withNextWord(state: GameState, words: Word[]): GameState {
  const { categoryIds, difficulty } = state.settings
  const alive = new Set(words.map((w) => w.id))
  let deck = state.deck
  let index = state.deckIndex

  // 첫 번째 시도는 지금 묶음에서, 두 번째 시도는 새로 섞은 묶음에서 꺼낸다
  for (let attempt = 0; attempt < 2; attempt++) {
    // 제시어 관리에서 지워진 제시어가 묶음에 남아 있으면 건너뛴다
    while (index < deck.length && !alive.has(deck[index])) index++
    if (index < deck.length) {
      const wordId = deck[index]
      return {
        ...state,
        deck,
        deckIndex: index + 1,
        currentWordId: wordId,
        usedWordIds: [...state.usedWordIds, wordId],
      }
    }
    // 묶음을 다 썼다. 아직 안 나온 제시어가 앞으로 오도록 다시 만든다
    deck = buildDeck(words, categoryIds, difficulty, [
      ...loadRecentWordIds(),
      ...state.usedWordIds,
    ])
    index = 0
    if (deck.length === 0) break
  }
  return { ...state, deck, deckIndex: 0, currentWordId: null }
}

/** 지금 구간에 흐른 시간을 기록해 둔다 */
function stampElapsed(state: GameState, startedRemaining: number): TurnRecord[] {
  const elapsedSec = Math.max(0, startedRemaining - state.remainingSec)
  return state.turns.map((t, i) => (i === state.turnIndex ? { ...t, elapsedSec } : t))
}

/** 팀전에서 새 차례를 준비한다. 차례마다 시간이 새로 주어진다. */
function startTeamTurn(state: GameState, words: Word[]): GameState {
  if (state.settings.mode !== 'team') return state
  const turns = [...state.turns]
  turns[state.turnIndex] = {
    performerIndex: state.turnIndex % state.settings.teamNames.length,
    entries: [],
    elapsedSec: 0,
  }
  return withNextWord(
    { ...state, turns, phase: 'countdown', remainingSec: state.settings.timeLimitSec, currentWordId: null },
    words,
  )
}

/**
 * 릴레이전에서 다음 사람의 구간을 연다.
 * 제한 시간은 팀 전체가 나눠 쓰므로 남은 시간을 그대로 이어받는다.
 * 패스로 넘어온 경우에는 currentWordId가 남아 있어 같은 제시어를 이어서 도전한다.
 */
function startRelaySegment(state: GameState, performerIndex: number, words: Word[]): GameState {
  const turns = [...state.turns, { performerIndex, entries: [], elapsedSec: 0 }]
  const opened: GameState = { ...state, turns, turnIndex: turns.length - 1, phase: 'playing' }
  return opened.currentWordId ? opened : withNextWord(opened, words)
}

/** 팀전에서 이번 차례를 끝내고 라운드 결과로 넘어간다 */
function finishTeamTurn(state: GameState): GameState {
  return {
    ...state,
    turns: stampElapsed(state, state.settings.timeLimitSec),
    phase: 'round-result',
    currentWordId: null,
  }
}

export function useGame(words: Word[]) {
  const [game, setGame] = useState<GameState | null>(null)

  // 인터벌 안에서 최신 값을 봐야 해서 ref로 따로 들고 있는다
  const wordsRef = useRef(words)
  wordsRef.current = words
  const gameRef = useRef(game)
  gameRef.current = game
  // 지금 구간이 시작될 때 남아 있던 시간. 구간별 소요 시간을 재는 데 쓴다
  const segmentStartedAt = useRef(0)

  // ── 저장. 1초에 한 번을 넘지 않도록 서명을 비교한다
  const lastSignature = useRef('')
  const hasStarted = useRef(false)
  useEffect(() => {
    if (!game) {
      lastSignature.current = ''
      // 아직 이 화면에서 게임을 시작한 적이 없다면 저장본을 지우지 않는다.
      // 지웠다가는 "이어서 하기"로 되살릴 게임이 사라진다.
      if (hasStarted.current) clearGameState()
      return
    }
    hasStarted.current = true
    const turn = game.turns[game.turnIndex]
    const signature = [
      game.phase,
      game.turnIndex,
      game.currentWordId,
      turn?.entries.length ?? 0,
      Math.ceil(game.remainingSec),
    ].join('|')
    if (signature === lastSignature.current) return
    lastSignature.current = signature
    saveGameState(game)
  }, [game])

  // ── 남은 시간 세기. 실제 흐른 시간으로 줄여서 오차가 쌓이지 않게 한다
  useEffect(() => {
    if (game?.phase !== 'playing') return
    let last = Date.now()
    const id = window.setInterval(() => {
      const now = Date.now()
      const delta = (now - last) / 1000
      last = now
      setGame((prev) => {
        if (!prev || prev.phase !== 'playing') return prev
        const remainingSec = prev.remainingSec - delta
        if (remainingSec > 0) return { ...prev, remainingSec }
        // 시간이 다 됐다
        const ended = { ...prev, remainingSec: 0 }
        if (ended.settings.mode === 'team') return finishTeamTurn(ended)
        // 릴레이전은 시간이 끝나면 판 자체가 끝난다
        return {
          ...ended,
          turns: stampElapsed(ended, segmentStartedAt.current),
          phase: 'final-result',
          currentWordId: null,
        }
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [game?.phase, game?.turnIndex])

  const startGame = useCallback((settings: GameSettings) => {
    const words = wordsRef.current
    const base: GameState = {
      settings,
      phase: 'countdown',
      turnIndex: 0,
      turns: [],
      // 게임을 만들 때 조건에 맞는 제시어를 통째로 가져와 섞어 둔다.
      // 지난 판에 나온 제시어는 뒤로 미뤄, 연달아 게임해도 같은 말이 잘 안 나오게 한다.
      deck: buildDeck(words, settings.categoryIds, settings.difficulty, loadRecentWordIds()),
      deckIndex: 0,
      usedWordIds: [],
      currentWordId: null,
      remainingSec: settings.timeLimitSec,
    }
    segmentStartedAt.current = settings.timeLimitSec
    if (settings.mode === 'team') {
      setGame(startTeamTurn(base, words))
      return
    }
    // 릴레이전은 첫 사람의 구간을 열고 카운트다운부터 시작한다
    const first = withNextWord(
      {
        ...base,
        turns: [{ performerIndex: 0, entries: [], elapsedSec: 0 }],
        turnIndex: 0,
      },
      words,
    )
    setGame({ ...first, phase: 'countdown' })
  }, [])

  /** 저장돼 있던 게임을 이어서 한다. 진행 중이었다면 카운트다운부터 다시 센다. */
  const resumeGame = useCallback((saved: GameState) => {
    segmentStartedAt.current = saved.remainingSec
    setGame(saved.phase === 'playing' ? { ...saved, phase: 'countdown' } : saved)
  }, [])

  /** 카운트다운이 끝나면 시간이 흐르기 시작한다 */
  const beginPlaying = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'countdown') return prev
      segmentStartedAt.current = prev.remainingSec
      return { ...prev, phase: 'playing' }
    })
  }, [])

  /** 릴레이전에서 기기를 넘긴 뒤 다음 사람이 시작한다 */
  const beginNextPerformer = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'handoff' || prev.settings.mode !== 'relay') return prev
      const next = nextPerformerIndex(prev, prev.turns[prev.turnIndex].performerIndex)
      if (next === null) return { ...prev, phase: 'final-result', currentWordId: null }
      segmentStartedAt.current = prev.remainingSec
      return startRelaySegment(prev, next, wordsRef.current)
    })
  }, [])

  const answer = useCallback((result: WordResult) => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'playing') return prev
      const word = wordsRef.current.find((w) => w.id === prev.currentWordId)
      if (!word) return prev

      const turn = prev.turns[prev.turnIndex]
      const entries = [...turn.entries, { wordId: word.id, text: word.text, result }]
      const turns = prev.turns.map((t, i) => (i === prev.turnIndex ? { ...t, entries } : t))
      const next: GameState = { ...prev, turns }

      if (next.settings.mode === 'relay') {
        const me = turn.performerIndex

        if (result === 'pass') {
          // 아직 맞힐 몫이 더 남았으면 내 차례를 이어가며 제시어만 바꾼다.
          // 마지막 한 개가 남았을 때 패스해야 다음 사람에게 넘어간다.
          const isMyLastWord = quotaLeft(next, me) === 1
          const receiver = isMyLastWord ? nextPerformerIndex(next, me) : null
          // 넘길 사람이 나밖에 없으면 넘기는 의미가 없으니 제시어만 새로 뽑는다
          if (receiver === null || receiver === me) return withNextWord(next, wordsRef.current)
          // 같은 제시어를 그대로 들고 다음 사람에게 넘긴다
          return {
            ...next,
            turns: stampElapsed(next, segmentStartedAt.current),
            phase: 'handoff',
          }
        }

        // 내 몫을 다 채웠으면 새 제시어와 함께 다음 사람에게 넘긴다
        if (quotaLeft(next, me) === 0) {
          const stamped: GameState = {
            ...next,
            turns: stampElapsed(next, segmentStartedAt.current),
            currentWordId: null,
          }
          // 아무도 남지 않았으면 통과다
          return nextPerformerIndex(stamped, me) === null
            ? { ...stamped, phase: 'final-result' }
            : { ...stamped, phase: 'handoff' }
        }
        return withNextWord(next, wordsRef.current)
      }

      return withNextWord(next, wordsRef.current)
    })
  }, [])

  const markCorrect = useCallback(() => answer('correct'), [answer])
  const markPass = useCallback(() => answer('pass'), [answer])

  /** 팀전에서 시간을 남기고 설명자가 직접 차례를 끝낼 때 */
  const endTurnEarly = useCallback(() => {
    setGame((prev) =>
      prev && prev.phase === 'playing' && prev.settings.mode === 'team' ? finishTeamTurn(prev) : prev,
    )
  }, [])

  /** 결과 화면에서 정답과 패스를 손으로 고친다 */
  const toggleEntryResult = useCallback((turnIndex: number, entryIndex: number) => {
    setGame((prev) => {
      if (!prev) return prev
      const turns = prev.turns.map((t, i) => {
        if (i !== turnIndex) return t
        return {
          ...t,
          entries: t.entries.map((e, j) =>
            j === entryIndex
              ? { ...e, result: (e.result === 'correct' ? 'pass' : 'correct') as WordResult }
              : e,
          ),
        }
      })
      return { ...prev, turns }
    })
  }, [])

  const goToNextTurn = useCallback(() => {
    setGame((prev) => {
      if (!prev) return prev
      const nextIndex = prev.turnIndex + 1
      if (nextIndex >= totalTurns(prev)) {
        // 판이 끝났다. 이번에 나온 제시어를 기억해 다음 판에서 뒤로 미룬다
        rememberUsedWordIds(prev.usedWordIds)
        return { ...prev, phase: 'final-result' }
      }
      return startTeamTurn({ ...prev, turnIndex: nextIndex }, wordsRef.current)
    })
  }, [])

  /** 같은 설정으로 새 판을 시작한다 */
  const playAgain = useCallback(() => {
    const current = gameRef.current
    if (!current) return
    rememberUsedWordIds(current.usedWordIds)
    startGame(current.settings)
  }, [startGame])

  const quitGame = useCallback(() => {
    // 중간에 그만두더라도 여기까지 나온 제시어는 기억해 둔다
    if (gameRef.current) rememberUsedWordIds(gameRef.current.usedWordIds)
    setGame(null)
    clearGameState()
  }, [])

  const currentWord = useMemo(
    () => (game?.currentWordId ? (words.find((w) => w.id === game.currentWordId) ?? null) : null),
    [game?.currentWordId, words],
  )

  return {
    game,
    currentWord,
    startGame,
    resumeGame,
    beginPlaying,
    beginNextPerformer,
    markCorrect,
    markPass,
    endTurnEarly,
    toggleEntryResult,
    goToNextTurn,
    playAgain,
    quitGame,
  }
}
