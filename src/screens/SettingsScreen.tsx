import { useState } from 'react'
import type { AppSettings, Screen } from '../types'
import { Section, Toggle } from '../components/SettingControls'
import ConfirmDialog from '../components/ConfirmDialog'
import { clearRecentWordIds, loadRecentWordIds } from '../lib/storage'
import { playCorrect, setSoundEnabled } from '../lib/sound'

interface Props {
  settings: AppSettings
  onChange: (next: AppSettings) => void
  navigate: (screen: Screen) => void
}

export default function SettingsScreen({ settings, onChange, navigate }: Props) {
  const [askClearRecent, setAskClearRecent] = useState(false)
  const [recentCount, setRecentCount] = useState(() => loadRecentWordIds().length)

  const toggleSound = (next: boolean) => {
    setSoundEnabled(next)
    onChange({ ...settings, soundEnabled: next })
    if (next) playCorrect()
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-4 px-6 py-4">
        <button
          type="button"
          onClick={() => navigate({ name: 'home' })}
          className="min-h-[60px] rounded-2xl bg-white px-6 text-lg font-semibold text-slate-600 shadow-sm active:scale-95"
        >
          ← 홈
        </button>
        <h1 className="text-3xl font-extrabold text-orange-600">설정</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <Section title="소리">
            <Toggle
              checked={settings.soundEnabled}
              onChange={toggleSound}
              label="효과음 켜기"
              description="정답과 패스, 마지막 10초 초읽기 소리가 나요"
            />
            <p className="mt-3 text-sm text-slate-400">
              아이패드 옆면의 무음 스위치가 켜져 있으면 소리가 나지 않아요.
            </p>
          </Section>

          <Section title="지난 게임 기록" hint={`${recentCount}개 기억 중`}>
            <p className="text-lg text-slate-500">
              앞판에 나온 제시어는 다음 판에서 뒤로 미뤄져요. 연달아 게임해도 같은 제시어가 잘 나오지
              않게 하는 기능이에요.
            </p>
            <button
              type="button"
              onClick={() => setAskClearRecent(true)}
              disabled={recentCount === 0}
              className="mt-4 min-h-[60px] rounded-2xl bg-slate-100 px-6 text-lg font-semibold text-slate-600 disabled:opacity-40 active:scale-95"
            >
              기록 지우기
            </button>
          </Section>

          <Section title="제시어">
            <p className="text-lg text-slate-500">
              제시어를 넣고 고치거나, 내 주제를 만들고, 파일로 주고받을 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => navigate({ name: 'words' })}
              className="mt-4 min-h-[60px] rounded-2xl bg-orange-500 px-7 text-lg font-bold text-white active:scale-95"
            >
              📚 제시어 관리로 가기
            </button>
          </Section>

          <Section title="이 앱">
            <p className="text-lg text-slate-500">
              인터넷 없이도 돌아가요. 사파리에서 공유 단추를 누르고 홈 화면에 추가하면 앱처럼 전체
              화면으로 열려요.
            </p>
          </Section>
        </div>
      </div>

      {askClearRecent && (
        <ConfirmDialog
          title="지난 게임 기록을 지울까요?"
          message="다음 판에서 모든 제시어가 다시 후보가 돼요."
          confirmLabel="지우기"
          tone="normal"
          onConfirm={() => {
            clearRecentWordIds()
            setRecentCount(0)
            setAskClearRecent(false)
          }}
          onCancel={() => setAskClearRecent(false)}
        />
      )}
    </div>
  )
}
