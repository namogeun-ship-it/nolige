import type { Category, Difficulty, Word } from '../types'
import type { CategorySeeds } from './words/seedTypes'
import animal from './words/animal'
import food from './words/food'
import sport from './words/sport'
import job from './words/job'
import person from './words/person'
import object from './words/object'
import place from './words/place'
import action from './words/action'
import emotion from './words/emotion'
import character from './words/character'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'animal', name: '동물', emoji: '🐶', isCustom: false },
  { id: 'food', name: '음식', emoji: '🍔', isCustom: false },
  { id: 'sport', name: '스포츠', emoji: '⚽', isCustom: false },
  { id: 'job', name: '직업', emoji: '👷', isCustom: false },
  { id: 'person', name: '인물', emoji: '👑', isCustom: false },
  { id: 'object', name: '사물·학용품', emoji: '✏️', isCustom: false },
  { id: 'place', name: '장소', emoji: '🏫', isCustom: false },
  { id: 'action', name: '행동·동작', emoji: '🤸', isCustom: false },
  { id: 'emotion', name: '감정', emoji: '😊', isCustom: false },
  { id: 'character', name: '만화·캐릭터', emoji: '🦸', isCustom: false },
]

const SEEDS: Record<string, CategorySeeds> = {
  animal,
  food,
  sport,
  job,
  person,
  object,
  place,
  action,
  emotion,
  character,
}

const DIFFICULTIES: Difficulty[] = [1, 2]

/** 기본 제시어 목록. id는 고정이라 사용자가 고치거나 지워도 저장본과 짝이 맞는다. */
export const DEFAULT_WORDS: Word[] = Object.entries(SEEDS).flatMap(([categoryId, byDifficulty]) =>
  DIFFICULTIES.flatMap((difficulty) =>
    byDifficulty[difficulty].map(([text, ...hints], index) => ({
      id: `w-${categoryId}-${difficulty}-${index}`,
      text,
      categoryId,
      difficulty,
      hints,
      isCustom: false,
    })),
  ),
)
