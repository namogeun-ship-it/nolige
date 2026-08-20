import type {
  AppSettings,
  BombGameState,
  Category,
  Difficulty,
  GameState,
  LiarGameState,
  Word,
} from '../types'
import { DEFAULT_CATEGORIES, DEFAULT_WORDS } from '../data/defaultWords'
import { DATA_VERSION, MAX_HINTS, RECENT_MEMORY, STORAGE_KEYS } from './constants'

// ─────────────────────────────────────────────
// 저수준 접근. 사파리 비공개 모드처럼 localStorage를 못 쓰는 환경에서도
// 앱이 죽지 않도록 메모리 저장소로 넘어간다.
// ─────────────────────────────────────────────

const memoryFallback = new Map<string, string>()
let useMemory = false

function readRaw(key: string): string | null {
  if (useMemory) return memoryFallback.get(key) ?? null
  try {
    return window.localStorage.getItem(key)
  } catch {
    useMemory = true
    return memoryFallback.get(key) ?? null
  }
}

function writeRaw(key: string, value: string): void {
  if (!useMemory) {
    try {
      window.localStorage.setItem(key, value)
      return
    } catch {
      // 용량 초과이거나 접근이 막힌 경우
      useMemory = true
    }
  }
  memoryFallback.set(key, value)
}

function removeRaw(key: string): void {
  memoryFallback.delete(key)
  if (useMemory) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    useMemory = true
  }
}

function readJSON<T>(key: string): T | null {
  const raw = readRaw(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    // 저장된 값이 깨졌으면 버리고 기본값으로 되돌린다
    removeRaw(key)
    return null
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    writeRaw(key, JSON.stringify(value))
  } catch {
    // 직렬화 실패는 조용히 넘긴다. 저장이 안 될 뿐 게임 진행은 계속돼야 한다.
  }
}

// ─────────────────────────────────────────────
// 검증. 손상된 저장본이나 남이 만든 백업 파일을 그대로 믿지 않는다.
// ─────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function sanitizeCategory(raw: unknown): Category | null {
  if (typeof raw !== 'object' || raw === null) return null
  const c = raw as Record<string, unknown>
  if (!isNonEmptyString(c.id) || !isNonEmptyString(c.name)) return null
  return {
    id: c.id.trim(),
    name: c.name.trim(),
    emoji: isNonEmptyString(c.emoji) ? c.emoji : '📌',
    isCustom: c.isCustom === true,
  }
}

function sanitizeWord(raw: unknown): Word | null {
  if (typeof raw !== 'object' || raw === null) return null
  const w = raw as Record<string, unknown>
  if (!isNonEmptyString(w.id) || !isNonEmptyString(w.text) || !isNonEmptyString(w.categoryId)) {
    return null
  }
  // 난이도가 3단계이던 시절의 '보통'과 '어려움'은 모두 '어려움'으로 옮긴다
  const difficulty: Difficulty = w.difficulty === 2 || w.difficulty === 3 ? 2 : 1
  const hints = Array.isArray(w.hints)
    ? w.hints.filter(isNonEmptyString).map((h) => h.trim()).slice(0, MAX_HINTS)
    : []
  return {
    id: w.id.trim(),
    text: w.text.trim(),
    categoryId: w.categoryId.trim(),
    difficulty,
    hints,
    isCustom: w.isCustom === true,
  }
}

function sanitizeCategories(raw: unknown): Category[] | null {
  if (!Array.isArray(raw)) return null
  const list = raw.map(sanitizeCategory).filter((c): c is Category => c !== null)
  return list.length > 0 ? dedupeById(list) : null
}

function sanitizeWords(raw: unknown): Word[] | null {
  if (!Array.isArray(raw)) return null
  const list = raw.map(sanitizeWord).filter((w): w is Word => w !== null)
  return list.length > 0 ? dedupeById(list) : null
}

function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

// ─────────────────────────────────────────────
// 주제 / 제시어
// ─────────────────────────────────────────────

/** 저장된 기본 제시어가 옛 판인지 확인한다. */
function storedDataVersion(): number {
  const raw = readJSON<number>(STORAGE_KEYS.dataVersion)
  return typeof raw === 'number' ? raw : 1
}

/**
 * 기본 제시어가 새 판으로 바뀌었으면 갈아 끼운다.
 * 사용자가 직접 만든 제시어와 주제는 그대로 남기고 기본 제시어만 교체한다.
 */
