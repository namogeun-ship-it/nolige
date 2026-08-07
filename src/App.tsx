import { useEffect, useState } from 'react'
import type { AppSettings, Category, GameSettings, GameState, Screen, Word } from './types'
import {
  loadAppSettings,
  loadCategories,
  loadGameState,
  loadWords,
  saveAppSettings,
  saveCategories,
  saveWords,
} from './lib/storage'
import { useGame } from './hooks/useGame'
import HomeScreen from './screens/HomeScreen'
import GameSetupScreen from './screens/GameSetupScreen'
import PlayScreen from './screens/PlayScreen'
import HandoffScreen from './screens/HandoffScreen'
import RoundResultScreen from './screens/RoundResultScreen'
import FinalResultScreen from './screens/FinalResultScreen'
import WordsScreen from './screens/WordsScreen'
import SettingsScreen from './screens/SettingsScreen'
import { useWakeLock } from './hooks/useWakeLock'
import { primeSound, setSoundEnabled } from './lib/sound'

// 외부 라우터 없이 useState 기반 화면 전환.
// GitHub Pages 정적 호스팅에서 경로 문제(새로고침 404)가 없고,
// 게임 진행 상태 복구(localStorage)와도 자연스럽게 맞물린다.
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [words, setWords] = useState<Word[]>(() => loadWords())
  const [categories, setCategories] = useState<Category[]>(() => loadCategories())
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings())
  // 새로고침이나 실수로 나갔을 때 되살릴 수 있게 시작하자마자 한 번 읽어 둔다
  const [resumable, setResumable] = useState<GameState | null>(() => loadGameState())

  const game = useGame(words)

  // 게임 중에는 화면이 꺼지지 않게 붙잡아 둔다
  useWakeLock(game.game !== null)

  // 사파리는 화면을 한 번 만져야 소리를 낼 수 있어서, 첫 터치 때 오디오를 깨운다
  useEffect(() => {
    setSoundEnabled(appSettings.soundEnabled)
    const wake = () => primeSound()
    window.addEventListener('pointerdown', wake, { once: true })
    return () => window.removeEventListener('pointerdown', wake)
  }, [appSettings.soundEnabled])

  const handleAppSettingsChange = (next: AppSettings) => {
    setAppSettings(next)
    saveAppSettings(next)
  }

  const handleStart = (settings: GameSettings) => {
    setResumable(null)
    const next: AppSettings =
      settings.mode === 'team'
        ? { ...appSettings, lastTeamSettings: settings }
        : { ...appSettings, lastRelaySettings: settings }
    setAppSettings(next)
    saveAppSettings(next)
    game.startGame(settings)
  }

  /** 제시어 관리 화면에서 목록이 바뀌면 바로 저장한다 */
  const handleWordDataChange = (next: { words: Word[]; categories: Category[] }) => {
    setWords(next.words)
    setCategories(next.categories)
    saveWords(next.words)
    saveCategories(next.categories)
  }

  const handleResume = () => {
    if (!resumable) return
    game.resumeGame(resumable)
    setResumable(null)
  }

  const handleQuit = () => {
    game.quitGame()
    setResumable(null)
    setScreen({ name: 'home' })
  }

  // 게임이 진행 중이면 어느 화면을 보여줄지는 게임 상태가 정한다
  if (game.game) {
    const state = game.game
    if (state.phase === 'countdown' || state.phase === 'playing') {
      return (
        <PlayScreen
          game={state}
          currentWord={game.currentWord}
          onBeginPlaying={game.beginPlaying}
          onCorrect={game.markCorrect}
          onPass={game.markPass}
          onEndTurnEarly={game.endTurnEarly}
          onQuit={handleQuit}
        />
      )
    }
    if (state.phase === 'handoff') {
      return <HandoffScreen game={state} onReady={game.beginNextPerformer} />
    }
    if (state.phase === 'round-result') {
      return (
        <RoundResultScreen
          game={state}
          onToggleEntry={game.toggleEntryResult}
          onNext={game.goToNextTurn}
          onQuit={handleQuit}
        />
      )
    }
    return (
      <FinalResultScreen
        game={state}
        onToggleEntry={game.toggleEntryResult}
        onPlayAgain={game.playAgain}
        onGoHome={handleQuit}
      />
    )
  }

  return (
    <div className="h-full overflow-hidden">
      {screen.name === 'home' && (
        <HomeScreen
          navigate={setScreen}
          resumable={resumable}
          onResume={handleResume}
          onDiscardResume={() => setResumable(null)}
        />
      )}
      {screen.name === 'setup' && (
        <GameSetupScreen
          mode={screen.mode}
          words={words}
          categories={categories}
          lastTeamSettings={appSettings.lastTeamSettings}
          lastRelaySettings={appSettings.lastRelaySettings}
          onStart={handleStart}
          onBack={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'words' && (
        <WordsScreen
          words={words}
          categories={categories}
          onChange={handleWordDataChange}
          navigate={setScreen}
        />
      )}
      {screen.name === 'settings' && (
        <SettingsScreen
          settings={appSettings}
          onChange={handleAppSettingsChange}
          navigate={setScreen}
        />
      )}
    </div>
  )
}
