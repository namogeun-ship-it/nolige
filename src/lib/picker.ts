/** 후보 중에서 정해진 수만큼 겹치지 않게 뽑는다. */
export function pickRandom<T>(pool: T[], count: number): T[] {
  const rest = [...pool]
  const out: T[] = []
  for (let i = 0; i < count && rest.length > 0; i++) {
    out.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0])
  }
  return out
}

/** 술래 정하기에서 한 번에 뽑을 수 있는 최대 인원 */
export const MAX_PICK = 3

/** 이름으로 뽑을 때 넣을 수 있는 최대 인원 */
export const MAX_PICKER_NAMES = 12

/** 술래를 뽑을지, 팀을 나눌지 */
export type PickerPurpose = 'pick' | 'team'

export const MIN_TEAM_COUNT = 2
export const MAX_TEAM_COUNT = 4

/** 팀 이름과 색. 몸으로 말해요의 기본 팀 이름과 순서를 맞춘다. */
export const TEAMS = [
  { name: '빨강 팀', short: '빨강', color: 'var(--color-red-500)' },
  { name: '파랑 팀', short: '파랑', color: 'var(--color-sky-500)' },
  { name: '노랑 팀', short: '노랑', color: 'var(--color-amber-400)' },
  { name: '초록 팀', short: '초록', color: 'var(--color-green-500)' },
]

/**
 * 사람을 섞어서 팀 수만큼 나눈다.
 * 한 명씩 돌아가며 넣으므로 팀 사이 인원 차이는 한 명을 넘지 않는다.
 * 8명을 두 팀으로 나누면 4대4가 된다.
 */
export function splitTeams<T>(items: T[], teamCount: number): T[][] {
  const shuffled = pickRandom(items, items.length)
  const teams: T[][] = Array.from({ length: teamCount }, () => [])
  shuffled.forEach((item, i) => teams[i % teamCount].push(item))
  return teams
}
