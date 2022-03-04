// 轮子 非自创
import { drawByConfig } from './common'
export default function (): void {
    for (let name of ['LayoutVisual']) {
        let flag = Game.flags[name];
        if (flag) {
            drawByConfig(flag.name);
        }
    }

}