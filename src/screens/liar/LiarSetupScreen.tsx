import { useMemo, useState } from 'react'
import type {
  Category,
  DifficultySetting,
  LiarSettings,
  LiarVoteMode,
  LiarWrongPick,
  SeatDirection,
  Word,
} from '../../types'
import {
  DEFAULT_LIAR_PLAYERS,
  DEFAULT_LIAR_ROUNDS,
  DEFAULT_LIAR_SPEAK_SEC,
  LIAR_MAX_PLAYERS,
  LIAR_MAX_ROUNDS,
  LIAR_MIN_PLAYERS,
  LIAR_SPEAK_PRESETS,
} from '../../lib/constants'
import { countDeckSize, filterWords } from '../../lib/wordPool'
import { Chip, Section, Stepper, Toggle } from '../../components/SettingControls'

interface Props {
  words: Word[]
  categories: Category[]
  lastSettings?: LiarSettings
  onStart: (settings: LiarSettings) => void
  onBack: () => void
}

const DIFFICULTY_OPTIONS: { value: DifficultySetting; label: string }[] = [
  { value: 1, label: '쉬움 (2~3학년)' },
  { value: 2, label: '어려움 (4~5학년)' },
  { value: 'mix', label: '섞기' },
]

const VOTE_OPTIONS: { value: LiarVoteMode; label: string; description: string }[] = [
  {
    value: 'app',
    label: '📱 앱으로 비밀 투표',
    description: '기기를 한 바퀴 돌리며 각자 몰래 한 명을 고릅니다. 누가 누구를 찍었는지는 개표할 때 함께 봅니다.',
  },
  {
    value: 'manual',
    label: '✋ 손으로 지목',
    description: '다 같이 하나 둘 셋에 손가락으로 지목하고, 가장 많이 지목된 사람만 앱에서 눌러 줍니다.',
  },
]

const WRONG_PICK_OPTIONS: { value: LiarWrongPick; label: string; description: string }[] = [
  {
    value: 'liar-wins',
    label: '바로 라이어 승리',
    description: '시민이 엉뚱한 사람을 지목하면 그대로 판이 끝나고 라이어가 이깁니다.',
  },
  {
    value: 'revote',
    label: '바로 다시 지목',
    description:
      '설명은 더 듣지 않고 그 자리에서 한 번 더 투표합니다. 기회는 판마다 한 번뿐이고, 또 틀리면 라이어가 이깁니다.',
  },
  {
    value: 'extra-round',
    label: '한 바퀴 더 기회',
    description: '설명을 한 바퀴 더 돌고 다시 투표합니다. 기회는 판마다 한 번뿐이고, 또 틀리면 라이어가 이깁니다.',
  },
]

const DIRECTION_OPTIONS: { value: SeatDirection; label: string; description: string }[] = [
  {
    value: 'clockwise',
    label: '시계 방향',
    description: '번호가 커지는 쪽으로 넘어갑니다. 5번 다음은 6번이고, 마지막 번호 다음은 1번입니다.',
  },
  {
    value: 'counter',
    label: '반시계 방향',
    description: '번호가 작아지는 쪽으로 넘어갑니다. 5번 다음은 4번이고, 1번 다음은 마지막 번호입니다.',
  },
]

const defaultPlayerName = (index: number) => `${index + 1}번`

