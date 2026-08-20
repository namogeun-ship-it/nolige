// 폭탄 돌리기 데이터 검사기
// 실행: ./node_modules/.bin/jiti scripts/check-bomb.mjs
//
// 이 놀이는 답을 앱이 판정하지 않는다. 답이 맞는지는 둘러앉은 사람들이 정한다.
// 그래서 여기서 보는 것은 정답 여부가 아니라 두 가지다.
//
// 1. 문제마다 답이 정말 스무 개 있는가.
//    적다가 열 개에서 막히는 문제를 내면 놀이가 성립하지 않는다.
// 2. 초성 짝에 적어 둔 답이 그 초성과 실제로 맞는가.
//    이건 첫소리를 계산해서 기계로 대조한다. 사람 눈으로는 반드시 놓친다.
import { BOMB_CHOSUNG } from '../src/data/bombChosung'
import { BOMB_TOPICS } from '../src/data/bombTopics'
import { chosungOfWord } from '../src/lib/bomb'

const problems = []

/** 문제 하나에 답이 이만큼은 있어야 한다 */
const REQUIRED_ANSWERS = 20
/** 주제 이름이 이보다 길면 화면에서 너무 작게 나온다 */
const MAX_TOPIC_LENGTH = 12

/**
 * 답 목록을 본다. 빈 목록은 "미리 적어 둘 수 없는 주제"라는 뜻이라 통과시킨다.
 * 어중간하게 몇 개만 적힌 것은 적다가 만 것이므로 걸러낸다.
 */
function checkAnswers(name, answers, allowEmpty = false) {
  if (allowEmpty && answers.length === 0) return
  if (answers.length !== REQUIRED_ANSWERS) {
    problems.push(`${name}: 답이 ${answers.length}개 (${REQUIRED_ANSWERS}개여야 함)`)
  }
  if (new Set(answers).size !== answers.length) {
    problems.push(`${name}: 답 중복`)
  }
  for (const a of answers) {
    if (a.trim().length === 0) problems.push(`${name}: 빈 답`)
    if (/[—…]/.test(a)) problems.push(`${name}: 금지 문자(줄표·말줄임표) "${a}"`)
  }
}

const seenPair = new Set()
for (const c of BOMB_CHOSUNG) {
  if (seenPair.has(c.pair)) problems.push(`초성 짝 중복: ${c.pair}`)
  seenPair.add(c.pair)
  if ([...c.pair].length !== 2) problems.push(`초성 짝은 두 글자여야 함: ${c.pair}`)

  checkAnswers(`초성 ${c.pair}`, c.answers)

  for (const word of c.answers) {
    if ([...word].length !== 2) {
      problems.push(`초성 ${c.pair}: 두 글자가 아님 "${word}"`)
      continue
    }
    const actual = chosungOfWord(word)
    if (actual !== c.pair) {
      problems.push(`초성 ${c.pair}: "${word}" 의 첫소리는 ${actual}`)
    }
  }
}

const seenLabel = new Set()
for (const t of BOMB_TOPICS) {
  if (seenLabel.has(t.label)) problems.push(`주제 중복: ${t.label}`)
  seenLabel.add(t.label)
  if ([...t.label].length > MAX_TOPIC_LENGTH) {
    problems.push(`주제가 너무 김(${[...t.label].length}자): ${t.label}`)
  }
  if (/[—…]/.test(t.label)) problems.push(`주제에 금지 문자: ${t.label}`)
  checkAnswers(`주제 ${t.label}`, t.answers, true)
}

const chosungAnswers = BOMB_CHOSUNG.reduce((sum, c) => sum + c.answers.length, 0)
const topicAnswers = BOMB_TOPICS.reduce((sum, t) => sum + t.answers.length, 0)
const noHint = BOMB_TOPICS.filter((t) => t.answers.length === 0)
console.log(`초성 ${BOMB_CHOSUNG.length}짝 · 주제 ${BOMB_TOPICS.length}개 = 문제 ${BOMB_CHOSUNG.length + BOMB_TOPICS.length}개`)
console.log(`적어 둔 답 ${chosungAnswers + topicAnswers}개 (초성 ${chosungAnswers} · 주제 ${topicAnswers})`)
console.log(`힌트 없는 주제 ${noHint.length}개: ${noHint.map((t) => t.label).join(', ')}`)

if (problems.length > 0) {
  console.error(`\n문제 ${problems.length}건`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log('\n이상 없음')
