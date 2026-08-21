import { useLayoutEffect, useRef } from 'react'

interface Props {
  text: string
  /** 글자 색 등 바깥에서 정할 것. 색은 안쪽 글자에 그대로 물려받는다 */
  className?: string
  /**
   * 띄어쓰기에서 줄을 바꿔도 되는지.
   *
   * 낱말 하나를 크게 보여 줄 때는 한 줄이 낫지만,
   * "세계 여러 나라 음식"처럼 긴 글을 좁은 자리에 넣을 때는
   * 한 줄로 두면 글자가 너무 작아진다. 그럴 때만 켠다.
   */
  multiline?: boolean
}

/** 글자 수와 상관없이 제시어가 자리를 꽉 채우도록 폰트 크기를 자동으로 맞춘다. */
const MAX_FONT_PX = 420
const MIN_FONT_PX = 16
const BASE_FONT_PX = 100

export default function ScaledWord({
  text,
  className = 'text-slate-900',
  multiline = false,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const el = textRef.current
    if (!box || !el) return

    const fitOneLine = () => {
      // 한 줄이라 기준 크기로 한 번 그려 보고 남는 공간만큼 배율을 잡으면 된다
      el.style.fontSize = `${BASE_FONT_PX}px`
      const naturalWidth = el.scrollWidth
      const naturalHeight = el.scrollHeight
      if (naturalWidth === 0 || naturalHeight === 0) return
      const byWidth = (box.clientWidth * 0.94) / naturalWidth
      const byHeight = (box.clientHeight * 0.92) / naturalHeight
      const next = Math.min(BASE_FONT_PX * byWidth, BASE_FONT_PX * byHeight, MAX_FONT_PX)
      el.style.fontSize = `${Math.max(MIN_FONT_PX, next)}px`
    }

    const fitWrapped = () => {
      // 줄이 몇 개로 나뉠지는 크기를 정해 봐야 알 수 있어서, 범위를 좁혀 가며 찾는다
      let small = MIN_FONT_PX
      let large = MAX_FONT_PX
      for (let i = 0; i < 12; i++) {
        const mid = (small + large) / 2
        el.style.fontSize = `${mid}px`
        // 여러 줄일 때 글자 상자는 폭을 꽉 채우는 것이 정상이라 폭을 깎아서 재면 안 된다.
        // 깎아서 재면 어떤 크기도 통과하지 못해 늘 가장 작은 글씨가 된다.
        const fits =
          el.scrollWidth <= box.clientWidth + 1 && el.scrollHeight <= box.clientHeight * 0.96
        if (fits) small = mid
        else large = mid
      }
      el.style.fontSize = `${small}px`
    }

    const fit = () => (multiline ? fitWrapped() : fitOneLine())

    fit()
    // 힌트가 펼쳐지거나 화면을 돌리면 다시 맞춘다
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [text, multiline])

  return (
    <div
      ref={boxRef}
      className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden ${className}`}
    >
      <span
        ref={textRef}
        key={text}
        className={`animate-card-in block font-extrabold tracking-tight ${
          multiline
            ? 'w-full text-center leading-tight break-keep whitespace-pre-wrap'
            : 'leading-none whitespace-nowrap'
        }`}
      >
        {text}
      </span>
    </div>
  )
}
