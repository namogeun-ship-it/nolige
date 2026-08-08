import { useMemo, useRef, useState } from 'react'
import type { Category, Difficulty, Screen, Word } from '../types'
import {
  buildBackup,
  createId,
  parseBackup,
  resetAllWordData,
  restoreDefaultWords,
} from '../lib/storage'
import ConfirmDialog from '../components/ConfirmDialog'
import WordEditDialog from './words/WordEditDialog'
import BulkAddDialog from './words/BulkAddDialog'
import CategoryDialog from './words/CategoryDialog'

interface Props {
  words: Word[]
  categories: Category[]
  onChange: (next: { words: Word[]; categories: Category[] }) => void
  navigate: (screen: Screen) => void
}

type DifficultyFilter = Difficulty | 'all'

export default function WordsScreen({ words, categories, onChange, navigate }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => categories[0]?.id ?? '',
  )
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [query, setQuery] = useState('')

  const [editing, setEditing] = useState<Word | null>(null)
  const [creating, setCreating] = useState(false)
  const [bulkAdding, setBulkAdding] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [resetKind, setResetKind] = useState<'defaults' | 'all' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const searching = query.trim().length > 0

  const visibleWords = useMemo(() => {
    const q = query.trim().replace(/\s/g, '')
    return words.filter((w) => {
      // 검색 중에는 주제를 넘나들며 찾는다
      if (!searching && w.categoryId !== selectedCategoryId) return false
      if (difficultyFilter !== 'all' && w.difficulty !== difficultyFilter) return false
      if (!q) return true
      const haystack = (w.text + w.hints.join('')).replace(/\s/g, '')
      return haystack.includes(q)
    })
  }, [words, selectedCategoryId, difficultyFilter, query, searching])

  const countIn = (categoryId: string) => words.filter((w) => w.categoryId === categoryId).length
  const existingTexts = useMemo(
    () => new Set(words.map((w) => w.text.replace(/\s/g, ''))),
    [words],
  )
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2600)
  }

  // ── 제시어
  const saveWord = (draft: {
    text: string
    categoryId: string
    difficulty: Difficulty
    hints: string[]
  }) => {
    const next = editing
      ? words.map((w) => (w.id === editing.id ? { ...w, ...draft } : w))
      : [{ id: createId('w'), ...draft, isCustom: true }, ...words]
    onChange({ words: next, categories })
    setEditing(null)
    setCreating(false)
    flash(editing ? '고쳤어요' : '넣었어요')
  }

  const deleteWord = () => {
    if (!editing) return
    onChange({ words: words.filter((w) => w.id !== editing.id), categories })
    setEditing(null)
    flash('지웠어요')
  }

  const bulkAdd = (texts: string[], categoryId: string, difficulty: Difficulty) => {
    const added: Word[] = texts.map((text) => ({
      id: createId('w'),
      text,
      categoryId,
      difficulty,
      hints: [],
      isCustom: true,
    }))
    onChange({ words: [...added, ...words], categories })
    setBulkAdding(false)
    setSelectedCategoryId(categoryId)
    flash(`${added.length}개를 넣었어요`)
  }

  // ── 주제
  const saveCategory = (name: string, emoji: string) => {
    if (editingCategory) {
      onChange({
        words,
        categories: categories.map((c) =>
          c.id === editingCategory.id ? { ...c, name, emoji } : c,
        ),
      })
      setEditingCategory(null)
      flash('주제를 고쳤어요')
      return
    }
    const created: Category = { id: createId('c'), name, emoji, isCustom: true }
    onChange({ words, categories: [...categories, created] })
    setCreatingCategory(false)
    setSelectedCategoryId(created.id)
    flash('주제를 만들었어요')
  }

  const deleteCategory = () => {
    if (!editingCategory) return
    const gone = editingCategory.id
    const nextCategories = categories.filter((c) => c.id !== gone)
    onChange({ words: words.filter((w) => w.categoryId !== gone), categories: nextCategories })
    setEditingCategory(null)
    setSelectedCategoryId(nextCategories[0]?.id ?? '')
    flash('주제를 지웠어요')
  }

  // ── 초기화
  const runReset = () => {
    const next = resetKind === 'all' ? resetAllWordData() : restoreDefaultWords(words, categories)
    onChange(next)
    setResetKind(null)
    setSelectedCategoryId(next.categories[0]?.id ?? '')
    flash('처음 상태로 되돌렸어요')
  }

  // ── 내보내기 / 가져오기
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(buildBackup(words, categories), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `놀이게임_제시어_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('파일로 내보냈어요')
  }

  const importJson = async (file: File) => {
    const result = parseBackup(await file.text())
    if (!result.ok) {
      flash(result.error)
      return
    }
    onChange({ words: result.words, categories: result.categories })
    setSelectedCategoryId(result.categories[0]?.id ?? '')
    flash(`제시어 ${result.words.length}개를 가져왔어요`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => navigate({ name: 'home' })}
          className="min-h-[56px] shrink-0 rounded-2xl bg-white px-5 text-base font-semibold whitespace-nowrap text-slate-600 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-6 sm:text-lg"
        >
          ← 홈
        </button>
        <h1 className="text-2xl font-extrabold whitespace-nowrap text-orange-600 sm:text-3xl">
          제시어 관리
        </h1>
        <span className="text-base whitespace-nowrap text-slate-400 sm:text-lg">
          모두 {words.length}개
        </span>

        <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:ml-auto sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0">
          <button
            type="button"
            onClick={() => setBulkAdding(true)}
            className="min-h-[56px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold whitespace-nowrap text-slate-600 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
          >
            📋 여러 개 넣기
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="min-h-[56px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold whitespace-nowrap text-slate-600 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
          >
            ⬆️ 내보내기
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[56px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold whitespace-nowrap text-slate-600 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
          >
            ⬇️ 가져오기
          </button>
          <button
            type="button"
            onClick={() => setResetKind('defaults')}
            className="min-h-[56px] shrink-0 rounded-2xl bg-white px-4 text-sm font-semibold whitespace-nowrap text-slate-600 shadow-sm active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
          >
            ↩️ 되돌리기
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="min-h-[56px] shrink-0 rounded-2xl bg-green-500 px-5 text-base font-extrabold whitespace-nowrap text-white shadow active:scale-95 sm:min-h-[60px] sm:px-7 sm:text-lg"
          >
            ＋ 제시어 추가
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importJson(file)
            e.target.value = ''
          }}
        />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 lg:flex-row lg:gap-5 lg:px-6 lg:pb-6">
        {/* 좁은 화면: 주제를 가로로 넘겨 고른다 */}
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:hidden">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(c.id)
                setQuery('')
              }}
              className={`flex min-h-[60px] shrink-0 items-center gap-2 rounded-2xl px-4 text-base font-semibold whitespace-nowrap active:scale-95 ${
                !searching && selectedCategoryId === c.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              {c.name}
              <span
                className={
                  !searching && selectedCategoryId === c.id ? 'text-orange-100' : 'text-slate-400'
                }
              >
                {countIn(c.id)}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCreatingCategory(true)}
            className="min-h-[60px] shrink-0 rounded-2xl border-2 border-dashed border-slate-300 px-4 text-base font-semibold whitespace-nowrap text-slate-400 active:scale-95"
          >
            ＋ 내 주제
          </button>
        </div>

        {/* 넓은 화면: 왼쪽에 주제 목록 */}
        <aside className="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto lg:flex">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(c.id)
                setQuery('')
              }}
              className={`flex min-h-[64px] items-center gap-3 rounded-2xl px-4 text-left text-lg font-semibold active:scale-[0.98] ${
                !searching && selectedCategoryId === c.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span
                className={
                  !searching && selectedCategoryId === c.id ? 'text-orange-100' : 'text-slate-400'
                }
              >
                {countIn(c.id)}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCreatingCategory(true)}
            className="min-h-[64px] rounded-2xl border-2 border-dashed border-slate-300 text-lg font-semibold text-slate-400 active:scale-[0.98]"
          >
            ＋ 내 주제 만들기
          </button>
        </aside>

        {/* 제시어 목록 */}
        {/* min-h-0이 없으면 세로로 쌓였을 때 목록이 줄어들지 못해 스크롤이 막힌다 */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제시어나 힌트로 찾기"
              className="min-h-[52px] w-full rounded-2xl bg-slate-50 px-4 text-base text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-orange-400 sm:min-h-[60px] sm:w-auto sm:min-w-[220px] sm:flex-1 sm:px-5 sm:text-lg"
            />
            {[
              { value: 'all' as DifficultyFilter, label: '전체' },
              { value: 1 as DifficultyFilter, label: '쉬움' },
              { value: 2 as DifficultyFilter, label: '어려움' },
            ].map((d) => (
              <button
                key={String(d.value)}
                type="button"
                onClick={() => setDifficultyFilter(d.value)}
                className={`min-h-[52px] flex-1 rounded-2xl px-4 text-sm font-semibold active:scale-95 sm:min-h-[60px] sm:flex-none sm:px-5 sm:text-base ${
                  difficultyFilter === d.value
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {d.label}
              </button>
            ))}
            {!searching &&
              categories.find((c) => c.id === selectedCategoryId)?.isCustom && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingCategory(
                      categories.find((c) => c.id === selectedCategoryId) ?? null,
                    )
                  }
                  className="min-h-[52px] shrink-0 rounded-2xl bg-slate-100 px-4 text-sm font-semibold whitespace-nowrap text-slate-500 active:scale-95 sm:min-h-[60px] sm:px-5 sm:text-base"
                >
                  주제 고치기
                </button>
              )}
          </div>

          <p className="mt-2 shrink-0 text-sm text-slate-400 sm:mt-3 sm:text-base">
            {searching ? `찾은 제시어 ${visibleWords.length}개` : `${visibleWords.length}개`}
            <span className="ml-2">제시어를 누르면 고칠 수 있어요.</span>
          </p>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto sm:mt-3">
            {visibleWords.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-2xl font-bold text-slate-400">
                  {searching ? '찾는 제시어가 없어요' : '이 주제에 제시어가 없어요'}
                </p>
                <p className="text-lg text-slate-400">위의 추가 단추로 넣어 보세요.</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleWords.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(w)}
                      className="flex min-h-[84px] w-full flex-col justify-center gap-1 rounded-2xl bg-slate-50 px-4 py-3 text-left active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xl font-bold text-slate-800">
                          {w.text}
                        </span>
                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                            w.difficulty === 1
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {w.difficulty === 1 ? '쉬움' : '어려움'}
                        </span>
                        {w.isCustom && (
                          <span className="shrink-0 rounded-lg bg-orange-100 px-2 py-1 text-xs font-bold text-orange-600">
                            내가 만듦
                          </span>
                        )}
                      </span>
                      <span className="truncate text-sm text-slate-400">
                        {searching && `${categoryName(w.categoryId)} · `}
                        {w.hints.length > 0 ? w.hints.join(' · ') : '힌트 없음'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {notice && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-2xl bg-slate-800 px-7 py-4 text-xl font-bold text-white shadow-lg">
          {notice}
        </div>
      )}

      {(creating || editing) && (
        <WordEditDialog
          word={editing}
          categories={categories}
          defaultCategoryId={selectedCategoryId || categories[0]?.id || ''}
          onSave={saveWord}
          onDelete={editing ? deleteWord : undefined}
          onCancel={() => {
            setEditing(null)
            setCreating(false)
          }}
        />
      )}

      {bulkAdding && (
        <BulkAddDialog
          categories={categories}
          defaultCategoryId={selectedCategoryId || categories[0]?.id || ''}
          existingTexts={existingTexts}
          onAdd={bulkAdd}
          onCancel={() => setBulkAdding(false)}
        />
      )}

      {(creatingCategory || editingCategory) && (
        <CategoryDialog
          category={editingCategory}
          wordCount={editingCategory ? countIn(editingCategory.id) : 0}
          onSave={saveCategory}
          onDelete={editingCategory ? deleteCategory : undefined}
          onCancel={() => {
            setEditingCategory(null)
            setCreatingCategory(false)
          }}
        />
      )}

      {resetKind === 'defaults' && (
        <ConfirmDialog
          title="기본 제시어를 처음 상태로 되돌릴까요?"
          message="직접 만든 제시어와 주제는 그대로 남아요."
          confirmLabel="되돌리기"
          tone="normal"
          onConfirm={runReset}
          onCancel={() => setResetKind(null)}
        />
      )}
      {resetKind === 'all' && (
        <ConfirmDialog
          title="전부 처음 상태로 되돌릴까요?"
          message="직접 만든 제시어와 주제까지 모두 사라져요."
          confirmLabel="모두 되돌리기"
          onConfirm={runReset}
          onCancel={() => setResetKind(null)}
        />
      )}
    </div>
  )
}
