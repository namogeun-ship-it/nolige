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
