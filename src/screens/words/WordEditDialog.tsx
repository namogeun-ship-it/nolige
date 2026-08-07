import { useState } from 'react'
import type { Category, Difficulty, Word } from '../../types'
import { MAX_HINTS } from '../../lib/constants'

interface Props {
  /** 고칠 제시어. 새로 만들 때는 null */
  word: Word | null
  categories: Category[]
  /** 새로 만들 때 미리 골라 둘 주제 */
  defaultCategoryId: string
  onSave: (draft: { text: string; categoryId: string; difficulty: Difficulty; hints: string[] }) => void
  onDelete?: () => void
  onCancel: () => void
}

export default function WordEditDialog({
  word,
  categories,
  defaultCategoryId,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [text, setText] = useState(word?.text ?? '')
  const [categoryId, setCategoryId] = useState(word?.categoryId ?? defaultCategoryId)
  const [difficulty, setDifficulty] = useState<Difficulty>(word?.difficulty ?? 1)
  const [hints, setHints] = useState<string[]>(() => {
    const filled = [...(word?.hints ?? [])]
    while (filled.length < MAX_HINTS) filled.push('')
    return filled.slice(0, MAX_HINTS)
  })
  const [askDelete, setAskDelete] = useState(false)

  const trimmed = text.trim()
  // 힌트에 정답이 그대로 들어가면 게임이 시시해진다
  const leaking = hints.some((h) => trimmed.length > 0 && h.replace(/\s/g, '').includes(trimmed.replace(/\s/g, '')))

  const handleSave = () => {
    if (!trimmed) return
    onSave({
      text: trimmed,
      categoryId,
      difficulty,
      hints: hints.map((h) => h.trim()).filter((h) => h.length > 0),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-3xl bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto p-7">
          <h2 className="text-3xl font-bold text-slate-800">
            {word ? '제시어 고치기' : '제시어 추가'}
          </h2>

          <label className="mt-6 block text-lg font-bold text-slate-600">제시어</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={20}
            autoFocus
            placeholder="예: 강아지"
            className="mt-2 min-h-[64px] w-full rounded-2xl bg-slate-50 px-5 text-2xl font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
          />

          <p className="mt-6 text-lg font-bold text-slate-600">주제</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`min-h-[56px] rounded-2xl px-4 text-base font-semibold active:scale-95 ${
                  categoryId === c.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>

          <p className="mt-6 text-lg font-bold text-slate-600">난이도</p>
          <div className="mt-2 flex gap-3">
            {[
              { value: 1 as Difficulty, label: '쉬움' },
              { value: 2 as Difficulty, label: '어려움' },
            ].map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`min-h-[56px] flex-1 rounded-2xl text-lg font-bold active:scale-95 ${
                  difficulty === d.value ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-lg font-bold text-slate-600">
            힌트 <span className="text-base font-normal text-slate-400">최대 {MAX_HINTS}개</span>
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {hints.map((h, i) => (
              <input
                key={i}
                value={h}
                onChange={(e) => setHints((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                maxLength={40}
                placeholder={`힌트 ${i + 1}`}
                className="min-h-[60px] w-full rounded-2xl bg-slate-50 px-5 text-lg text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
              />
            ))}
          </div>
          {leaking && (
            <p className="mt-2 text-base font-semibold text-amber-600">
              힌트에 제시어가 그대로 들어 있어요. 돌려서 설명하면 더 재미있어요.
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-slate-200 p-5">
          {onDelete && (
            <button
              type="button"
              onClick={() => setAskDelete(true)}
              className="min-h-[64px] rounded-2xl bg-red-50 px-6 text-lg font-bold text-red-500 active:scale-95"
            >
              삭제
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto min-h-[64px] rounded-2xl bg-slate-100 px-8 text-lg font-bold text-slate-600 active:scale-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!trimmed}
            className="min-h-[64px] rounded-2xl bg-green-500 px-10 text-lg font-extrabold text-white disabled:bg-slate-300 active:scale-95"
          >
            저장
          </button>
        </div>
      </div>

      {askDelete && onDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-8">
          <div className="w-full max-w-md rounded-3xl bg-white p-7">
            <h3 className="text-2xl font-bold text-slate-800">이 제시어를 지울까요?</h3>
            <p className="mt-2 text-lg text-slate-500">{trimmed}</p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setAskDelete(false)}
                className="min-h-[64px] flex-1 rounded-2xl bg-slate-100 text-lg font-bold text-slate-600 active:scale-95"
              >
                아니요
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="min-h-[64px] flex-1 rounded-2xl bg-red-500 text-lg font-bold text-white active:scale-95"
              >
                지우기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
