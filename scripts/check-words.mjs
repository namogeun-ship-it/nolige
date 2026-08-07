// 기본 제시어 데이터 검사기
// 실행: ./node_modules/.bin/jiti scripts/check-words.mjs
import { DEFAULT_WORDS, DEFAULT_CATEGORIES } from '../src/data/defaultWords'

const problems = []
const byCategory = new Map()

for (const w of DEFAULT_WORDS) {
  const list = byCategory.get(w.categoryId) ?? []
  list.push(w)
  byCategory.set(w.categoryId, list)

  if (w.hints.length < 2 || w.hints.length > 3) {
    problems.push(`힌트 개수(${w.hints.length}): ${w.categoryId} / ${w.text}`)
  }
  // 힌트에 제시어의 두 글자 조각이 들어갔는지 (띄어쓰기 무시)
  const bare = w.text.replace(/\s/g, '')
  const chunks = bare.length < 2 ? [bare] : Array.from({ length: bare.length - 1 }, (_, i) => bare.slice(i, i + 2))
  for (const h of w.hints) {
    const flat = h.replace(/\s/g, '')
    const hit = chunks.find((c) => flat.includes(c))
    if (hit) problems.push(`힌트에 정답 노출 [${hit}]: ${w.categoryId} / ${w.text} → "${h}"`)
  }
  if (/[—…]/.test(w.text) || w.hints.some((h) => /[—…]/.test(h))) {
    problems.push(`금지 문자(줄표·말줄임표): ${w.categoryId} / ${w.text}`)
  }
}

const seenText = new Map()
for (const w of DEFAULT_WORDS) {
  const key = w.text.replace(/\s/g, '')
  if (seenText.has(key)) problems.push(`제시어 중복: ${w.text} (${seenText.get(key)} ↔ ${w.categoryId})`)
  else seenText.set(key, w.categoryId)
}

const ids = new Set()
for (const w of DEFAULT_WORDS) {
  if (ids.has(w.id)) problems.push(`id 중복: ${w.id}`)
  ids.add(w.id)
}

const catIds = new Set(DEFAULT_CATEGORIES.map((c) => c.id))
for (const w of DEFAULT_WORDS) {
  if (!catIds.has(w.categoryId)) problems.push(`없는 주제: ${w.categoryId}`)
}

console.log(`주제 ${DEFAULT_CATEGORIES.length}개 / 제시어 ${DEFAULT_WORDS.length}개\n`)
console.log('주제         쉬움   어려움   합계')
let totalEasy = 0
let totalHard = 0
for (const c of DEFAULT_CATEGORIES) {
  const list = byCategory.get(c.id) ?? []
  const easy = list.filter((w) => w.difficulty === 1).length
  const hard = list.filter((w) => w.difficulty === 2).length
  totalEasy += easy
  totalHard += hard
  const mark = easy >= 60 && hard >= 40 ? '' : '  ← 목표 미달'
  console.log(`${(c.name + '            ').slice(0, 12)} ${String(easy).padStart(4)} ${String(hard).padStart(6)} ${String(easy + hard).padStart(6)}${mark}`)
}
console.log(`${'합계        '.slice(0, 12)} ${String(totalEasy).padStart(4)} ${String(totalHard).padStart(6)} ${String(totalEasy + totalHard).padStart(6)}`)

console.log(`\n힌트 총 ${DEFAULT_WORDS.reduce((s, w) => s + w.hints.length, 0)}개`)
if (problems.length === 0) {
  console.log('✅ 문제 없음')
} else {
  console.log(`\n❌ 문제 ${problems.length}건`)
  problems.slice(0, 60).forEach((p) => console.log('  - ' + p))
  if (problems.length > 60) console.log(`  ... 외 ${problems.length - 60}건`)
  process.exitCode = 1
}
