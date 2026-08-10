// ─────────────────────────────────────────────
// 제시어 데이터
// ─────────────────────────────────────────────

/** 1=쉬움(2~3학년) 2=어려움(4~5학년 이상) */
export type Difficulty = 1 | 2

export interface Word {
  id: string
  text: string
  categoryId: string
  difficulty: Difficulty
  /** 최대 3개, 제시어 자체 단어는 포함 금지 */
  hints: string[]
  isCustom: boolean
}

export interface Category {
  id: string
  name: string
  emoji: string
  isCustom: boolean
}

// ─────────────────────────────────────────────
// 게임 설정
// ─────────────────────────────────────────────

/** 앱에 들어 있는 게임 종류. 둘 다 같은 제시어 데이터를 쓴다. */
export type GameKind = 'charades' | 'liar'

export type GameMode = 'team' | 'relay'

/** 출제 난이도: 특정 난이도 하나 또는 '섞기' */
export type DifficultySetting = Difficulty | 'mix'

/** 설명 방식: 몸으로만 / 말 설명 허용(기본값) */
export type ExplainRule = 'body-only' | 'speech-allowed'

/** 패스 허용 횟수: 0~3 또는 무제한 */
export type PassLimit = number | 'unlimited'

interface BaseGameSettings {
  /** 복수 선택된 주제 id 목록 */
  categoryIds: string[]
  difficulty: DifficultySetting
  explainRule: ExplainRule
  timeLimitSec: number
  passLimit: PassLimit
  hintsEnabled: boolean
}

export interface TeamGameSettings extends BaseGameSettings {
  mode: 'team'
  /** 팀 이름 목록 (2~4팀) */
  teamNames: string[]
  /** 각 팀이 몇 번 설명할지 */
  roundsPerTeam: number
}

/**
 * 릴레이전은 편을 가르지 않는 협동 단체전이다.
 * 제한 시간 하나를 다 같이 쓰고, 돌아가며 자기 몫을 설명해서
 * 시간 안에 전원이 몫을 채우면 통과한다. 개인 순위는 매기지 않는다.
 */
export interface RelayGameSettings extends BaseGameSettings {
  mode: 'relay'
  /** 참가자 이름 목록 (2~8명) */
  playerNames: string[]
  /** 한 사람이 맞혀야 하는 제시어 개수 */
  wordsPerPlayer: number
}

export type GameSettings = TeamGameSettings | RelayGameSettings

// ─────────────────────────────────────────────
// 게임 진행 상태 (localStorage 복구 대상)
// ─────────────────────────────────────────────

export type WordResult = 'correct' | 'pass'

/** 한 턴에서 출제된 제시어 하나의 결과 */
export interface TurnWordEntry {
  wordId: string
  /** 단어가 나중에 수정·삭제돼도 결과 화면에 그대로 보이도록 텍스트 스냅샷 저장 */
  text: string
  result: WordResult
}

/**
 * 한 사람(팀)이 이어서 설명한 구간 하나.
 * 팀전은 한 팀의 한 차례, 릴레이전은 다음 사람에게 넘길 때까지의 구간이다.
 * 릴레이전에서는 패스로 차례가 넘어가므로 같은 사람이 여러 구간을 가질 수 있다.
 */
export interface TurnRecord {
  /** 팀전=팀 인덱스, 릴레이전=참가자 인덱스 */
  performerIndex: number
  entries: TurnWordEntry[]
  /** 이 구간에 걸린 시간(초) */
  elapsedSec: number
}

/** handoff는 릴레이전에서 다음 사람에게 기기를 넘기는 동안 시간을 멈춰 두는 화면이다. */
export type GamePhase = 'countdown' | 'playing' | 'handoff' | 'round-result' | 'final-result'

export interface GameState {
  settings: GameSettings
  phase: GamePhase
  /** 현재 몇 번째 턴인지 (0부터) */
  turnIndex: number
  /** 턴별 기록. turns[turnIndex]가 진행 중인 턴 */
  turns: TurnRecord[]
  /** 게임을 시작할 때 뽑아서 섞어 둔 제시어 묶음 (제시어 id 순서) */
  deck: string[]
  /** 묶음에서 다음에 꺼낼 자리. 여기까지는 이미 나온 제시어다 */
  deckIndex: number
  /** 이번 판에서 이미 나온 제시어 전부. 묶음을 다시 만들 때 겹치지 않게 쓴다 */
  usedWordIds: string[]
  /** 화면에 떠 있는 제시어. 새로고침해도 같은 제시어로 돌아온다 */
  currentWordId: string | null
  /** 남은 시간(초). 새로고침 복구용으로 계속 갱신된다 */
  remainingSec: number
}

// ─────────────────────────────────────────────
// 라이어 게임
// 같은 제시어 데이터를 쓰지만 진행 방식이 전혀 달라서 상태를 따로 둔다.
// 기기 하나를 돌려 가며 제시어를 확인하고, 말로 설명하고, 투표로 라이어를 찾는다.
// ─────────────────────────────────────────────

