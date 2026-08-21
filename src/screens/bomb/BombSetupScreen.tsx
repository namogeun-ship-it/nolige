import { useMemo, useState } from 'react'
import type { BombSettings, BombTopicKind, BombTopicPrefs, Screen } from '../../types'
import {
  BOMB_BASE_PRESETS,
  BOMB_BASE_STEP,
  BOMB_JITTER_SEC,
  BOMB_MAX_BASE_SEC,
  BOMB_MIN_BASE_SEC,
  DEFAULT_BOMB_BASE_SEC,
} from '../../lib/constants'
import { countTopics } from '../../lib/bomb'
import { Chip, Section, Stepper, Toggle } from '../../components/SettingControls'

interface Props {
  lastSettings?: BombSettings
  topicPrefs: BombTopicPrefs
  navigate: (screen: Screen) => void
  onStart: (settings: BombSettings) => void
  onBack: () => void
}

const KIND_OPTIONS: { value: BombTopicKind; label: string; description: string }[] = [
  {
    value: 'chosung',
    label: '🔤 초성',
    description: 'ㄱ ㅅ 처럼 첫소리 두 개가 나옵니다. 그 초성으로 된 두 글자 낱말을 대세요.',
  },
  {
    value: 'topic',
    label: '💬 주제',
    description: '동물, 빨간 것처럼 조건이 나옵니다. 거기에 맞는 말을 하나씩 대세요.',
  },
  {
    value: 'mix',
    label: '🎲 섞기',
    description: '초성과 주제가 번갈아 나옵니다. 판마다 무엇이 나올지 모릅니다.',
  },
]

