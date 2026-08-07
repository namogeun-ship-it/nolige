import type { Difficulty } from '../../types'

/** [제시어, 힌트...]. 힌트에는 제시어 글자를 넣지 않는다. */
export type Seed = [string, ...string[]]

/** 한 주제의 난이도별 제시어 묶음. 1=쉬움, 2=어려움 */
export type CategorySeeds = Record<Difficulty, Seed[]>
