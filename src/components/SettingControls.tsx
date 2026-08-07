import type { ReactNode } from 'react'

/** 설정 화면의 카드 한 덩어리 */
export function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {hint && <span className="text-sm text-slate-400">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

/** 눌러서 고르는 알약 모양 버튼. 터치 영역을 60px 이상으로 잡는다. */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[60px] rounded-2xl px-5 text-lg font-semibold transition-colors active:scale-95 ${
        selected
          ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

/** 켜고 끄는 스위치 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full min-h-[60px] items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-3 text-left active:scale-[0.98]"
    >
      <span>
        <span className="block text-lg font-semibold text-slate-700">{label}</span>
        {description && <span className="block text-sm text-slate-400">{description}</span>}
      </span>
      <span
        className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${
            checked ? 'left-8' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

/** 숫자를 눌러서 늘리고 줄이는 입력 */
export function Stepper({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (next: number) => void
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="h-[60px] w-[60px] rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600 disabled:opacity-40 active:scale-95"
      >
        −
      </button>
      <span className="min-w-[110px] text-center text-2xl font-bold tabular-nums text-slate-800">
        {value}
        {unit && <span className="ml-1 text-lg font-semibold text-slate-400">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="h-[60px] w-[60px] rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600 disabled:opacity-40 active:scale-95"
      >
        +
      </button>
    </div>
  )
}
