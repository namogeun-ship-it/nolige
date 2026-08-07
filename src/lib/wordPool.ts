import type { DifficultySetting, Word } from '../types'

/** 어려움만 골랐을 때 숨 돌릴 수 있게 섞어 넣는 쉬움 제시어 개수 */
export const EASY_MIX_IN_HARD = 5

/** 선택한 주제와 난이도에 해당하는 제시어만 걸러낸다. */
export function filterWords(
  words: Word[],
  categoryIds: string[],
  difficulty: DifficultySetting,
): Word[] {
  const wanted = new Set(categoryIds)
  return words.filter(
    (w) => wanted.has(w.categoryId) && (difficulty === 'mix' || w.difficulty === difficulty),
  )
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/** 두 묶음을 반반 비율로 번갈아 뽑아 하나로 합친다. 앞쪽일수록 비율이 정확하다. */
function blendHalfAndHalf(a: string[], b: string[]): string[] {
  const out: string[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (Math.random() < 0.5) out.push(a[i++])
    else out.push(b[j++])
  }
  return [...out, ...a.slice(i), ...b.slice(j)]
}

/**
 * 이름이 같은 제시어는 하나만 남긴다.
 * 두 주제에 같은 이름이 들어 있거나 사용자가 같은 이름을 또 만들었을 때,
 * 한 판에서 같은 말이 두 번 나오는 것을 막는다.
 */
function dropSameNamed(deck: string[], words: Word[]): string[] {
  const nameOf = new Map(words.map((w) => [w.id, w.text.replace(/\s/g, '')]))
  const taken = new Set<string>()
  return deck.filter((id) => {
    const name = nameOf.get(id)
    if (name === undefined || taken.has(name)) return false
    taken.add(name)
    return true
  })
}

/**
 * 아직 안 나온 제시어를 앞으로 보낸다.
 * 전부 나온 적이 있다면 가장 오래전에 나온 것부터 앞에 세운다.
 * usedWordIds는 앞쪽일수록 오래된 순서로 들어온다.
 */
function freshFirst(deck: string[], usedWordIds: string[]): string[] {
  if (usedWordIds.length === 0) return deck
  const lastSeenAt = new Map<string, number>()
  usedWordIds.forEach((id, i) => lastSeenAt.set(id, i))

  const fresh: string[] = []
  const seen: string[] = []
  for (const id of deck) (lastSeenAt.has(id) ? seen : fresh).push(id)
  seen.sort((a, b) => (lastSeenAt.get(a) ?? 0) - (lastSeenAt.get(b) ?? 0))
  return [...fresh, ...seen]
}

/**
 * 한 판에 쓸 제시어 묶음을 만든다. 조건에 맞는 제시어를 전부 가져와 섞으므로,
 * 묶음 길이만큼은 같은 제시어가 두 번 나오지 않는다.
 *
 * - 쉬움: 쉬움 제시어 전부
 * - 어려움: 어려움 제시어 전부에 쉬움 몇 개를 섞어 넣는다
 * - 섞기: 쉬움과 어려움을 반반 비율로 번갈아 뽑는다
 */
export function buildDeck(
  words: Word[],
  categoryIds: string[],
  difficulty: DifficultySetting,
  usedWordIds: string[] = [],
): string[] {
  const easy = filterWords(words, categoryIds, 1).map((w) => w.id)
  const hard = filterWords(words, categoryIds, 2).map((w) => w.id)

  let deck: string[]
  if (difficulty === 1) {
    deck = shuffle(easy)
  } else if (difficulty === 2) {
    deck = shuffle([...hard, ...shuffle(easy).slice(0, EASY_MIX_IN_HARD)])
  } else {
    deck = blendHalfAndHalf(shuffle(easy), shuffle(hard))
  }
  return freshFirst(dropSameNamed(deck, words), usedWordIds)
}

/** 이 조건으로 한 판에 낼 수 있는 제시어가 몇 개인지. 설정 화면에서 보여준다. */
export function countDeckSize(
  words: Word[],
  categoryIds: string[],
  difficulty: DifficultySetting,
): number {
  const countNames = (list: Word[]) => new Set(list.map((w) => w.text.replace(/\s/g, ''))).size
  const easy = filterWords(words, categoryIds, 1)
  const hard = filterWords(words, categoryIds, 2)
  if (difficulty === 1) return countNames(easy)
  if (difficulty === 2) return countNames([...hard, ...easy.slice(0, EASY_MIX_IN_HARD)])
  return countNames([...easy, ...hard])
}
