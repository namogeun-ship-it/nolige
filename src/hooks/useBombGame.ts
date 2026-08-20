import { useCallback, useEffect, useRef, useState } from 'react'
import type { BombGameState, BombSettings, BombTopic, BombTopicPrefs } from '../types'
import { pickTopic, rollFuseSec } from '../lib/bomb'
import { clearBombGameState, saveBombGameState } from '../lib/storage'

/**
 * 최근에 나온 문제를 몇 판까지 기억할지.
 *
 * 답은 앱이 아니라 둘러앉은 아이들이 정하므로 같은 문제가 또 나와도 아무 문제가 없다.
 * 방금 나온 게 바로 또 나올 때의 김빠짐만 막으면 되므로 몇 판이면 충분하다.
 * 이 수를 크게 잡으면 후보가 적은 조건(어려움 초성 등)에서 오히려 고를 것이 없어진다.
 */
const TOPIC_MEMORY = 3

/** 낼 문제가 하나도 없을 때 쓰는 자리 지킴이. 설정 화면에서 막으므로 실제로는 거의 안 쓰인다 */
function emptyTopic(): BombTopic {
  return { kind: 'topic', label: '아무 낱말', answers: [] }
}

export function useBombGame(topicPrefs: BombTopicPrefs) {
  const [game, setGame] = useState<BombGameState | null>(null)

  // 문제를 뽑는 시점의 손질 상태를 봐야 해서 ref 로 들고 있는다
  const prefsRef = useRef(topicPrefs)
  prefsRef.current = topicPrefs

  // ── 저장. 1초에 한 번을 넘지 않도록 서명을 비교한다
  const lastSignature = useRef('')
  const hasStarted = useRef(false)
  useEffect(() => {
    if (!game) {
      lastSignature.current = ''
      // 아직 이 화면에서 게임을 시작한 적이 없다면 저장본을 지우지 않는다.
      // 지웠다가는 "이어서 하기"로 되살릴 게임이 사라진다.
      if (hasStarted.current) clearBombGameState()
      return
    }
    hasStarted.current = true
    const signature = [game.phase, game.round, Math.ceil(game.remainingSec)].join('|')
    if (signature === lastSignature.current) return
    lastSignature.current = signature
    saveBombGameState(game)
  }, [game])

  // ── 심지 태우기. 실제로 흐른 시간만큼 줄여서 오차가 쌓이지 않게 한다
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
        // 터졌다. 누가 들고 있었는지는 아이들이 서로 보고 안다
        return { ...prev, remainingSec: 0, phase: 'boom' }
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [game?.phase, game?.round])

  const startGame = useCallback((settings: BombSettings) => {
    const topic = pickTopic(settings, prefsRef.current, []) ?? emptyTopic()
    setGame({
      settings,
      phase: 'countdown',
      round: 1,
      topic,
      fuseSec: rollFuseSec(settings),
      remainingSec: 0,
      usedLabels: [topic.label],
    })
  }, [])

  /** 저장돼 있던 게임을 이어서 한다. 돌고 있던 중이었다면 카운트다운부터 다시 센다 */
  const resumeGame = useCallback((saved: BombGameState) => {
    setGame(saved.phase === 'playing' ? { ...saved, phase: 'countdown' } : saved)
  }, [])

  /**
   * 카운트다운이 끝나 폭탄이 돌기 시작한다.
   * 이어서 하기로 돌아온 경우에는 남아 있던 시간을 그대로 이어받는다.
   */
  const beginPlaying = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'countdown') return prev
      const remainingSec = prev.remainingSec > 0 ? prev.remainingSec : prev.fuseSec
      return { ...prev, phase: 'playing', remainingSec }
    })
  }, [])

  /** 터진 뒤 새 문제와 새 폭탄으로 다음 판을 연다 */
  const nextRound = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'boom') return prev
      const topic = pickTopic(prev.settings, prefsRef.current, prev.usedLabels) ?? emptyTopic()
      return {
        ...prev,
        phase: 'countdown',
        round: prev.round + 1,
        topic,
        fuseSec: rollFuseSec(prev.settings),
        remainingSec: 0,
        usedLabels: [...prev.usedLabels, topic.label].slice(-TOPIC_MEMORY),
      }
    })
  }, [])

  const quitGame = useCallback(() => {
    setGame(null)
    clearBombGameState()
  }, [])

  return { game, startGame, resumeGame, beginPlaying, nextRound, quitGame }
}
