// 轮子 非自创
import { drawByConfig } from './common'
export default function(): void {
  for (const name of ['LayoutVisual']) {
    const flag = Game.flags[name]
    if (flag)
      drawByConfig(flag.name)
  }
}