export default function BombSetupScreen({ lastSettings, topicPrefs, navigate, onStart, onBack }: Props) {
  const [topicKind, setTopicKind] = useState<BombTopicKind>(lastSettings?.topicKind ?? 'mix')
  const [hintsEnabled, setHintsEnabled] = useState(lastSettings?.hintsEnabled ?? true)
  const [baseSec, setBaseSec] = useState(lastSettings?.baseSec ?? DEFAULT_BOMB_BASE_SEC)
  const [hurryUp, setHurryUp] = useState(lastSettings?.hurryUp ?? true)

  const settings: BombSettings = useMemo(
    () => ({ topicKind, hintsEnabled, baseSec, hurryUp }),
    [topicKind, hintsEnabled, baseSec, hurryUp],
  )

  const topicCount = useMemo(() => countTopics(settings, topicPrefs), [settings, topicPrefs])
  const canStart = topicCount > 0

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
        <h1 className="text-3xl font-extrabold text-red-600">폭탄 돌리기 설정</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="이렇게 놀아요">
            <ol className="flex flex-col gap-3 text-lg text-slate-600">
              <li>
                <span className="mr-2 font-bold text-red-500">1</span>
                둘러앉아서 기기를 한 사람이 듭니다.
              </li>
              <li>
                <span className="mr-2 font-bold text-red-500">2</span>
                화면에 나온 조건에 맞는 말을 하나 대고 옆 사람에게 넘깁니다.
              </li>
              <li>
                <span className="mr-2 font-bold text-red-500">3</span>
                폭탄이 터졌을 때 들고 있던 사람이 걸립니다.
              </li>
            </ol>
            <p className="mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-base text-amber-800">
              놀이 중에 <strong>누를 것은 없습니다.</strong> 아이들은 기기를 넘기기만 하면 되고,
              말이 맞는지는 서로 보고 정하세요. 언제 터질지는 아무도 알 수 없습니다.
            </p>
          </Section>

          <Section title="무엇을 낼까요">
            <div className="flex flex-col gap-3">
              {KIND_OPTIONS.map((k) => {
                const selected = topicKind === k.value
                return (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setTopicKind(k.value)}
                    className={`rounded-2xl px-5 py-4 text-left transition-colors active:scale-[0.98] ${
                      selected
                        ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="block text-lg font-bold">{k.label}</span>
                    <span
                      className={`mt-1 block text-sm ${selected ? 'text-red-100' : 'text-slate-400'}`}
                    >
                      {k.description}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => navigate({ name: 'bomb-topics' })}
              className="mt-4 min-h-[60px] w-full rounded-2xl bg-slate-100 px-5 text-lg font-bold text-slate-700 active:scale-95"
            >
              📋 주제 고르기 · 직접 넣기
            </button>
            <p className="mt-3 text-sm text-slate-400">
              나올 주제를 끄고 켜거나, 우리 반에 맞는 주제를 직접 넣을 수 있어요.
            </p>
          </Section>

          <Section title="난이도" hint="힌트를 줄지로 정해요">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setHintsEnabled(true)}
                className={`rounded-2xl px-5 py-4 text-left transition-colors active:scale-[0.98] ${
                  hintsEnabled
                    ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="block text-lg font-bold">🙂 쉬움 · 힌트가 있어요</span>
                <span
                  className={`mt-1 block text-sm ${hintsEnabled ? 'text-red-100' : 'text-slate-400'}`}
                >
                  막히면 힌트 단추를 눌러 답을 하나씩 볼 수 있습니다. 한 번에 하나만 나오고,
                  또 누르면 다른 하나로 바뀝니다. 가수처럼 예시를 미리 적어 둘 수 없는
                  몇몇 주제에는 힌트가 없습니다.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHintsEnabled(false)}
                className={`rounded-2xl px-5 py-4 text-left transition-colors active:scale-[0.98] ${
                  !hintsEnabled
                    ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className="block text-lg font-bold">😤 어려움 · 힌트가 없어요</span>
                <span
                  className={`mt-1 block text-sm ${!hintsEnabled ? 'text-red-100' : 'text-slate-400'}`}
                >
                  아무 도움 없이 스스로 떠올려야 합니다. 나오는 문제는 쉬움과 똑같습니다.
                </span>
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              어떤 문제가 쉬운지는 아이마다 다릅니다. 공룡을 좋아하는 아이에게 공룡 이름은 쉬운
              문제고, 관심 없는 아이에게는 두 개에서 막히는 문제입니다. 그래서 문제를 나누지 않고
              힌트를 줄지로만 정합니다.
            </p>
          </Section>

          <Section title="폭탄 길이" hint="언제 터질지는 아무도 몰라요">
            <div className="flex flex-wrap gap-3">
              {BOMB_BASE_PRESETS.map((sec) => (
                <Chip
                  key={sec}
                  tone="red"
                  selected={baseSec === sec}
                  onClick={() => setBaseSec(sec)}
                >
                  {sec}초
                </Chip>
              ))}
            </div>
            <div className="mt-4">
              <Stepper
                value={baseSec}
                min={BOMB_MIN_BASE_SEC}
                max={BOMB_MAX_BASE_SEC}
                step={BOMB_BASE_STEP}
                unit="초"
                onChange={setBaseSec}
              />
            </div>
            <p className="mt-3 text-sm text-slate-400">
              실제로는{' '}
              <span className="font-bold text-slate-600">
                {baseSec - BOMB_JITTER_SEC}초에서 {baseSec + BOMB_JITTER_SEC}초 사이
              </span>
              에서 판마다 무작위로 정해집니다. 정확히 {baseSec}초에 터지면 몇 번 해 보고 초를 세게
              되거든요. 남은 시간은 화면에 나오지 않습니다.
            </p>
            <div className="mt-4">
              <Toggle
                tone="red"
                checked={hurryUp}
                onChange={setHurryUp}
                label="터지기 직전에 빨라지기"
                description="막판에 째깍 소리가 빨라져요. 끄면 끝까지 일정해서 전혀 눈치챌 수 없어요"
              />
            </div>
          </Section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
        <p className="text-base text-slate-500 sm:text-lg">
          {canStart ? (
            <>
              낼 수 있는 문제 <span className="font-bold text-slate-800">{topicCount}개</span>
              <span className="block text-base text-slate-400">
                한 판에 하나씩 쓰고, 방금 나온 문제만 몇 판 동안 피해서 냅니다.
              </span>
            </>
          ) : (
            <span className="font-semibold text-red-500">고른 조건에 맞는 문제가 없어요</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => canStart && onStart(settings)}
          disabled={!canStart}
          className="min-h-[68px] w-full shrink-0 rounded-2xl bg-red-500 px-8 text-xl font-extrabold whitespace-nowrap text-white shadow-lg shadow-red-200 disabled:bg-slate-300 disabled:shadow-none active:scale-95 sm:ml-auto sm:min-h-[76px] sm:w-auto sm:px-12 sm:text-2xl"
        >
          시작하기 →
        </button>
      </footer>
    </div>
  )
}