function migrateDefaultsIfNeeded(): void {
  if (storedDataVersion() >= DATA_VERSION) return
  const oldWords = sanitizeWords(readJSON(STORAGE_KEYS.words))
  const oldCategories = sanitizeCategories(readJSON(STORAGE_KEYS.categories))
  if (oldWords) writeJSON(STORAGE_KEYS.words, [...DEFAULT_WORDS, ...oldWords.filter((w) => w.isCustom)])
  if (oldCategories) {
    writeJSON(STORAGE_KEYS.categories, [
      ...DEFAULT_CATEGORIES,
      ...oldCategories.filter((c) => c.isCustom),
    ])
  }
  writeJSON(STORAGE_KEYS.dataVersion, DATA_VERSION)
}

/** 저장된 주제 목록. 처음 실행이면 기본값을 심어서 돌려준다. */
export function loadCategories(): Category[] {
  migrateDefaultsIfNeeded()
  const stored = sanitizeCategories(readJSON(STORAGE_KEYS.categories))
  if (stored) return stored
  writeJSON(STORAGE_KEYS.categories, DEFAULT_CATEGORIES)
  writeJSON(STORAGE_KEYS.dataVersion, DATA_VERSION)
  // 모듈 상수를 그대로 넘기면 호출한 쪽에서 건드렸을 때 기본값이 오염된다
  return [...DEFAULT_CATEGORIES]
}

export function saveCategories(categories: Category[]): void {
  writeJSON(STORAGE_KEYS.categories, categories)
}

/** 저장된 제시어 목록. 처음 실행이면 기본 300개를 심어서 돌려준다. */
export function loadWords(): Word[] {
  migrateDefaultsIfNeeded()
  const stored = sanitizeWords(readJSON(STORAGE_KEYS.words))
  if (stored) return stored
  writeJSON(STORAGE_KEYS.words, DEFAULT_WORDS)
  writeJSON(STORAGE_KEYS.dataVersion, DATA_VERSION)
  return [...DEFAULT_WORDS]
}

export function saveWords(words: Word[]): void {
  writeJSON(STORAGE_KEYS.words, words)
}

/**
 * 기본 제시어만 처음 상태로 되돌린다. 사용자가 직접 만든 제시어와 주제는 그대로 둔다.
 * 기본 제시어를 지웠거나 고쳐 놨을 때 복구하는 용도.
 */
export function restoreDefaultWords(currentWords: Word[], currentCategories: Category[]) {
  const customWords = currentWords.filter((w) => w.isCustom)
  const customCategories = currentCategories.filter((c) => c.isCustom)
  const words = [...DEFAULT_WORDS, ...customWords]
  const categories = [...DEFAULT_CATEGORIES, ...customCategories]
  saveWords(words)
  saveCategories(categories)
  return { words, categories }
}

/** 사용자가 만든 것까지 포함해 제시어 데이터를 전부 처음 상태로 되돌린다. */
export function resetAllWordData() {
  saveWords(DEFAULT_WORDS)
  saveCategories(DEFAULT_CATEGORIES)
  removeRaw(STORAGE_KEYS.recentWords)
  return { words: [...DEFAULT_WORDS], categories: [...DEFAULT_CATEGORIES] }
}

// ─────────────────────────────────────────────
// 앱 설정
// ─────────────────────────────────────────────

export const DEFAULT_APP_SETTINGS: AppSettings = {
  soundEnabled: true,
}

export function loadAppSettings(): AppSettings {
  const stored = readJSON<Partial<AppSettings>>(STORAGE_KEYS.settings)
  if (!stored || typeof stored !== 'object') return DEFAULT_APP_SETTINGS
  return {
    ...DEFAULT_APP_SETTINGS,
    ...stored,
    soundEnabled: stored.soundEnabled !== false,
  }
}

export function saveAppSettings(settings: AppSettings): void {
  writeJSON(STORAGE_KEYS.settings, settings)
}

// ─────────────────────────────────────────────
// 진행 중인 게임 (새로고침·뒤로 가기 복구용)
// ─────────────────────────────────────────────

export function loadGameState(): GameState | null {
  const stored = readJSON<GameState>(STORAGE_KEYS.lastGame)
  if (!stored || typeof stored !== 'object') return null
  // 최소한의 형태 검사. 하나라도 어긋나면 복구를 포기한다.
  if (!stored.settings || !Array.isArray(stored.turns) || !Array.isArray(stored.deck)) {
    removeRaw(STORAGE_KEYS.lastGame)
    return null
  }
  return stored
}

export function saveGameState(state: GameState): void {
  writeJSON(STORAGE_KEYS.lastGame, state)
}

export function clearGameState(): void {
  removeRaw(STORAGE_KEYS.lastGame)
}

