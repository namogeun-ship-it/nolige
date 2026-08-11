import { useEffect } from 'react'

/**
 * 노치와 홈바를 피해 비워 둔 화면 가장자리를 지금 화면과 같은 색으로 칠한다.
 * 이 여백은 화면 바깥(body)이라 화면 안에서 칠한 배경색이 닿지 않는다.
 * 색을 넘기지 않으면 기본 배경색으로 돌아간다.
 */
export function useEdgeColor(color: string): void {
  useEffect(() => {
    document.body.style.backgroundColor = color
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [color])
}
