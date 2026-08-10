import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Category, LiarGameState, LiarSettings, Word } from '../types'
import { buildDeck } from '../lib/wordPool'
import { pickLiarIndex, shuffledOrder, totalRounds } from '../lib/liar'
import {
  clearLiarGameState,
  loadRecentWordIds,
  rememberUsedWordIds,
  saveLiarGameState,
} from '../lib/storage'

/** 새 판에 쓸 제시어를 묶음에서 한 장 꺼낸다. 묶음을 다 쓰면 그때 한 번만 다시 섞는다. */
function drawWord(
  deck: string[],
  deckIndex: number,
  usedWordIds: string[],
  settings: LiarSettings,
  words: Word[],
): { deck: string[]; deckIndex: number; word: Word | null } {
  const byId = new Map(words.map((w) => [w.id, w]))
  let nextDeck = deck
  let index = deckIndex

  for (let attempt = 0; attempt < 2; attempt++) {
    // 제시어 관리에서 지워진 제시어가 묶음에 남아 있으면 건너뛴다
    while (index < nextDeck.length && !byId.has(nextDeck[index])) index++
    if (index < nextDeck.length) {
      return { deck: nextDeck, deckIndex: index + 1, word: byId.get(nextDeck[index]) ?? null }
    }
    nextDeck = buildDeck(words, settings.categoryIds, settings.difficulty, [
      ...loadRecentWordIds(),
      ...usedWordIds,
    ])
    index = 0
    if (nextDeck.length === 0) break
  }
  return { deck: nextDeck, deckIndex: 0, word: null }
}

/** 새 판을 차린다. 제시어를 뽑고 라이어를 정하고 설명 순서를 섞는다. */
function dealRound(
  settings: LiarSettings,
  base: Pick<LiarGameState, 'deck' | 'deckIndex' | 'usedWordIds' | 'tally'>,
  words: Word[],
  categories: Category[],
): LiarGameState | null {
  const drawn = drawWord(base.deck, base.deckIndex, base.usedWordIds, settings, words)
  if (!drawn.word) return null
  const count = settings.playerNames.length
  return {
    settings,
    phase: 'reveal',
    wordId: drawn.word.id,
    wordText: drawn.word.text,
    categoryName: categories.find((c) => c.id === drawn.word?.categoryId)?.name ?? '기타',
    liarIndex: pickLiarIndex(count),
    order: shuffledOrder(count),
    revealedCount: 0,
    round: 1,
    speakAt: 0,
    remainingSec: settings.speakSec,
    voteAt: 0,
    votes: Array.from({ length: count }, () => null),
    accusedIndex: null,
    liarGuessedRight: null,
    winner: null,
    extraRoundUsed: false,
    revoteUsed: false,
    tally: base.tally,
    deck: drawn.deck,
    deckIndex: drawn.deckIndex,
    usedWordIds: [...base.usedWordIds, drawn.word.id],
  }
}

/** 판을 끝내고 승패를 적는다. 전적은 여기서 한 번만 올라간다. */
function settle(state: LiarGameState, winner: 'citizens' | 'liar'): LiarGameState {
  return {
    ...state,
    phase: 'result',
    winner,
    tally: {
      citizens: state.tally.citizens + (winner === 'citizens' ? 1 : 0),
      liar: state.tally.liar + (winner === 'liar' ? 1 : 0),
    },
  }
}

