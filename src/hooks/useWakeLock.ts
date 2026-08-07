import { useEffect, useRef } from 'react'

interface WakeLockSentinelLike {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>
}

/**
 * 게임 중에 아이패드 화면이 꺼지지 않게 붙잡아 둔다.
 * 이 기능이 없는 기기에서는 아무 일도 하지 않는다.
 */
export function useWakeLock(active: boolean): void {
  const sentinel = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    const wakeLock = (navigator as unknown as { wakeLock?: WakeLockLike }).wakeLock
    if (!active || !wakeLock) return

    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        sentinel.current = await wakeLock.request('screen')
      } catch {
        // 배터리 절약 모드 등으로 거절될 수 있다. 게임 진행에는 지장이 없다
      }
    }

    // 다른 앱에 갔다 돌아오면 잠금이 풀려 있으므로 다시 잡는다
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinel.current?.released) return
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void sentinel.current?.release().catch(() => {})
      sentinel.current = null
    }
  }, [active])
}
