import type { GameState, TurnRecord } from '../types'

export function countCorrect(turn: TurnRecord): number {
  return turn.entries.filter((e) => e.result === 'correct').length
}

export function countPass(turn: TurnRecord): number {
  return turn.entries.filter((e) => e.result === 'pass').length
}

/** 이 게임에 참여하는 팀 또는 사람의 이름 목록 */
export function performerNames(state: GameState): string[] {
  return state.settings.mode === 'team' ? state.settings.teamNames : state.settings.playerNames
}

/** 지금 설명할 차례인 사람의 번호 */
export function currentPerformerIndex(state: GameState): number {
  return state.turns[state.turnIndex]?.performerIndex ?? 0
}

// ─────────────────────────────────────────────
// 팀 대항전
// ─────────────────────────────────────────────

/** 팀전의 전체 차례 수. 팀 수 × 라운드 수 */
export function totalTurns(state: GameState): number {
  return state.settings.mode === 'team'
    ? state.settings.teamNames.length * state.settings.roundsPerTeam
    : 0
}

export interface Standing {
  index: number
  name: string
  correct: number
  passed: number
  /** 공동 순위를 포함한 등수. 1부터 시작 */
  rank: number
}

/** 팀별 순위표. 맞힌 개수가 많은 순, 같으면 공동 순위로 묶는다. */
export function standings(state: GameState): Standing[] {
  const names = performerNames(state)
  const rows = names.map((name, index) => {
    const mine = state.turns.filter((t) => t.performerIndex === index)
    return {
      index,
      name,
      correct: mine.reduce((sum, t) => sum + countCorrect(t), 0),
      passed: mine.reduce((sum, t) => sum + countPass(t), 0),
      rank: 1,
    }
  })

  rows.sort((a, b) => (b.correct !== a.correct ? b.correct - a.correct : a.index - b.index))
  rows.forEach((row, i) => {
    row.rank = i === 0 ? 1 : rows[i - 1].correct === row.correct ? rows[i - 1].rank : i + 1
  })
  return rows
}

// ─────────────────────────────────────────────
// 릴레이전 (협동 단체전)
// ─────────────────────────────────────────────

/** 팀 전체가 맞혀야 하는 제시어 개수 */
export function relayGoal(state: GameState): number {
  if (state.settings.mode !== 'relay') return 0
  return state.settings.playerNames.length * state.settings.wordsPerPlayer
}

/** 지금까지 팀 전체가 맞힌 개수 */
export function relayCorrectTotal(state: GameState): number {
  return state.turns.reduce((sum, t) => sum + countCorrect(t), 0)
}

/** 팀 전체가 지금까지 쓴 패스 횟수. 릴레이전의 패스는 팀 공용이다. */
export function relayPassTotal(state: GameState): number {
  return state.turns.reduce((sum, t) => sum + countPass(t), 0)
}

/** 이 사람이 아직 맞혀야 하는 개수 */
export function quotaLeft(state: GameState, playerIndex: number): number {
  if (state.settings.mode !== 'relay') return 0
  const done = state.turns
    .filter((t) => t.performerIndex === playerIndex)
    .reduce((sum, t) => sum + countCorrect(t), 0)
  return Math.max(0, state.settings.wordsPerPlayer - done)
}

/** 전원이 자기 몫을 다 채웠는지 */
export function relayCleared(state: GameState): boolean {
  if (state.settings.mode !== 'relay') return false
  return state.settings.playerNames.every((_, i) => quotaLeft(state, i) === 0)
}

/**
 * 다음에 설명할 사람을 찾는다. 지금 사람 다음 순서부터 돌면서
 * 아직 몫이 남은 첫 번째 사람을 고른다. 아무도 없으면 null(= 통과).
 */
export function nextPerformerIndex(state: GameState, afterIndex: number): number | null {
  if (state.settings.mode !== 'relay') return null
  const count = state.settings.playerNames.length
  for (let step = 1; step <= count; step++) {
    const candidate = (afterIndex + step) % count
    if (quotaLeft(state, candidate) > 0) return candidate
  }
  return null
}

// ─────────────────────────────────────────────
// 공통
// ─────────────────────────────────────────────

/**
 * 초를 읽기 좋은 형태로.
 * 1분 미만은 소수점 없이, 그 이상은 분과 초로 나눠 보여준다.
 */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  if (sec < 60) return `${sec}초`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s === 0 ? `${m}분` : `${m}분 ${s}초`
}
