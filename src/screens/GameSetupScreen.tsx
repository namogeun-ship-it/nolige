import { useMemo, useState } from 'react'
import type {
  Category,
  DifficultySetting,
  ExplainRule,
  GameMode,
  GameSettings,
  PassLimit,
  RelayGameSettings,
  TeamGameSettings,
  Word,
} from '../types'
import {
  DEFAULT_RELAY_TIME_LIMIT,
  DEFAULT_ROUNDS_PER_TEAM,
  DEFAULT_TEAM_NAMES,
  DEFAULT_TIME_LIMIT,
  DEFAULT_WORDS_PER_PLAYER,
  MAX_PLAYERS,
  MAX_TEAMS,
  MIN_PLAYERS,
  MIN_TEAMS,
  RELAY_TIME_PRESETS,
  TIME_PRESETS,
} from '../lib/constants'
import { formatDuration } from '../lib/score'
import { countDeckSize, filterWords } from '../lib/wordPool'
import { Chip, Section, Stepper, Toggle } from '../components/SettingControls'

interface Props {
  mode: GameMode
  words: Word[]
  categories: Category[]
  lastTeamSettings?: TeamGameSettings
  lastRelaySettings?: RelayGameSettings
  onStart: (settings: GameSettings) => void
  onBack: () => void
}

const DIFFICULTY_OPTIONS: { value: DifficultySetting; label: string }[] = [
  { value: 1, label: '쉬움 (2~3학년)' },
  { value: 2, label: '어려움 (4~5학년)' },
  { value: 'mix', label: '섞기' },
]

/** 팀 대항전에서 한 차례에 제시어가 몇 개쯤 나가는지. 맞힘 10개에 패스 5회를 잡은 값이다. */
const TEAM_WORDS_PER_TURN = 15

const PASS_OPTIONS: { value: PassLimit; label: string }[] = [
  { value: 0, label: '없음' },
  { value: 1, label: '1번' },
  { value: 2, label: '2번' },
  { value: 3, label: '3번' },
  { value: 'unlimited', label: '무제한' },
]

const defaultPlayerName = (index: number) => `${index + 1}번`

