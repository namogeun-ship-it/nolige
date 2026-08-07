// 같은 날 연달아 여러 판을 했을 때 앞판 제시어가 다시 나오는지 본다.
// 실행: ./node_modules/.bin/jiti scripts/check-repeat-games.mjs
const store = new Map()
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
}

const { buildDeck, countDeckSize } = await import('../src/lib/wordPool')
const { DEFAULT_WORDS } = await import('../src/data/defaultWords')
const { loadRecentWordIds, rememberUsedWordIds } = await import('../src/lib/storage')

/** 앱과 같은 방식으로 한 판을 진행한다 */
function playGame({ categoryIds, difficulty, teams, rounds, wordsPerTurn }) {
  let deck = buildDeck(DEFAULT_WORDS, categoryIds, difficulty, loadRecentWordIds())
  let index = 0
  const used = []
  for (let t = 0; t < teams * rounds; t++) {
    for (let i = 0; i < wordsPerTurn; i++) {
      if (index >= deck.length) {
        deck = buildDeck(DEFAULT_WORDS, categoryIds, difficulty, [...loadRecentWordIds(), ...used])
        index = 0
        if (deck.length === 0) break
      }
      used.push(deck[index++])
    }
  }
  rememberUsedWordIds(used)
  return used
}

function report(label, config, gameCount) {
  store.clear()
  const games = []
  for (let g = 0; g < gameCount; g++) games.push(playGame(config))

  const size = countDeckSize(DEFAULT_WORDS, config.categoryIds, config.difficulty)
  const perGame = config.teams * config.rounds * config.wordsPerTurn
  console.log(`${label}`)
  console.log(`  묶음 ${size}개 / 한 판에 ${perGame}개 사용 / ${gameCount}판 연속`)
  games.forEach((g, i) => {
    const inside = g.length - new Set(g).size
    const before = new Set(games.slice(0, i).flat())
    const repeated = g.filter((id) => before.has(id)).length
    console.log(
      `  ${i + 1}판: 판 안 중복 ${inside}개 / 앞판들과 겹친 제시어 ${repeated}개`,
    )
  })
  console.log('')
}

const base = { teams: 2, rounds: 2, wordsPerTurn: 15 }
report('음식 + 쉬움 (묶음 60), 2팀 2라운드', { ...base, categoryIds: ['food'], difficulty: 1 }, 3)
report('음식 + 어려움, 2팀 2라운드', { ...base, categoryIds: ['food'], difficulty: 2 }, 3)
report('음식 + 섞기, 2팀 2라운드', { ...base, categoryIds: ['food'], difficulty: 'mix' }, 4)
report(
  '주제 3개 + 섞기, 4팀 2라운드',
  { ...base, teams: 4, categoryIds: ['food', 'animal', 'object'], difficulty: 'mix' },
  3,
)