export default function LiarSetupScreen({ words, categories, lastSettings, onStart, onBack }: Props) {
  // 주제는 지난 선택을 되살리지 않고 항상 빈 상태로 연다
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<DifficultySetting>(lastSettings?.difficulty ?? 1)
  const [playerNames, setPlayerNames] = useState<string[]>(
    () =>
      lastSettings?.playerNames ??
      Array.from({ length: DEFAULT_LIAR_PLAYERS }, (_, i) => defaultPlayerName(i)),
  )
  const [tellCategoryToLiar, setTellCategoryToLiar] = useState(
    lastSettings?.tellCategoryToLiar ?? true,
  )
  const [rounds, setRounds] = useState(lastSettings?.rounds ?? DEFAULT_LIAR_ROUNDS)
  const [speakSec, setSpeakSec] = useState(lastSettings?.speakSec ?? DEFAULT_LIAR_SPEAK_SEC)
  const [voteMode, setVoteMode] = useState<LiarVoteMode>(lastSettings?.voteMode ?? 'app')
  const [wrongPick, setWrongPick] = useState<LiarWrongPick>(lastSettings?.wrongPick ?? 'liar-wins')
  const [seatDirection, setSeatDirection] = useState<SeatDirection>(
    lastSettings?.seatDirection ?? 'clockwise',
  )

  const availableWords = useMemo(
    () => countDeckSize(words, categoryIds, difficulty),
    [words, categoryIds, difficulty],
  )

  const countInCategory = (categoryId: string) => filterWords(words, [categoryId], difficulty).length

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const allSelected = categoryIds.length === categories.length
  const toggleAll = () => setCategoryIds(allSelected ? [] : categories.map((c) => c.id))

  const setPlayerCount = (count: number) => {
    setPlayerNames((prev) => {
      const next = prev.slice(0, count)
      while (next.length < count) next.push(defaultPlayerName(next.length))
      return next
    })
  }

  const canStart = categoryIds.length > 0 && availableWords > 0

  const handleStart = () => {
    if (!canStart) return
    onStart({
      categoryIds,
      difficulty,
      playerNames: playerNames.map((n, i) => n.trim() || defaultPlayerName(i)),
      tellCategoryToLiar,
      rounds,
      speakSec,
      voteMode,
      wrongPick,
      seatDirection,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-4 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[60px] rounded-2xl bg-white px-6 text-lg font-semibold text-slate-600 shadow-sm active:scale-95"
        >
          ← 홈
        </button>
        <h1 className="text-3xl font-extrabold text-violet-600">라이어 게임 설정</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="참가자" hint={`${playerNames.length}명 · 라이어는 이 중 한 명`}>
            <div className="flex flex-wrap gap-3">
              {Array.from(
                { length: LIAR_MAX_PLAYERS - LIAR_MIN_PLAYERS + 1 },
                (_, i) => i + LIAR_MIN_PLAYERS,
              ).map((n) => (
                <Chip
                  key={n}
                  tone="violet"
                  selected={playerNames.length === n}
                  onClick={() => setPlayerCount(n)}
                >
                  {n}명
                </Chip>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {playerNames.map((name, i) => (
                <input
                  key={i}
                  value={name}
                  onChange={(e) =>
                    setPlayerNames((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
                  }
                  maxLength={12}
                  placeholder={defaultPlayerName(i)}
                  className="min-h-[60px] rounded-2xl bg-slate-50 px-5 text-lg font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-violet-400"
                />
              ))}
            </div>
          </Section>

          <Section title="말하는 순서" hint="앉은 번호를 따라 돌아요">
            <div className="flex flex-col gap-3">
              {DIRECTION_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSeatDirection(d.value)}
                  className={`rounded-2xl px-5 py-4 text-left transition-colors active:scale-[0.98] ${
                    seatDirection === d.value
                      ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="block text-lg font-bold">{d.label}</span>
                  <span
                    className={`mt-1 block text-sm ${
                      seatDirection === d.value ? 'text-violet-100' : 'text-slate-400'
                    }`}
                  >
                    {d.description}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-400">
              둘러앉은 자리대로 번호를 정해 두세요. 판마다 시작하는 사람만 무작위로 바뀌고, 그
              뒤로는 옆 사람에게 차례로 넘어갑니다. 제시어를 확인할 때도 같은 순서로 돕니다.
            </p>
          </Section>

          <Section title="주제 고르기" hint="여러 개 고를 수 있어요">
            <div className="mb-4">
              <button
                type="button"
                onClick={toggleAll}
                className="min-h-[48px] rounded-xl bg-slate-100 px-5 text-base font-semibold text-slate-600 active:scale-95"
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => {
                const count = countInCategory(c.id)
                const selected = categoryIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    disabled={count === 0}
                    className={`min-h-[60px] rounded-2xl px-5 text-lg font-semibold transition-colors active:scale-95 disabled:opacity-35 ${
                      selected
                        ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="mr-2">{c.emoji}</span>
                    {c.name}
                    <span
                      className={`ml-2 text-sm ${selected ? 'text-violet-100' : 'text-slate-400'}`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-sm text-slate-400">
              주제를 여러 개 고르면 라이어가 짐작하기 더 어려워져요.
            </p>
          </Section>

          <Section title="난이도">
            <div className="flex flex-wrap gap-3">
              {DIFFICULTY_OPTIONS.map((d) => (
                <Chip
                  key={String(d.value)}
                  tone="violet"
                  selected={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="설명 바퀴 수" hint="모두가 한 번씩 말하면 한 바퀴">
            <Stepper value={rounds} min={1} max={LIAR_MAX_ROUNDS} unit="바퀴" onChange={setRounds} />
            <p className="mt-3 text-sm text-slate-400">
              모두 합쳐 {playerNames.length * rounds}번 설명하고 투표해요. 바퀴가 늘면 라이어가
              단서를 더 얻지만, 시민도 라이어를 판단할 거리가 늘어나요.
            </p>
          </Section>

          <Section title="한 사람 설명 시간">
            <div className="flex flex-wrap gap-3">
              {LIAR_SPEAK_PRESETS.map((s) => (
                <Chip
                  key={s}
                  tone="violet"
                  selected={speakSec === s}
                  onClick={() => setSpeakSec(s)}
                >
                  {s === 0 ? '제한 없음' : `${s}초`}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-400">
              시간이 다 돼도 저절로 넘어가지는 않아요. 소리로 알려 주기만 합니다.
            </p>
          </Section>

          <Section title="라이어에게 주는 정보">
            <Toggle
              tone="violet"
              checked={tellCategoryToLiar}
              onChange={setTellCategoryToLiar}
              label="주제까지는 알려주기"
              description="라이어에게 '주제는 동물'처럼 주제만 알려줘요. 끄면 아무 단서 없이 시작해요"
            />
          </Section>

          <Section title="투표 방식">
            <div className="flex flex-col gap-3">
              {VOTE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVoteMode(v.value)}
                  className={`rounded-2xl px-5 py-4 text-left transition-colors active:scale-[0.98] ${
                    voteMode === v.value
                      ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="block text-lg font-bold">{v.label}</span>
                  <span
                    className={`mt-1 block text-sm ${
                      voteMode === v.value ? 'text-violet-100' : 'text-slate-400'
                    }`}
                  >
                    {v.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="시민이 엉뚱한 사람을 지목하면">
            <div className="flex flex-col gap-3">
              {WRONG_PICK_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWrongPick(w.value)}
                  className={`rounded-2xl px-5 py-4 text-left transition-colors active:scale-[0.98] ${
                    wrongPick === w.value
                      ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="block text-lg font-bold">{w.label}</span>
                  <span
                    className={`mt-1 block text-sm ${
                      wrongPick === w.value ? 'text-violet-100' : 'text-slate-400'
                    }`}
                  >
                    {w.description}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
        <p className="text-base text-slate-500 sm:text-lg">
          {categoryIds.length === 0 ? (
            <span className="font-semibold text-red-500">주제를 하나 이상 골라 주세요</span>
          ) : availableWords === 0 ? (
            <span className="font-semibold text-red-500">고른 조건에 맞는 제시어가 없어요</span>
          ) : (
            <>
              제시어 <span className="font-bold text-slate-800">{availableWords}개</span>
              <span className="block text-base text-slate-400">
                한 판에 한 개씩 써요. 이어서 여러 판을 해도 같은 제시어가 다시 나오지 않아요.
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="min-h-[68px] w-full shrink-0 rounded-2xl bg-violet-500 px-8 text-xl font-extrabold whitespace-nowrap text-white shadow-lg shadow-violet-200 disabled:bg-slate-300 disabled:shadow-none active:scale-95 sm:ml-auto sm:min-h-[76px] sm:w-auto sm:px-12 sm:text-2xl"
        >
          시작하기 →
        </button>
      </footer>
    </div>
  )
}
