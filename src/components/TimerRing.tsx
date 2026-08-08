interface Props {
  remainingSec: number
  totalSec: number
}

// 아래 값은 그림 안에서 쓰는 기준 크기다.
// 실제 화면 크기는 CSS로 정하므로 휴대폰에서는 작게, 태블릿에서는 크게 나온다.
const BOX = 76
const STROKE = 8
const RADIUS = (BOX - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** 남은 시간을 원형 게이지와 숫자로 같이 보여준다. */
export default function TimerRing({ remainingSec, totalSec }: Props) {
  const shown = Math.ceil(Math.max(0, remainingSec))
  const ratio = totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0
  const urgent = shown <= 10

  return (
    <div className="relative size-[56px] shrink-0 sm:size-[76px]">
      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="size-full -rotate-90">
        <circle
          cx={BOX / 2}
          cy={BOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-slate-200"
        />
        <circle
          cx={BOX / 2}
          cy={BOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          className={urgent ? 'stroke-red-500' : 'stroke-orange-500'}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-xl font-extrabold tabular-nums sm:text-2xl ${
          urgent ? 'text-red-600' : 'text-slate-700'
        }`}
      >
        {shown}
      </span>
    </div>
  )
}