export function loadLiarGameState(): LiarGameState | null {
  const stored = readJSON<LiarGameState>(STORAGE_KEYS.liarGame)
  if (!stored || typeof stored !== 'object') return null
  // 최소한의 형태 검사. 하나라도 어긋나면 복구를 포기한다.
  if (
    !stored.settings ||
    !Array.isArray(stored.settings.playerNames) ||
    !Array.isArray(stored.order) ||
    !Array.isArray(stored.votes) ||
    typeof stored.liarIndex !== 'number'
  ) {
    removeRaw(STORAGE_KEYS.liarGame)
    return null
  }
  return stored
}

export function saveLiarGameState(state: LiarGameState): void {
  writeJSON(STORAGE_KEYS.liarGame, state)
}

export function clearLiarGameState(): void {
  removeRaw(STORAGE_KEYS.liarGame)
}

export function loadBombGameState(): BombGameState | null {
  const stored = readJSON<BombGameState>(STORAGE_KEYS.bombGame)
  if (!stored || typeof stored !== 'object') return null
  // 최소한의 형태 검사. 하나라도 어긋나면 복구를 포기한다.
  if (
    !stored.settings ||
    !stored.topic ||
    typeof stored.topic.label !== 'string' ||
    // 힌트 데이터의 모양이 바뀌기 전에 저장된 게임은 되살리지 않는다
    !Array.isArray(stored.topic.answers) ||
    typeof stored.round !== 'number' ||
    typeof stored.fuseSec !== 'number'
  ) {
    removeRaw(STORAGE_KEYS.bombGame)
    return null
  }
  return stored
}

export function saveBombGameState(state: BombGameState): void {
  writeJSON(STORAGE_KEYS.bombGame, state)
}

export function clearBombGameState(): void {
  removeRaw(STORAGE_KEYS.bombGame)
}

// ─────────────────────────────────────────────
// 지난 게임 기록
// 같은 날 두 번째, 세 번째 판을 해도 앞판에 나온 제시어가 또 나오지 않게 한다.
// ─────────────────────────────────────────────

/** 최근에 나왔던 제시어 id. 앞쪽일수록 오래된 것이다. */
export function loadRecentWordIds(): string[] {
  const stored = readJSON<unknown>(STORAGE_KEYS.recentWords)
  return Array.isArray(stored) ? stored.filter(isNonEmptyString) : []
}

/** 이번 판에 나온 제시어를 기록에 더한다. 오래된 것부터 밀려난다. */
export function rememberUsedWordIds(usedWordIds: string[]): void {
  if (usedWordIds.length === 0) return
  const previous = loadRecentWordIds()
  // 이번 판에 또 나온 제시어는 가장 최근 것으로 옮긴다
  const justUsed = new Set(usedWordIds)
  const merged = [...previous.filter((id) => !justUsed.has(id)), ...usedWordIds]
  const trimmed = merged.length > RECENT_MEMORY ? merged.slice(merged.length - RECENT_MEMORY) : merged
  writeJSON(STORAGE_KEYS.recentWords, trimmed)
}

/** 제시어 관리에서 초기화할 때 같이 비운다. */
export function clearRecentWordIds(): void {
  removeRaw(STORAGE_KEYS.recentWords)
}

// ─────────────────────────────────────────────
// JSON 내보내기 / 가져오기
// ─────────────────────────────────────────────

export interface WordBackup {
  app: 'charades'
  version: 1
  exportedAt: string
  categories: Category[]
  words: Word[]
}

export function buildBackup(words: Word[], categories: Category[]): WordBackup {
  return {
    app: 'charades',
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    words,
  }
}

export type ImportResult =
  | { ok: true; words: Word[]; categories: Category[] }
  | { ok: false; error: string }

/** 내보내기 파일을 읽어 들인다. 형식이 어긋나면 이유를 한국어로 돌려준다. */
export function parseBackup(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: '파일 내용이 올바른 JSON 형식이 아닙니다.' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: '파일 내용이 비어 있거나 형식이 맞지 않습니다.' }
  }
  const backup = parsed as Partial<WordBackup>
  const words = sanitizeWords(backup.words)
  if (!words) {
    return { ok: false, error: '제시어 목록을 찾지 못했습니다. 이 앱에서 내보낸 파일이 맞는지 확인해 주세요.' }
  }
  const categories = sanitizeCategories(backup.categories) ?? DEFAULT_CATEGORIES
  // 주제가 사라진 제시어가 있으면 그 주제를 만들어 붙여 준다
  const known = new Set(categories.map((c) => c.id))
  const restored = [...categories]
  for (const w of words) {
    if (!known.has(w.categoryId)) {
      known.add(w.categoryId)
      restored.push({ id: w.categoryId, name: w.categoryId, emoji: '📌', isCustom: true })
    }
  }
  return { ok: true, words, categories: restored }
}

/** 새 제시어·주제에 붙일 id. 시간과 난수를 섞어 겹치지 않게 만든다. */
export function createId(prefix: 'w' | 'c'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
