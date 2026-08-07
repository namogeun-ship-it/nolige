import { useLayoutEffect, useRef } from 'react'

interface Props {
  text: string
}

/** 글자 수와 상관없이 제시어가 화면을 꽉 채우도록 폰트 크기를 자동으로 맞춘다. */
const MAX_FONT_PX = 420
const BASE_FONT_PX = 100

export default function ScaledWord({ text }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const el = textRef.current
    if (!box || !el) return

    const fit = () => {
      // 기준 크기로 한 번 그려 보고 남는 공간만큼 배율을 잡는다
      el.style.fontSize = `${BASE_FONT_PX}px`
      const naturalWidth = el.scrollWidth
      const naturalHeight = el.scrollHeight
      if (naturalWidth === 0 || naturalHeight === 0) return
      const byWidth = (box.clientWidth * 0.94) / naturalWidth
      const byHeight = (box.clientHeight * 0.92) / naturalHeight
      const next = Math.min(BASE_FONT_PX * byWidth, BASE_FONT_PX * byHeight, MAX_FONT_PX)
      el.style.fontSize = `${Math.max(24, next)}px`
    }

    fit()
    // 힌트가 펼쳐지거나 화면을 돌리면 다시 맞춘다
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [text])

  return (
    <div ref={boxRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <span
        ref={textRef}
        key={text}
        className="animate-card-in block leading-none font-extrabold tracking-tight whitespace-nowrap text-slate-900"
      >
        {text}
      </span>
    </div>
  )
}
