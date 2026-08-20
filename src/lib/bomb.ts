import type { BombGameState, BombSettings, BombTopic } from '../types'
import { BOMB_CHOSUNG } from '../data/bombChosung'
import { BOMB_TOPICS } from '../data/bombTopics'
import { BOMB_HURRY_RATIO } from './constants'

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
 * 고른 종류에 해당하는 문제 후보를 전부 모은다.
 * 난이도로 걸러내지 않는다. 난이도는 힌트를 보여 줄지 말지로만 갈리기 때문이다.
 */
function buildTopicPool(settings: BombSettings): BombTopic[] {
  const pool: BombTopic[] = []
  if (settings.topicKind === 'chosung' || settings.topicKind === 'mix') {
    for (const c of BOMB_CHOSUNG) {
      pool.push({ kind: 'chosung', label: c.pair, answers: c.answers })
    }
  }
  if (settings.topicKind === 'topic' || settings.topicKind === 'mix') {
    for (const t of BOMB_TOPICS) {
      pool.push({ kind: 'topic', label: t.label, answers: t.answers })
    }
  }
  return pool
}

/** 이 설정으로 낼 수 있는 문제가 몇 개인지. 설정 화면에서 보여준다 */
export function countTopics(settings: BombSettings): number {
  return buildTopicPool(settings).length
}

/**
 * 다음 문제를 하나 뽑는다.
 * 최근에 나온 문제는 건너뛰고, 후보를 다 쓰면 그때 처음부터 다시 쓴다.
 */
export function pickTopic(settings: BombSettings, usedLabels: string[]): BombTopic | null {
  const pool = buildTopicPool(settings)
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
  const lo = Math.min(settings.minSec, settings.maxSec)
  const hi = Math.max(settings.minSec, settings.maxSec)
  return lo + Math.random() * (hi - lo)
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
