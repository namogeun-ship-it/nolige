interface Props {
  remainingSec: number
  totalSec: number
}

const SIZE = 76
const STROKE = 8
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** 남은 시간을 원형 게이지와 숫자로 같이 보여준다. */
export default function TimerRing({ remainingSec, totalSec }: Props) {
  const shown = Math.ceil(Math.max(0, remainingSec))
  const ratio = totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0
  const urgent = shown <= 10

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-slate-200"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
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
        className={`absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums ${
          urgent ? 'text-red-600' : 'text-slate-700'
        }`}
      >
        {shown}
      </span>
    </div>
  )
}
