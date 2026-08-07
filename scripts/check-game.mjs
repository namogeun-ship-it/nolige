// 한 판을 통째로 돌려 제시어가 겹치는지 본다.
// 실행: ./node_modules/.bin/jiti scripts/check-game.mjs
import { buildDeck, countDeckSize } from '../src/lib/wordPool'
import { DEFAULT_WORDS } from '../src/data/defaultWords'

/** 앱과 같은 방식으로 한 판을 진행하며 나온 제시어 순서를 돌려준다 */
function playGame({ categoryIds, difficulty, teams, rounds, wordsPerTurn }) {
  let deck = buildDeck(DEFAULT_WORDS, categoryIds, difficulty)
  let index = 0
  const used = []
  const turns = []

  for (let t = 0; t < teams * rounds; t++) {
    const turn = []
    for (let i = 0; i < wordsPerTurn; i++) {
      if (index >= deck.length) {
        deck = buildDeck(DEFAULT_WORDS, categoryIds, difficulty, used)
        index = 0
        if (deck.length === 0) break
      }
      const id = deck[index++]
      turn.push(id)
      used.push(id)
    }
    turns.push(turn)
  }
  return { turns, used }
}

function report(label, config) {
  let gamesWithDupe = 0
  let crossTeamOverlaps = 0
  const TRIALS = 500
  for (let n = 0; n < TRIALS; n++) {
    const { turns, used } = playGame(config)
    if (new Set(used).size !== used.length) gamesWithDupe++
    // 팀끼리 같은 제시어를 만났는지
    for (let a = 0; a < turns.length; a++) {
      for (let b = a + 1; b < turns.length; b++) {
        const setA = new Set(turns[a])
        if (turns[b].some((id) => setA.has(id))) crossTeamOverlaps++
      }
    }
  }
  const size = countDeckSize(DEFAULT_WORDS, config.categoryIds, config.difficulty)
  const needed = config.teams * config.rounds * config.wordsPerTurn
  console.log(`${label}`)
  console.log(`  묶음 ${size}개 / 한 판에 쓰는 양 ${needed}개`)
  console.log(`  한 판 안에 중복이 생긴 게임: ${gamesWithDupe} / ${TRIALS}판`)
  console.log(`  팀끼리 같은 제시어를 만난 횟수: ${crossTeamOverlaps}회 (500판 합계)`)
  console.log('')
}

const base = { teams: 2, rounds: 1, wordsPerTurn: 15 }
report('음식 + 쉬움, 2팀 1라운드', { ...base, categoryIds: ['food'], difficulty: 1 })
report('음식 + 쉬움, 2팀 2라운드', { ...base, rounds: 2, categoryIds: ['food'], difficulty: 1 })
report('음식 + 어려움, 2팀 2라운드', { ...base, rounds: 2, categoryIds: ['food'], difficulty: 2 })
report('음식 + 섞기, 2팀 2라운드', { ...base, rounds: 2, categoryIds: ['food'], difficulty: 'mix' })
report('4팀 2라운드, 주제 3개 섞기', {
  ...base,
  teams: 4,
  rounds: 2,
  categoryIds: ['food', 'animal', 'object'],
  difficulty: 'mix',
})

// 섞기에서 쉬움과 어려움 비율이 반반인지 (앞 30장 기준)
const easyIds = new Set(DEFAULT_WORDS.filter((w) => w.difficulty === 1).map((w) => w.id))
let easyCount = 0
const ROUNDS = 400
for (let n = 0; n < ROUNDS; n++) {
  const deck = buildDeck(DEFAULT_WORDS, ['food'], 'mix')
  easyCount += deck.slice(0, 30).filter((id) => easyIds.has(id)).length
}
console.log(`섞기 앞 30장의 쉬움 평균: ${(easyCount / ROUNDS).toFixed(1)}개 (15개면 반반)`)
