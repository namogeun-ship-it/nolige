import { useEffect, useRef, useState } from 'react'
import {
  MAX_PICKER_NAMES,
  pickRandom,
  splitTeams,
  TEAMS,
  type PickerPurpose,
} from '../../lib/picker'
import { playFanfare, playPeek, playTick } from '../../lib/sound'

interface Props {
  purpose: PickerPurpose
  /** 술래 뽑기면 뽑을 인원, 팀 나누기면 팀 수 */
  count: number
  /** 지난번에 넣어 둔 이름 */
  names: string[]
  onNamesChange: (names: string[]) => void
  onGuideChange: (guide: string) => void
}

/** 이름이 하나씩 지나가다 멈추는 시간(밀리초) */
const SPIN_MS = 1000

type Result = { kind: 'pick'; picked: string[] } | { kind: 'team'; teams: string[][] }

/** 이름을 넣어 두고 술래를 뽑거나 팀을 나눈다. 자리에 없는 사람도 넣을 수 있다. */
export default function NamePicker({
  purpose,
  count,
  names,
  onNamesChange,
  onGuideChange,
}: Props) {
  const [spinning, setSpinning] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const namesRef = useRef(names)
  namesRef.current = names

  const filledNames = () => namesRef.current.map((n) => n.trim()).filter((n) => n.length > 0)
  const filled = names.map((n) => n.trim()).filter((n) => n.length > 0)
  const enough = filled.length > count

  useEffect(() => {
    onGuideChange(
      result
        ? '다시 하거나 이름을 고쳐 보세요'
        : !enough
          ? `이름을 ${count + 1}개 이상 넣어 주세요`
          : purpose === 'pick'
            ? `${filled.length}명 중에서 ${count}명을 뽑아요`
            : `${filled.length}명을 ${count}개 팀으로 나눠요`,
    )
  }, [result, enough, filled.length, count, purpose, onGuideChange])

  // 뽑을 대상이나 인원이 바뀌면 지난 결과는 지운다
  useEffect(() => setResult(null), [purpose, count])

  const run = () => {
    if (!enough || spinning !== null) return
    setResult(null)
    playPeek()
    // 이름이 빠르게 지나가다 멈춘다
    const id = window.setInterval(() => {
      const pool = filledNames()
      setSpinning(pool[Math.floor(Math.random() * pool.length)] ?? '')
      playTick()
    }, 80)
    window.setTimeout(() => {
      window.clearInterval(id)
      setSpinning(null)
      const pool = filledNames()
      setResult(
        purpose === 'pick'
          ? { kind: 'pick', picked: pickRandom(pool, count) }
          : { kind: 'team', teams: splitTeams(pool, count) },
      )
      playFanfare()
    }, SPIN_MS)
  }

  const setName = (index: number, value: string) => {
    onNamesChange(names.map((n, i) => (i === index ? value : n)))
    setResult(null)
  }

  const addName = () => {
    if (names.length >= MAX_PICKER_NAMES) return
    onNamesChange([...names, ''])
    setResult(null)
  }

  const removeName = (index: number) => {
    onNamesChange(names.filter((_, i) => i !== index))
    setResult(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 뽑은 결과와 돌아가는 이름이 보이는 자리 */}
      <div className="flex min-h-[128px] shrink-0 items-center justify-center px-4 sm:min-h-[180px] sm:px-6">
        {spinning !== null ? (
          <p className="truncate text-5xl font-extrabold text-slate-500 sm:text-7xl">{spinning}</p>
        ) : result?.kind === 'pick' ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {result.picked.map((name) => (
              <p
                key={name}
                className="animate-count-pop rounded-3xl bg-white px-6 py-3 text-4xl font-extrabold text-slate-900 sm:px-10 sm:py-4 sm:text-6xl"
              >
                {name}
              </p>
            ))}
          </div>
        ) : result?.kind === 'team' ? (
          <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-2">
            {result.teams.map((team, i) => (
              <div
                key={TEAMS[i].name}
                style={{ backgroundColor: TEAMS[i].color }}
                className="animate-count-pop rounded-3xl px-5 py-3 text-left"
              >
                <p className="text-base font-bold text-white/80">
                  {TEAMS[i].name} · {team.length}명
                </p>
                <p className="text-2xl font-extrabold break-keep text-white sm:text-3xl">
                  {team.join(', ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-2xl font-bold break-keep text-slate-500 sm:text-3xl">
            이름을 넣고 아래 단추를 누르세요
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-7 shrink-0 text-right text-base font-bold text-slate-500">
                {i + 1}
              </span>
              <input
                value={name}
                onChange={(e) => setName(i, e.target.value)}
                maxLength={12}
                placeholder={`${i + 1}번`}
                className="min-h-[60px] min-w-0 flex-1 rounded-2xl bg-slate-800 px-5 text-lg font-semibold text-white outline-none placeholder:text-slate-500 focus:bg-slate-700 focus:ring-2 focus:ring-white"
              />
              <button
                type="button"
                onClick={() => removeName(i)}
                className="size-[60px] shrink-0 rounded-2xl bg-slate-800 text-2xl font-bold text-slate-400 active:scale-95"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-3 max-w-4xl pb-3">
          <button
            type="button"
            onClick={addName}
            disabled={names.length >= MAX_PICKER_NAMES}
            className="min-h-[60px] w-full rounded-2xl bg-slate-800 text-lg font-bold text-slate-300 disabled:opacity-40 active:scale-95"
          >
            + 사람 추가
          </button>
        </div>
      </div>

      <div className="shrink-0 p-4 sm:p-6">
        <button
          type="button"
          onClick={run}
          disabled={!enough || spinning !== null}
          className="min-h-[88px] w-full rounded-3xl bg-white text-3xl font-extrabold text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 sm:text-4xl"
        >
          {purpose === 'pick' ? (result ? '다시 뽑기' : '뽑기') : result ? '다시 나누기' : '팀 나누기'}
        </button>
      </div>
    </div>
  )
}
