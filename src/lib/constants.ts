// localStorage 키 (스펙 고정)
export const STORAGE_KEYS = {
  words: 'charades.words',
  categories: 'charades.categories',
  settings: 'charades.settings',
  lastGame: 'charades.lastGame',
  liarGame: 'charades.liarGame',
  dataVersion: 'charades.dataVersion',
  bombGame: 'charades.bombGame',
  recentWords: 'charades.recentWords',
} as const

/**
 * 지난 게임에 나온 제시어를 몇 개까지 기억할지.
 * 같은 날 두 번째, 세 번째 판을 해도 앞판 제시어가 다시 나오지 않게 뒤로 미루는 데 쓴다.
 */
export const RECENT_MEMORY = 600

/**
 * 기본 제시어 데이터의 판 번호.
 * 이 번호를 올리면 이미 앱을 쓰던 기기에서도 기본 제시어가 새것으로 바뀐다.
 * 사용자가 직접 만든 제시어와 주제는 그대로 남는다.
 */
export const DATA_VERSION = 2

// 게임 설정 선택지
/** 팀 대항전: 한 팀이 설명하는 시간 */
export const TIME_PRESETS = [30, 60, 90, 120] as const
export const DEFAULT_TIME_LIMIT = 60
/** 릴레이전: 팀 전체가 나눠 쓰는 시간이라 훨씬 길게 잡는다 */
export const RELAY_TIME_PRESETS = [120, 180, 300, 480] as const
export const DEFAULT_RELAY_TIME_LIMIT = 180
export const PASS_PRESETS = [0, 1, 2, 3, 'unlimited'] as const

// 팀 대항전
export const MIN_TEAMS = 2
export const MAX_TEAMS = 4
export const DEFAULT_TEAM_NAMES = ['빨강 팀', '파랑 팀', '노랑 팀', '초록 팀']
export const DEFAULT_ROUNDS_PER_TEAM = 2

// 릴레이전
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 8
export const DEFAULT_WORDS_PER_PLAYER = 3

// 라이어 게임
/** 시민 둘에 라이어 하나는 있어야 게임이 성립한다 */
export const LIAR_MIN_PLAYERS = 3
export const LIAR_MAX_PLAYERS = 10
export const DEFAULT_LIAR_PLAYERS = 5
/** 한 사람이 설명하는 시간. 0은 시간을 재지 않는다는 뜻이다 */
export const LIAR_SPEAK_PRESETS = [0, 15, 30, 45] as const
export const DEFAULT_LIAR_SPEAK_SEC = 30
export const DEFAULT_LIAR_ROUNDS = 1
export const LIAR_MAX_ROUNDS = 3

// 폭탄 돌리기
/**
 * 폭탄이 터지기까지의 시간 범위. 판마다 이 사이에서 무작위로 정해진다.
 * 폭이 좁으면 언제쯤 터질지 짐작이 되고, 넓으면 끝까지 알 수 없다.
 */
export const BOMB_FUSE_PRESETS = [
  { label: '짧게', minSec: 15, maxSec: 35 },
  { label: '보통', minSec: 30, maxSec: 60 },
  { label: '길게', minSec: 45, maxSec: 90 },
  { label: '아주 길게', minSec: 60, maxSec: 150 },
] as const

export const DEFAULT_BOMB_FUSE = BOMB_FUSE_PRESETS[1]

/** 마지막 이만큼이 남으면 째깍 소리가 빨라진다 (전체 시간에 대한 비율) */
export const BOMB_HURRY_RATIO = 0.25

// 제시어당 힌트 최대 개수
export const MAX_HINTS = 3
