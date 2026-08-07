// 주제 파일 하나만 검사한다.
// 실행: ./node_modules/.bin/jiti scripts/check-one.mjs animal
const id = process.argv[2]
if (!id) {
  console.log('사용법: jiti scripts/check-one.mjs <주제id>')
  process.exit(1)
}

const seeds = (await import(`../src/data/words/${id}`)).default
const problems = []
const seen = new Map()

for (const level of [1, 2]) {
  const list = seeds[level] ?? []
  list.forEach(([text, ...hints], i) => {
    if (hints.length < 2 || hints.length > 3) problems.push(`힌트 개수(${hints.length}): ${text}`)
    const bare = text.replace(/\s/g, '')
    const chunks =
      bare.length < 2 ? [bare] : Array.from({ length: bare.length - 1 }, (_, k) => bare.slice(k, k + 2))
    for (const h of hints) {
      const flat = h.replace(/\s/g, '')
      const hit = chunks.find((c) => flat.includes(c))
      if (hit) problems.push(`정답 노출 [${hit}]: ${text} → "${h}"`)
      if (/[—…]/.test(h)) problems.push(`금지 문자: ${text} → "${h}"`)
    }
    const key = bare
    if (seen.has(key)) problems.push(`중복 제시어: ${text} (난이도 ${seen.get(key)}, ${level})`)
    else seen.set(key, level)
    if (i === 0 && level === 1) void 0
  })
}

const easy = (seeds[1] ?? []).length
const hard = (seeds[2] ?? []).length
console.log(`${id}: 쉬움 ${easy} / 어려움 ${hard} / 합계 ${easy + hard}`)
if (problems.length === 0) {
  console.log('✅ 문제 없음')
} else {
  console.log(`❌ 문제 ${problems.length}건`)
  problems.forEach((p) => console.log('  - ' + p))
  process.exitCode = 1
}
