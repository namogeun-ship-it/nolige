import type { LiarGameState } from '../types'

/**
 * 이름 뒤에 '이에요'와 '예요' 중 맞는 쪽을 붙인다.
 * 받침이 있으면 '이에요', 없으면 '예요'다. (가은이에요 / 미주예요)
 */
export function isMeLabel(name: string): string {
  const last = name.trim().slice(-1)
  const code = last.charCodeAt(0)
  const isHangul = code >= 0xac00 && code <= 0xd7a3
  const hasFinalConsonant = isHangul && (code - 0xac00) % 28 !== 0
  return `${name}${hasFinalConsonant ? '이에요' : '예요'}`
}

/** 0부터 count-1까지의 번호를 섞어서 돌려준다. 설명 순서와 라이어 뽑기에 쓴다. */
export function shuffledOrder(count: number): number[] {
  const out = Array.from({ length: count }, (_, i) => i)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/** 참가자 중 한 명을 라이어로 뽑는다. */
export function pickLiarIndex(count: number): number {
  return Math.floor(Math.random() * count)
}

/** 지금 설명할 차례인 사람의 번호 */
export function currentSpeaker(state: LiarGameState): number {
  return state.order[state.speakAt] ?? 0
}

/** 지금 투표할 차례인 사람의 번호 */
export function currentVoter(state: LiarGameState): number {
  return state.order[state.voteAt] ?? 0
}

/** 이 판에서 돌아야 하는 바퀴 수. 엉뚱한 사람을 지목해서 한 바퀴를 더 얻었으면 그만큼 늘어난다. */
export function totalRounds(state: LiarGameState): number {
  return state.settings.rounds + (state.extraRoundUsed ? 1 : 0)
}

/** 이 판에서 설명해야 하는 전체 횟수 (사람 수 × 바퀴 수) */
export function totalSpeeches(state: LiarGameState): number {
  return state.order.length * totalRounds(state)
}

/** 지금까지 몇 번째 설명인지 (1부터). 화면에 진행 정도를 보여주는 데 쓴다. */
export function speechNumber(state: LiarGameState): number {
  return (state.round - 1) * state.order.length + state.speakAt + 1
}

export interface VoteCount {
  index: number
  votes: number
}

/** 득표수를 많은 순으로 센다. 아무도 지목하지 않은 사람도 0표로 들어간다. */
export function countVotes(state: LiarGameState): VoteCount[] {
  const rows = state.settings.playerNames.map((_, index) => ({ index, votes: 0 }))
  for (const target of state.votes) {
    if (target !== null && rows[target]) rows[target].votes += 1
  }
  return [...rows].sort((a, b) => (b.votes !== a.votes ? b.votes - a.votes : a.index - b.index))
}

/** 최다 득표자 목록. 두 명 이상이면 동점이라 바로 지목할 수 없다. */
export function topVoted(state: LiarGameState): VoteCount[] {
  const rows = countVotes(state)
  const top = rows[0]?.votes ?? 0
  if (top === 0) return []
  return rows.filter((r) => r.votes === top)
}
