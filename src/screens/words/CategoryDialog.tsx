import { useState } from 'react'
import type { Category } from '../../types'

interface Props {
  /** 고칠 주제. 새로 만들 때는 null */
  category: Category | null
  /** 이 주제에 들어 있는 제시어 개수. 지울 때 알려 준다 */
  wordCount: number
  onSave: (name: string, emoji: string) => void
  onDelete?: () => void
  onCancel: () => void
}

const EMOJI_CHOICES = [
  '📌', '⭐', '🌈', '🍀', '🎈', '🎨', '🎵', '🚀',
  '🏠', '🐣', '🍎', '⚽', '📚', '🧩', '🎁', '💡',
]

export default function CategoryDialog({
  category,
  wordCount,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [name, setName] = useState(category?.name ?? '')
  const [emoji, setEmoji] = useState(category?.emoji ?? EMOJI_CHOICES[0])
  const [askDelete, setAskDelete] = useState(false)
  const trimmed = name.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-7">
        <h2 className="text-3xl font-bold text-slate-800">
          {category ? '주제 고치기' : '내 주제 만들기'}
        </h2>

        <label className="mt-6 block text-lg font-bold text-slate-600">주제 이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={14}
          autoFocus
          placeholder="예: 우리 반 친구들"
          className="mt-2 min-h-[64px] w-full rounded-2xl bg-slate-50 px-5 text-2xl font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400"
        />

        <p className="mt-6 text-lg font-bold text-slate-600">그림</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`h-[60px] w-[60px] rounded-2xl text-2xl active:scale-95 ${
                emoji === e ? 'bg-orange-500' : 'bg-slate-100'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
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
            onClick={() => trimmed && onSave(trimmed, emoji)}
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
            <h3 className="text-2xl font-bold text-slate-800">이 주제를 지울까요?</h3>
            <p className="mt-2 text-lg text-slate-500">
              {wordCount > 0
                ? `안에 있는 제시어 ${wordCount}개도 함께 지워져요.`
                : '이 주제에는 제시어가 없어요.'}
            </p>
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
