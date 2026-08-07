import { useMemo, useState } from 'react'
import type { Category, Difficulty } from '../../types'

interface Props {
  categories: Category[]
  defaultCategoryId: string
  /** 이미 있는 제시어 이름들. 겹치는 줄을 미리 걸러내는 데 쓴다 */
  existingTexts: Set<string>
  onAdd: (texts: string[], categoryId: string, difficulty: Difficulty) => void
  onCancel: () => void
}

/** 한 줄에 한 단어씩 붙여넣어 여러 개를 한 번에 넣는다. */
export default function BulkAddDialog({
  categories,
  defaultCategoryId,
  existingTexts,
  onAdd,
  onCancel,
}: Props) {
  const [raw, setRaw] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [difficulty, setDifficulty] = useState<Difficulty>(1)

  const { fresh, duplicated } = useMemo(() => {
    const seen = new Set<string>()
    const fresh: string[] = []
    const duplicated: string[] = []
    for (const line of raw.split('\n')) {
      const text = line.trim()
      if (!text) continue
      const key = text.replace(/\s/g, '')
      if (seen.has(key)) continue
      seen.add(key)
      if (existingTexts.has(key)) duplicated.push(text)
      else fresh.push(text)
    }
    return { fresh, duplicated }
  }, [raw, existingTexts])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-3xl bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto p-7">
          <h2 className="text-3xl font-bold text-slate-800">여러 개 한 번에 넣기</h2>
          <p className="mt-2 text-lg text-slate-500">한 줄에 하나씩 적거나 붙여넣어 주세요.</p>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            autoFocus
            placeholder={'강아지\n고양이\n토끼'}
            className="mt-4 w-full rounded-2xl bg-slate-50 p-5 text-xl leading-relaxed text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
          />

          <p className="mt-5 text-lg font-bold text-slate-600">주제</p>
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

          <p className="mt-5 text-lg font-bold text-slate-600">난이도</p>
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

          <p className="mt-5 text-lg text-slate-500">
            넣을 제시어 <span className="font-bold text-slate-800">{fresh.length}개</span>
            {duplicated.length > 0 && (
              <span className="mt-1 block text-base text-amber-600">
                이미 있는 {duplicated.length}개는 빼고 넣어요: {duplicated.slice(0, 5).join(', ')}
                {duplicated.length > 5 && ' 외'}
              </span>
            )}
          </p>
          <p className="mt-2 text-base text-slate-400">
            힌트는 나중에 제시어를 눌러서 넣을 수 있어요.
          </p>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[64px] rounded-2xl bg-slate-100 px-8 text-lg font-bold text-slate-600 active:scale-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onAdd(fresh, categoryId, difficulty)}
            disabled={fresh.length === 0}
            className="min-h-[64px] rounded-2xl bg-green-500 px-10 text-lg font-extrabold text-white disabled:bg-slate-300 active:scale-95"
          >
            {fresh.length}개 넣기
          </button>
        </div>
      </div>
    </div>
  )
}
