import { useCallback, useState } from 'react'
import { useEdgeColor } from '../hooks/useEdgeColor'
import {
  MAX_PICK,
  MAX_TEAM_COUNT,
  MIN_TEAM_COUNT,
  type PickerPurpose,
} from '../lib/picker'
import TouchPicker from './picker/TouchPicker'
import NamePicker from './picker/NamePicker'

interface Props {
  names: string[]
  onNamesChange: (names: string[]) => void
  onBack: () => void
}

type PickerInput = 'touch' | 'name'

const PURPOSES: { value: PickerPurpose; label: string }[] = [
  { value: 'pick', label: '🎯 술래 뽑기' },
  { value: 'team', label: '🤝 팀 나누기' },
]

const INPUTS: { value: PickerInput; label: string }[] = [
  { value: 'touch', label: '👆 손가락' },
  { value: 'name', label: '✏️ 이름' },
]

/**
 * 술래를 뽑거나 팀을 나눈다.
 * 태블릿에서는 다 같이 손가락을 올려서,
 * 휴대폰이거나 자리에 없는 사람이 있으면 이름을 넣어서 정한다.
 */
export default function PickerScreen({ names, onNamesChange, onBack }: Props) {
  useEdgeColor('var(--color-slate-900)')

  const [purpose, setPurpose] = useState<PickerPurpose>('pick')
  const [input, setInput] = useState<PickerInput>('touch')
  const [pickCount, setPickCount] = useState(1)
  const [teamCount, setTeamCount] = useState(MIN_TEAM_COUNT)
  const [guide, setGuide] = useState('')

  // 자식이 안내 문구를 바꿀 때마다 새 함수가 넘어가지 않도록 고정한다
  const handleGuideChange = useCallback((next: string) => setGuide(next), [])

  const isTeam = purpose === 'team'
  const count = isTeam ? teamCount : pickCount
  const setCount = isTeam ? setTeamCount : setPickCount
  const choices = isTeam
    ? Array.from({ length: MAX_TEAM_COUNT - MIN_TEAM_COUNT + 1 }, (_, i) => i + MIN_TEAM_COUNT)
    : Array.from({ length: MAX_PICK }, (_, i) => i + 1)

  const tabClass = (selected: boolean) =>
    `min-h-[52px] rounded-2xl px-4 text-base font-bold whitespace-nowrap transition-colors active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-lg ${
      selected ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300'
    }`

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[52px] shrink-0 rounded-2xl bg-slate-700 px-4 text-sm font-semibold text-slate-100 active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
        >
          ← 홈
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-white sm:text-2xl">
            {isTeam ? '팀 나누기' : '술래 정하기'}
          </p>
          <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">{guide}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          {PURPOSES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPurpose(p.value)}
              className={tabClass(purpose === p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 gap-2">
          {INPUTS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setInput(m.value)}
              className={tabClass(input === m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap text-slate-400">
            {isTeam ? '팀 수' : '뽑을 인원'}
          </span>
          {choices.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`min-h-[52px] rounded-2xl px-3 text-base font-bold transition-colors active:scale-95 sm:min-h-[60px] sm:px-4 sm:text-lg ${
                count === n ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </header>

      {input === 'touch' ? (
        // 설정을 바꾸면 손가락과 결과가 남지 않도록 키를 붙여 새로 시작한다
        <TouchPicker
          key={`${purpose}-${count}`}
          purpose={purpose}
          count={count}
          onGuideChange={handleGuideChange}
        />
      ) : (
        <NamePicker
          purpose={purpose}
          count={count}
          names={names}
          onNamesChange={onNamesChange}
          onGuideChange={handleGuideChange}
        />
      )}
    </div>
  )
}