/** 투표 방식: 앱으로 한 명씩 비밀투표 / 손으로 지목하고 결과만 입력 */
export type LiarVoteMode = 'app' | 'manual'

/**
 * 라이어가 아닌 사람을 지목했을 때 어떻게 할지.
 * liar-wins   = 그대로 라이어 승리
 * revote      = 설명 없이 그 자리에서 한 번 더 투표
 * extra-round = 설명을 한 바퀴 더 돌고 다시 투표
 */
export type LiarWrongPick = 'liar-wins' | 'revote' | 'extra-round'

export interface LiarSettings {
  /** 복수 선택된 주제 id 목록 */
  categoryIds: string[]
  difficulty: DifficultySetting
  /** 참가자 이름 목록 (3~10명) */
  playerNames: string[]
  /** 라이어에게 주제까지는 알려줄지. 켜 두면 라이어가 아주 막막하지는 않다 */
  tellCategoryToLiar: boolean
  /** 설명을 몇 바퀴 돌지 */
  rounds: number
  /** 한 사람이 설명하는 제한 시간(초). 0이면 시간을 재지 않는다 */
  speakSec: number
  voteMode: LiarVoteMode
  wrongPick: LiarWrongPick
}

/**
 * reveal  = 기기를 돌려 가며 각자 제시어(또는 라이어 통보)를 확인
 * talk    = 순서대로 제시어를 설명
 * vote     = 라이어로 의심되는 사람에게 투표
 * tally    = 개표 결과 확인
 * guess    = 지목당한 라이어가 제시어를 맞혀 보는 마지막 기회
 * innocent = 지목당한 사람이 시민이었음을 알리는 화면
 * result   = 제시어와 라이어 공개, 승패
 */
export type LiarPhase = 'reveal' | 'talk' | 'vote' | 'tally' | 'guess' | 'innocent' | 'result'

export interface LiarGameState {
  settings: LiarSettings
  phase: LiarPhase
  /** 이번 판 제시어 */
  wordId: string
  /** 제시어가 나중에 수정·삭제돼도 결과 화면에 그대로 보이도록 텍스트 스냅샷 저장 */
  wordText: string
  /** 제시어가 속한 주제 이름 스냅샷 */
  categoryName: string
  /** 라이어인 참가자 번호 */
  liarIndex: number
  /** 설명하는 순서 (참가자 번호를 섞어 둔 배열) */
  order: number[]
  /** 제시어 확인을 마친 사람 수. order 기준 앞에서부터 센다 */
  revealedCount: number
  /** 지금 몇 바퀴째인지 (1부터) */
  round: number
  /** 이번 바퀴에서 order의 몇 번째 사람이 말하는 중인지 (0부터) */
  speakAt: number
  /** 발언 남은 시간(초). 시간을 재지 않는 설정이면 쓰지 않는다 */
  remainingSec: number
  /** 앱 투표에서 지금 몇 번째 사람이 투표할 차례인지 (order 기준) */
  voteAt: number
  /** votes[참가자번호] = 그 사람이 지목한 참가자 번호 */
  votes: (number | null)[]
  /** 최종적으로 지목된 참가자 */
  accusedIndex: number | null
  /** 라이어가 제시어를 맞혔는지 */
  liarGuessedRight: boolean | null
  /** 이번 판 승자 */
  winner: 'citizens' | 'liar' | null
  /** 시민이 엉뚱한 사람을 지목해서 한 바퀴를 더 돈 적이 있는지 */
  extraRoundUsed: boolean
  /** 설명 없이 바로 다시 지목할 기회를 이미 쓴 적이 있는지 */
  revoteUsed: boolean
  /** 이어서 여러 판을 할 때의 누적 전적 */
  tally: { citizens: number; liar: number }
  /** 이어서 여러 판을 해도 같은 제시어가 안 나오게 섞어 둔 묶음 */
  deck: string[]
  deckIndex: number
  /** 이 자리에서 이미 나온 제시어 */
  usedWordIds: string[]
}

// ─────────────────────────────────────────────
// 앱 전역 설정 + 화면 라우팅
// ─────────────────────────────────────────────

export interface AppSettings {
  soundEnabled: boolean
  /** 모드별 마지막 게임 설정 기억 → 다음 판 기본값 */
  lastTeamSettings?: TeamGameSettings
  lastRelaySettings?: RelayGameSettings
  lastLiarSettings?: LiarSettings
}

/** 게임이 진행 중일 때는 phase가 화면을 정하고, 그 밖에는 이 값이 정한다. */
export type Screen =
  | { name: 'home' }
  | { name: 'charades' }
  | { name: 'setup'; mode: GameMode }
  | { name: 'liar-setup' }
  | { name: 'words' }
  | { name: 'settings' }

/** 하던 게임 이어서 하기. 두 게임 중 나중에 한 쪽만 남는다. */
export type Resumable =
  | { kind: 'charades'; state: GameState }
  | { kind: 'liar'; state: LiarGameState }
