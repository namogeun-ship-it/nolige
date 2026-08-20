import { useMemo, useState } from 'react'
import type { BombTopicPrefs } from '../../types'
import { BOMB_TOPICS } from '../../data/bombTopics'
import { MAX_BOMB_TOPIC_LENGTH } from '../../lib/constants'
import ConfirmDialog from '../../components/ConfirmDialog'

interface Props {
  prefs: BombTopicPrefs
  onChange: (next: BombTopicPrefs) => void
  onBack: () => void
}

interface Row {
  label: string
  /** 답을 미리 적어 둔 주제만 힌트가 나온다 */
  hasHint: boolean
  /** 작가가 직접 넣은 주제. 이것만 지울 수 있다 */
  isCustom: boolean
}

/**
 * 폭탄 돌리기에 나올 주제를 고르고 직접 넣는 화면.
 *
 * 기본 주제는 지우지 않고 꺼 두기만 한다. 언제든 도로 켤 수 있고,
 * 앱을 새로 배포해 기본 주제가 늘어나도 작가의 손질이 그대로 남는다.
 * 초성은 여기서 다루지 않는다. 초성은 낱말이 있느냐 없느냐의 문제라
 * 취향껏 고를 일이 아니기 때문이다.
 */
export default function BombTopicsScreen({ prefs, onChange, onBack }: Props) {
  const [draft, setDraft] = useState('')
  const [askReset, setAskReset] = useState(false)

  const rows: Row[] = useMemo(
    () => [
      ...BOMB_TOPICS.map((t) => ({
        label: t.label,
        hasHint: t.answers.length > 0,
        isCustom: false,
      })),
      ...prefs.customLabels.map((label) => ({ label, hasHint: false, isCustom: true })),
    ],
    [prefs.customLabels],
  )

  const off = useMemo(() => new Set(prefs.disabledLabels), [prefs.disabledLabels])
  const onCount = rows.filter((r) => !off.has(r.label)).length

  const toggle = (label: string) => {
    onChange({
      ...prefs,
      disabledLabels: off.has(label)
        ? prefs.disabledLabels.filter((l) => l !== label)
        : [...prefs.disabledLabels, label],
    })
  }

  const trimmed = draft.trim()
  const tooLong = [...trimmed].length > MAX_BOMB_TOPIC_LENGTH
  const already = rows.some((r) => r.label === trimmed)
  const canAdd = trimmed.length > 0 && !tooLong && !already

  const addCustom = () => {
    if (!canAdd) return
    onChange({ ...prefs, customLabels: [...prefs.customLabels, trimmed] })
    setDraft('')
  }

  const removeCustom = (label: string) => {
    onChange({
      disabledLabels: prefs.disabledLabels.filter((l) => l !== label),
      customLabels: prefs.customLabels.filter((l) => l !== label),
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
          ← 설정
        </button>
        <h1 className="text-2xl font-extrabold text-red-600 sm:text-3xl">주제 고르기</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-bold text-slate-800">직접 넣기</h2>
            <span className="text-sm text-slate-400">우리 반에 맞는 주제를 더할 수 있어요</span>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustom()
              }}
              maxLength={MAX_BOMB_TOPIC_LENGTH + 4}
              placeholder="예) 급식에 나오는 것"
              className="min-h-[60px] flex-1 rounded-2xl bg-slate-50 px-5 text-lg font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-red-400"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!canAdd}
              className="min-h-[60px] shrink-0 rounded-2xl bg-red-500 px-8 text-lg font-bold text-white disabled:bg-slate-300 active:scale-95"
            >
              넣기
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {tooLong
              ? `${MAX_BOMB_TOPIC_LENGTH}글자까지만 넣을 수 있어요. 화면에 크게 나와야 하거든요`
              : already
                ? '이미 있는 주제예요'
                : '직접 넣은 주제에는 힌트가 나오지 않아요. 답을 미리 적어 둘 수가 없거든요'}
          </p>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-bold text-slate-800">나올 주제</h2>
            <span className="text-sm text-slate-400">
              {onCount}개 켜짐 · 전체 {rows.length}개
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            눌러서 끄고 켤 수 있어요. 끈 주제는 나오지 않지만 지워지지는 않습니다.
            💡 표시가 있는 주제만 힌트가 나와요.
          </p>

          <ul className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            {rows.map((r) => {
              const isOn = !off.has(r.label)
              return (
                <li key={r.label} className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => toggle(r.label)}
                    className={`min-h-[56px] px-4 text-base font-semibold transition-colors active:scale-95 sm:text-lg ${
                      r.isCustom ? 'rounded-l-2xl' : 'rounded-2xl'
                    } ${
                      isOn
                        ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {r.hasHint && <span className="mr-1.5">💡</span>}
                    {r.label}
                  </button>
                  {r.isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustom(r.label)}
                      aria-label={`${r.label} 지우기`}
                      className={`min-h-[56px] rounded-r-2xl border-l px-3 text-lg font-bold active:scale-95 ${
                        isOn
                          ? 'border-red-400 bg-red-500 text-red-100'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
                      }`}
                    >
                      ✕
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <footer className="flex shrink-0 gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => onChange({ ...prefs, disabledLabels: [] })}
          disabled={prefs.disabledLabels.length === 0}
          className="min-h-[60px] flex-1 rounded-2xl bg-slate-100 text-lg font-bold text-slate-700 disabled:opacity-40 active:scale-95"
        >
          전부 켜기
        </button>
        <button
          type="button"
          onClick={() => setAskReset(true)}
          disabled={prefs.disabledLabels.length === 0 && prefs.customLabels.length === 0}
          className="min-h-[60px] flex-1 rounded-2xl bg-slate-100 text-lg font-bold text-slate-700 disabled:opacity-40 active:scale-95"
        >
          처음으로 되돌리기
        </button>
      </footer>

      {askReset && (
        <ConfirmDialog
          title="처음 상태로 되돌릴까요?"
          message="꺼 둔 주제가 모두 켜지고, 직접 넣은 주제는 지워져요."
          confirmLabel="되돌리기"
          onConfirm={() => {
            onChange({ disabledLabels: [], customLabels: [] })
            setAskReset(false)
          }}
          onCancel={() => setAskReset(false)}
        />
      )}
    </div>
  )
}