export default function GameSetupScreen({
  mode,
  words,
  categories,
  lastTeamSettings,
  lastRelaySettings,
  onStart,
  onBack,
}: Props) {
  const isTeam = mode === 'team'
  const saved = isTeam ? lastTeamSettings : lastRelaySettings

  // ── 두 모드가 함께 쓰는 설정
  const [categoryIds, setCategoryIds] = useState<string[]>(
    () =>
      saved?.categoryIds.filter((id) => categories.some((c) => c.id === id)) ??
      categories.map((c) => c.id),
  )
  // 난이도가 3단계이던 시절에 저장된 값이 남아 있을 수 있다
  const [difficulty, setDifficulty] = useState<DifficultySetting>(() => {
    const last = saved?.difficulty
    if (last === 'mix' || last === 1 || last === 2) return last
    return last === undefined ? 1 : 2
  })
  const [explainRule, setExplainRule] = useState<ExplainRule>(saved?.explainRule ?? 'speech-allowed')
  // 팀전은 한 팀이 쓰는 시간, 릴레이전은 팀 전체가 나눠 쓰는 시간이라 선택지가 다르다
  const timePresets: readonly number[] = isTeam ? TIME_PRESETS : RELAY_TIME_PRESETS
  const defaultTime = isTeam ? DEFAULT_TIME_LIMIT : DEFAULT_RELAY_TIME_LIMIT
  // 릴레이전이 1인당 시간이던 시절에 저장된 짧은 값은 전체 시간으로 쓰기엔 너무 짧다
  const savedTime =
    saved?.timeLimitSec && (isTeam || saved.timeLimitSec >= 60) ? saved.timeLimitSec : defaultTime
  const [timeLimitSec, setTimeLimitSec] = useState(savedTime)
  const [customTime, setCustomTime] = useState(() => !timePresets.includes(savedTime))
  const [passLimit, setPassLimit] = useState<PassLimit>(saved?.passLimit ?? 2)
  const [hintsEnabled, setHintsEnabled] = useState(saved?.hintsEnabled ?? true)

  // ── 팀 대항전 전용
  const [teamNames, setTeamNames] = useState<string[]>(
    lastTeamSettings?.teamNames ?? DEFAULT_TEAM_NAMES.slice(0, 2),
  )
  const [roundsPerTeam, setRoundsPerTeam] = useState(
    lastTeamSettings?.roundsPerTeam ?? DEFAULT_ROUNDS_PER_TEAM,
  )

  // ── 릴레이전 전용
  const [playerNames, setPlayerNames] = useState<string[]>(
    () => lastRelaySettings?.playerNames ?? [0, 1, 2, 3].map(defaultPlayerName),
  )
  const [wordsPerPlayer, setWordsPerPlayer] = useState(
    lastRelaySettings?.wordsPerPlayer ?? DEFAULT_WORDS_PER_PLAYER,
  )

  const availableWords = useMemo(
    () => countDeckSize(words, categoryIds, difficulty),
    [words, categoryIds, difficulty],
  )

  // 이 설정으로 한 판에 필요한 제시어 수. 이보다 묶음이 크면 한 판 안에서 절대 겹치지 않는다
  const passAllowance = passLimit === 'unlimited' ? 10 : passLimit
  const neededWords = isTeam
    ? teamNames.length * roundsPerTeam * TEAM_WORDS_PER_TURN
    : // 협동전은 목표 개수에 팀 전체 패스 횟수만큼만 더 나간다
      playerNames.length * wordsPerPlayer + passAllowance
  const enoughForWholeGame = availableWords >= neededWords
  // 앞판에 나온 제시어는 뒤로 미루므로, 묶음이 크면 연달아 여러 판까지 안 겹친다
  const gamesWithoutRepeat = neededWords > 0 ? Math.floor(availableWords / neededWords) : 0

  const countInCategory = (categoryId: string) => filterWords(words, [categoryId], difficulty).length

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const allSelected = categoryIds.length === categories.length
  const toggleAll = () => setCategoryIds(allSelected ? [] : categories.map((c) => c.id))

  const setTeamCount = (count: number) => {
    setTeamNames((prev) => {
      const next = prev.slice(0, count)
      while (next.length < count) next.push(DEFAULT_TEAM_NAMES[next.length] ?? `${next.length + 1}팀`)
      return next
    })
  }

  const setPlayerCount = (count: number) => {
    setPlayerNames((prev) => {
      const next = prev.slice(0, count)
      while (next.length < count) next.push(defaultPlayerName(next.length))
      return next
    })
  }

  const renameAt = (setter: typeof setTeamNames, index: number, name: string) => {
    setter((prev) => prev.map((t, i) => (i === index ? name : t)))
  }

  const canStart = categoryIds.length > 0 && availableWords > 0

  const handleStart = () => {
    if (!canStart) return
    const common = {
      categoryIds,
      difficulty,
      explainRule,
      timeLimitSec,
      passLimit,
      hintsEnabled,
    }
    onStart(
      isTeam
        ? {
            ...common,
            mode: 'team',
            teamNames: teamNames.map((t, i) => t.trim() || `${i + 1}팀`),
            roundsPerTeam,
          }
        : {
            ...common,
            mode: 'relay',
            playerNames: playerNames.map((t, i) => t.trim() || defaultPlayerName(i)),
            wordsPerPlayer,
          },
    )
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
        <h1 className={`text-3xl font-extrabold ${isTeam ? 'text-orange-600' : 'text-sky-600'}`}>
          {isTeam ? '팀 대항전 설정' : '릴레이전 설정'}
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid gap-5 lg:grid-cols-2">
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
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="mr-2">{c.emoji}</span>
                    {c.name}
                    <span
                      className={`ml-2 text-sm ${selected ? 'text-orange-100' : 'text-slate-400'}`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="난이도">
            <div className="flex flex-wrap gap-3">
              {DIFFICULTY_OPTIONS.map((d) => (
                <Chip
                  key={String(d.value)}
                  selected={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="설명 방식">
            <div className="flex flex-wrap gap-3">
              <Chip
                selected={explainRule === 'body-only'}
                onClick={() => setExplainRule('body-only')}
              >
                🙊 몸으로만
              </Chip>
              <Chip
                selected={explainRule === 'speech-allowed'}
                onClick={() => setExplainRule('speech-allowed')}
              >
                🗣️ 말 설명 허용
              </Chip>
            </div>
            <p className="mt-3 text-sm text-slate-400">게임 화면 위쪽에 계속 표시돼요.</p>
          </Section>

          <Section title="제한 시간" hint={isTeam ? '한 팀이 설명하는 동안' : '다 같이 나눠 쓰는 전체 시간'}>
            <div className="flex flex-wrap gap-3">
              {timePresets.map((t) => (
                <Chip
                  key={t}
                  selected={!customTime && timeLimitSec === t}
                  onClick={() => {
                    setCustomTime(false)
                    setTimeLimitSec(t)
                  }}
                >
                  {formatDuration(t)}
                </Chip>
              ))}
              <Chip selected={customTime} onClick={() => setCustomTime(true)}>
                직접 입력
              </Chip>
            </div>
            {customTime && (
              <div className="mt-4">
                <Stepper
                  value={timeLimitSec}
                  min={isTeam ? 10 : 60}
                  max={isTeam ? 300 : 900}
                  step={isTeam ? 5 : 30}
                  unit="초"
                  onChange={setTimeLimitSec}
                />
              </div>
            )}
            {!isTeam && (
              <p className="mt-3 text-sm text-slate-400">
                기기를 넘기는 동안에는 시간이 멈춰요.
              </p>
            )}
          </Section>

          <Section
            title="패스 허용 횟수"
            hint={isTeam ? '한 팀이 설명하는 동안' : '팀 전체가 나눠 쓰는 횟수'}
          >
            <div className="flex flex-wrap gap-3">
              {PASS_OPTIONS.map((p) => (
                <Chip
                  key={String(p.value)}
                  selected={passLimit === p.value}
                  onClick={() => setPassLimit(p.value)}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="힌트">
            <Toggle
              checked={hintsEnabled}
              onChange={setHintsEnabled}
              label="힌트 사용하기"
              description="게임 중 힌트 단추를 눌러 설명 예시를 볼 수 있어요"
            />
          </Section>

          {isTeam ? (
            <>
              <Section title="팀" hint={`${teamNames.length}팀`}>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS).map(
                    (n) => (
                      <Chip key={n} selected={teamNames.length === n} onClick={() => setTeamCount(n)}>
                        {n}팀
                      </Chip>
                    ),
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teamNames.map((name, i) => (
                    <input
                      key={i}
                      value={name}
                      onChange={(e) => renameAt(setTeamNames, i, e.target.value)}
                      maxLength={12}
                      placeholder={`${i + 1}팀`}
                      className="min-h-[60px] rounded-2xl bg-slate-50 px-5 text-lg font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                  ))}
                </div>
              </Section>

              <Section title="라운드 수" hint="각 팀이 몇 번 설명할지">
                <Stepper
                  value={roundsPerTeam}
                  min={1}
                  max={5}
                  unit="번씩"
                  onChange={setRoundsPerTeam}
                />
                <p className="mt-3 text-sm text-slate-400">
                  모두 합쳐 {teamNames.length * roundsPerTeam}번 설명하게 돼요.
                </p>
              </Section>
            </>
          ) : (
            <>
              <Section title="참가자" hint={`${playerNames.length}명`}>
                <div className="flex flex-wrap gap-3">
                  {Array.from(
                    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
                    (_, i) => i + MIN_PLAYERS,
                  ).map((n) => (
                    <Chip
                      key={n}
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
                      onChange={(e) => renameAt(setPlayerNames, i, e.target.value)}
                      maxLength={12}
                      placeholder={defaultPlayerName(i)}
                      className="min-h-[60px] rounded-2xl bg-slate-50 px-5 text-lg font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-400"
                    />
                  ))}
                </div>
              </Section>

              <Section title="1인당 맞힐 개수" hint="각자 맡은 몫">
                <Stepper
                  value={wordsPerPlayer}
                  min={1}
                  max={10}
                  unit="개"
                  onChange={setWordsPerPlayer}
                />
                <p className="mt-3 text-base font-semibold text-sky-600">
                  {formatDuration(timeLimitSec)} 안에 다 같이 {playerNames.length * wordsPerPlayer}
                  개를 맞히면 통과예요.
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  패스하면 다른 제시어로 바꿔요. 마지막 한 개가 남았을 때 패스하면 그 제시어를 다음
                  사람이 그대로 이어받아요.
                </p>
              </Section>
            </>
          )}
        </div>
      </div>

      {/* 좁은 화면에서는 안내와 시작 단추를 위아래로 쌓는다 */}
      <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
        <p className="text-base text-slate-500 sm:text-lg">
          {categoryIds.length === 0 ? (
            <span className="font-semibold text-red-500">주제를 하나 이상 골라 주세요</span>
          ) : availableWords === 0 ? (
            <span className="font-semibold text-red-500">고른 조건에 맞는 제시어가 없어요</span>
          ) : (
            <>
              제시어 <span className="font-bold text-slate-800">{availableWords}개</span>
              <span className="text-slate-400"> · 이 게임에 필요한 양 약 {neededWords}개</span>
              <span
                className={`block text-base ${enoughForWholeGame ? 'text-green-600' : 'text-amber-600'}`}
              >
                {!enoughForWholeGame
                  ? `${isTeam ? '팀' : '참가자'}끼리 같은 제시어를 만날 수 있어요. 주제를 더 고르면 넉넉해져요.`
                  : gamesWithoutRepeat >= 2
                    ? `넉넉해요. 연달아 ${gamesWithoutRepeat}판까지 같은 제시어가 안 나와요.`
                    : '이 판에서는 안 겹쳐요. 이어서 한 판 더 하면 앞판 제시어가 다시 나올 수 있어요.'}
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="min-h-[68px] w-full shrink-0 rounded-2xl bg-green-500 px-8 text-xl font-extrabold whitespace-nowrap text-white shadow-lg shadow-green-200 disabled:bg-slate-300 disabled:shadow-none active:scale-95 sm:ml-auto sm:min-h-[76px] sm:w-auto sm:px-12 sm:text-2xl"
        >
          시작하기 →
        </button>
      </footer>
    </div>
  )
}
