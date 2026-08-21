import type { BombGameState, BombSettings, BombTopic, BombTopicPrefs } from '../types'
import { BOMB_CHOSUNG } from '../data/bombChosung'
import { BOMB_TOPICS } from '../data/bombTopics'
import { BOMB_HURRY_RATIO, BOMB_JITTER_SEC } from './constants'

/** 한글 첫소리 19개. 유니코드에 실려 있는 순서 그대로다 */
const CHOSUNG_TABLE = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

const HANGUL_FIRST = 0xac00
const HANGUL_LAST = 0xd7a3
/** 첫소리 하나가 차지하는 글자 수 (가운뎃소리 21 × 끝소리 28) */
const PER_CHOSUNG = 588

/** 글자 하나의 첫소리를 돌려준다. 한글이 아니면 null */
export function chosungOf(char: string): string | null {
  const code = char.charCodeAt(0)
  if (code < HANGUL_FIRST || code > HANGUL_LAST) return null
  return CHOSUNG_TABLE[Math.floor((code - HANGUL_FIRST) / PER_CHOSUNG)]
}

/** 낱말의 첫소리를 이어 붙인다. '사과' → 'ㅅㄱ' */
export function chosungOfWord(word: string): string {
  return [...word.replace(/\s/g, '')].map((c) => chosungOf(c) ?? c).join('')
}

/** 초성을 화면에 보여줄 때는 사이를 띄운다. 'ㄱㅅ' → 'ㄱ ㅅ' */
export function spacedChosung(label: string): string {
  return [...label].join(' ')
}

/**
 * 지금 쓸 수 있는 주제 목록.
 * 꺼 둔 것은 빼고, 작가가 직접 넣은 것을 더한다.
 * 직접 넣은 주제는 답을 미리 적어 둘 수 없으므로 힌트가 나오지 않는다.
 */
function activeTopics(prefs: BombTopicPrefs): BombTopic[] {
  const off = new Set(prefs.disabledLabels)
  const list: BombTopic[] = []
  for (const t of BOMB_TOPICS) {
    if (!off.has(t.label)) list.push({ kind: 'topic', label: t.label, answers: t.answers })
  }
  for (const label of prefs.customLabels) {
    if (!off.has(label)) list.push({ kind: 'topic', label, answers: [] })
  }
  return list
}

/**
 * 고른 종류에 해당하는 문제 후보를 전부 모은다.
 * 난이도로 걸러내지 않는다. 난이도는 힌트를 보여 줄지 말지로만 갈리기 때문이다.
 */
function buildTopicPool(settings: BombSettings, prefs: BombTopicPrefs): BombTopic[] {
  const pool: BombTopic[] = []
  if (settings.topicKind === 'chosung' || settings.topicKind === 'mix') {
    for (const c of BOMB_CHOSUNG) {
      pool.push({ kind: 'chosung', label: c.pair, answers: c.answers })
    }
  }
  if (settings.topicKind === 'topic' || settings.topicKind === 'mix') {
    pool.push(...activeTopics(prefs))
  }
  return pool
}

/** 이 설정으로 낼 수 있는 문제가 몇 개인지. 설정 화면에서 보여준다 */
export function countTopics(settings: BombSettings, prefs: BombTopicPrefs): number {
  return buildTopicPool(settings, prefs).length
}

/**
 * 다음 문제를 하나 뽑는다.
 * 최근에 나온 문제는 건너뛰고, 후보를 다 쓰면 그때 처음부터 다시 쓴다.
 */
export function pickTopic(
  settings: BombSettings,
  prefs: BombTopicPrefs,
  usedLabels: string[],
): BombTopic | null {
  const pool = buildTopicPool(settings, prefs)
  if (pool.length === 0) return null
  const used = new Set(usedLabels)
  const fresh = pool.filter((t) => !used.has(t.label))
  const from = fresh.length > 0 ? fresh : pool
  return from[Math.floor(Math.random() * from.length)]
}

/**
 * 이번 판 폭탄이 터지기까지의 시간을 정한다.
 * 판마다 다시 뽑으므로 앞판이 길었다고 이번 판도 길지는 않다.
 */
export function rollFuseSec(settings: BombSettings): number {
  const drift = (Math.random() * 2 - 1) * BOMB_JITTER_SEC
  return Math.max(5, settings.baseSec + drift)
}

/** 이번 설정에서 가장 늦게 터질 수 있는 시각(초) */
function longestFuseSec(settings: BombSettings): number {
  return settings.baseSec + BOMB_JITTER_SEC
}

/**
 * 심지가 얼마나 남았는지 (1 = 그대로, 0 = 불꽃이 폭탄에 닿음).
 *
 * 이번 판의 실제 길이가 아니라 **설정에서 고른 가장 긴 시간**을 기준으로 잰다.
 * 실제 길이로 재면 남은 시간이 화면에 그대로 드러나서, 언제 터질지 모른다는
 * 이 놀이의 전부가 사라지기 때문이다.
 *
 * 그래서 짧은 폭탄이 걸린 판은 심지가 아직 절반이나 남았는데 터진다.
 * 심지는 시간이 흐르고 있다는 것만 보여 줄 뿐, 얼마나 남았는지는 알려 주지 않는다.
 */
export function fuseLeftRatio(state: BombGameState): number {
  const longest = Math.max(1, longestFuseSec(state.settings))
  const elapsed = state.fuseSec - state.remainingSec
  return Math.max(0, Math.min(1, 1 - elapsed / longest))
}

/** 터지기 직전이라 째깍 소리를 빠르게 할 구간인지 */
export function isHurrying(state: BombGameState): boolean {
  if (!state.settings.hurryUp || state.fuseSec <= 0) return false
  return state.remainingSec / state.fuseSec <= BOMB_HURRY_RATIO
}

/** 문제 아래에 붙는 한 줄 안내 */
export function topicPrompt(topic: BombTopic): string {
  return topic.kind === 'chosung' ? '이 초성으로 두 글자 낱말!' : '하나씩 대세요!'
}