export function useLiarGame(words: Word[], categories: Category[]) {
  const [game, setGame] = useState<LiarGameState | null>(null)

  const wordsRef = useRef(words)
  wordsRef.current = words
  const categoriesRef = useRef(categories)
  categoriesRef.current = categories
  const gameRef = useRef(game)
  gameRef.current = game

  // ── 저장. 1초에 한 번을 넘지 않도록 서명을 비교한다
  const lastSignature = useRef('')
  const hasStarted = useRef(false)
  useEffect(() => {
    if (!game) {
      lastSignature.current = ''
      // 아직 이 화면에서 게임을 시작한 적이 없다면 저장본을 지우지 않는다
      if (hasStarted.current) clearLiarGameState()
      return
    }
    hasStarted.current = true
    const signature = [
      game.phase,
      game.wordId,
      game.revealedCount,
      game.round,
      game.speakAt,
      game.voteAt,
      game.accusedIndex,
      game.winner,
      Math.ceil(game.remainingSec),
    ].join('|')
    if (signature === lastSignature.current) return
    lastSignature.current = signature
    saveLiarGameState(game)
  }, [game])

  // ── 발언 시간 재기. 0에서 멈추고, 넘길지 말지는 사람이 정한다
  useEffect(() => {
    if (game?.phase !== 'talk' || game.settings.speakSec === 0) return
    let last = Date.now()
    const id = window.setInterval(() => {
      const now = Date.now()
      const delta = (now - last) / 1000
      last = now
      setGame((prev) => {
        if (!prev || prev.phase !== 'talk' || prev.remainingSec <= 0) return prev
        return { ...prev, remainingSec: Math.max(0, prev.remainingSec - delta) }
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [game?.phase, game?.round, game?.speakAt, game?.settings.speakSec])

  const startGame = useCallback((settings: LiarSettings) => {
    const words = wordsRef.current
    const deck = buildDeck(words, settings.categoryIds, settings.difficulty, loadRecentWordIds())
    const dealt = dealRound(
      settings,
      { deck, deckIndex: 0, usedWordIds: [], tally: { citizens: 0, liar: 0 } },
      words,
      categoriesRef.current,
    )
    if (dealt) setGame(dealt)
  }, [])

  const resumeGame = useCallback((saved: LiarGameState) => {
    setGame(saved)
  }, [])

  /** 한 사람이 제시어 확인을 마쳤다. 전원이 끝나면 설명을 시작한다. */
  const finishReveal = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'reveal') return prev
      const revealedCount = prev.revealedCount + 1
      if (revealedCount < prev.order.length) return { ...prev, revealedCount }
      return {
        ...prev,
        revealedCount,
        phase: 'talk',
        remainingSec: prev.settings.speakSec,
      }
    })
  }, [])

  /** 다음 사람에게 설명을 넘긴다. 정해진 바퀴를 다 돌면 투표로 넘어간다. */
  const nextSpeaker = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'talk') return prev
      const speakAt = prev.speakAt + 1
      if (speakAt < prev.order.length) {
        return { ...prev, speakAt, remainingSec: prev.settings.speakSec }
      }
      const round = prev.round + 1
      if (round <= totalRounds(prev)) {
        return { ...prev, round, speakAt: 0, remainingSec: prev.settings.speakSec }
      }
      return { ...prev, phase: 'vote', voteAt: 0 }
    })
  }, [])

  /** 잘못 넘겼을 때 앞사람으로 되돌린다 */
  const prevSpeaker = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'talk') return prev
      if (prev.speakAt > 0) {
        return { ...prev, speakAt: prev.speakAt - 1, remainingSec: prev.settings.speakSec }
      }
      if (prev.round > 1) {
        return {
          ...prev,
          round: prev.round - 1,
          speakAt: prev.order.length - 1,
          remainingSec: prev.settings.speakSec,
        }
      }
      return prev
    })
  }, [])

  /** 설명을 남겨 두고 바로 투표로 건너뛴다 */
  const skipToVote = useCallback(() => {
    setGame((prev) => (prev && prev.phase === 'talk' ? { ...prev, phase: 'vote', voteAt: 0 } : prev))
  }, [])

  /** 앱 투표에서 한 사람이 표를 냈다. 전원이 내면 개표한다. */
  const castVote = useCallback((voterIndex: number, targetIndex: number) => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'vote') return prev
      const votes = prev.votes.map((v, i) => (i === voterIndex ? targetIndex : v))
      const voteAt = prev.voteAt + 1
      if (voteAt < prev.order.length) return { ...prev, votes, voteAt }
      return { ...prev, votes, voteAt, phase: 'tally' }
    })
  }, [])

  /** 표가 갈렸을 때 처음부터 다시 투표한다 */
  const revote = useCallback(() => {
    setGame((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        phase: 'vote',
        voteAt: 0,
        votes: prev.votes.map(() => null),
        accusedIndex: null,
      }
    })
  }, [])

  /**
   * 라이어로 지목할 사람을 확정한다.
   * 라이어를 맞혔으면 라이어에게 제시어를 맞힐 기회를 주고,
   * 엉뚱한 사람을 지목했으면 시민이었다는 것부터 알린다.
   */
  const accuse = useCallback((targetIndex: number) => {
    setGame((prev) => {
      if (!prev || (prev.phase !== 'vote' && prev.phase !== 'tally')) return prev
      const next = { ...prev, accusedIndex: targetIndex }
      return { ...next, phase: targetIndex === prev.liarIndex ? 'guess' : 'innocent' }
    })
  }, [])

  /**
   * 시민을 지목했다는 것을 확인한 뒤로 넘어간다.
   * 남은 기회가 있으면 설명을 한 바퀴 더 돌고, 없으면 라이어가 이긴다.
   */
  const continueAfterInnocent = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'innocent') return prev
      if (prev.settings.wrongPick === 'revote' && !prev.revoteUsed) {
        // 설명은 더 듣지 않고 그 자리에서 한 번 더 지목한다
        return {
          ...prev,
          phase: 'vote',
          revoteUsed: true,
          votes: prev.votes.map(() => null),
          voteAt: 0,
          accusedIndex: null,
        }
      }
      if (prev.settings.wrongPick === 'extra-round' && !prev.extraRoundUsed) {
        return {
          ...prev,
          phase: 'talk',
          extraRoundUsed: true,
          // 이미 돈 바퀴에 이어서 한 바퀴를 더 돈다
          round: prev.round + 1,
          speakAt: 0,
          remainingSec: prev.settings.speakSec,
          votes: prev.votes.map(() => null),
          voteAt: 0,
          accusedIndex: null,
        }
      }
      return settle(prev, 'liar')
    })
  }, [])

  /** 지목당한 라이어가 제시어를 맞혔는지 사람이 판정해 준다 */
  const judgeGuess = useCallback((right: boolean) => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'guess') return prev
      return settle({ ...prev, liarGuessedRight: right }, right ? 'liar' : 'citizens')
    })
  }, [])

  /** 같은 사람들끼리 새 제시어로 한 판 더 한다. 전적은 이어진다. */
  const playAgain = useCallback(() => {
    const current = gameRef.current
    if (!current) return
    rememberUsedWordIds(current.usedWordIds)
    const dealt = dealRound(
      current.settings,
      {
        deck: current.deck,
        deckIndex: current.deckIndex,
        usedWordIds: current.usedWordIds,
        tally: current.tally,
      },
      wordsRef.current,
      categoriesRef.current,
    )
    if (dealt) setGame(dealt)
  }, [])

  const quitGame = useCallback(() => {
    // 중간에 그만두더라도 여기까지 나온 제시어는 기억해 둔다
    if (gameRef.current) rememberUsedWordIds(gameRef.current.usedWordIds)
    setGame(null)
    clearLiarGameState()
  }, [])

  /** 이번 판 제시어. 제시어 관리에서 지워졌으면 저장해 둔 텍스트를 쓴다. */
  const currentWord = useMemo(
    () => (game ? (words.find((w) => w.id === game.wordId) ?? null) : null),
    [game, words],
  )

  return {
    game,
    currentWord,
    startGame,
    resumeGame,
    finishReveal,
    nextSpeaker,
    prevSpeaker,
    skipToVote,
    castVote,
    revote,
    accuse,
    continueAfterInnocent,
    judgeGuess,
    playAgain,
    quitGame,
  }
}
