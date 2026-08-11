import { useCallback, useState } from 'react'
import { useEdgeColor } from '../hooks/useEdgeColor'
import { MAX_PICK } from '../lib/picker'
import TouchPicker from './picker/TouchPicker'
import NamePicker from './picker/NamePicker'

interface Props {
  names: string[]
  onNamesChange: (names: string[]) => void
  onBack: () => void
}

type PickerMode = 'touch' | 'name'

/**
 * 술래 정하기.
 * 태블릿에서는 다 같이 손가락을 올려 뽑고,
 * 휴대폰이거나 자리에 없는 사람이 있으면 이름을 넣어서 뽑는다.
 */
export default function PickerScreen({ names, onNamesChange, onBack }: Props) {
  useEdgeColor('var(--color-slate-900)')

  const [mode, setMode] = useState<PickerMode>('touch')
  const [pickCount, setPickCount] = useState(1)
  const [guide, setGuide] = useState('')

  // 자식이 안내 문구를 바꿀 때마다 새 함수가 넘어가지 않도록 고정한다
  const handleGuideChange = useCallback((next: string) => setGuide(next), [])

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
          <p className="truncate text-lg font-extrabold text-white sm:text-2xl">술래 정하기</p>
          <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">{guide}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          {(
            [
              { value: 'touch', label: '👆 손가락' },
              { value: 'name', label: '✏️ 이름' },
            ] as const
          ).map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`min-h-[52px] rounded-2xl px-4 text-base font-bold whitespace-nowrap transition-colors active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-lg ${
                mode === m.value ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap text-slate-400">뽑을 인원</span>
          {Array.from({ length: MAX_PICK }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPickCount(n)}
              className={`min-h-[52px] rounded-2xl px-3 text-base font-bold transition-colors active:scale-95 sm:min-h-[60px] sm:px-4 sm:text-lg ${
                pickCount === n ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </header>

      {mode === 'touch' ? (
        // 모드를 오갈 때 손가락과 결과가 남지 않도록 키를 붙여 새로 시작한다
        <TouchPicker key={pickCount} pickCount={pickCount} onGuideChange={handleGuideChange} />
      ) : (
        <NamePicker
          pickCount={pickCount}
          names={names}
          onNamesChange={onNamesChange}
          onGuideChange={handleGuideChange}
        />
      )}
    </div>
  )
}
