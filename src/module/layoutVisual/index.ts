import { AppLifecycleCallbacks } from '../framework/types';
let autoPlanner63 = require('./autoPlanner63');
// 轮子 非自创
import { drawByConfig } from './common'
export function layoutVisual(): void {
    for (let name of ['LayoutVisual', 'LayoutVisual63']) {
        let flag = Game.flags[name];
        if (flag) {
            switch (name) {
                case 'LayoutVisual':
                    drawByConfig(flag.name);
                    break;
                case 'LayoutVisual63':
                    /**
                     * drawByConfig63(flag.name);
                     * let roomStructsData: StructsData | undefined = undefined //全局变量
                     * global.roomStructsData.structMap 
                     */
                    let p = Game.flags.p;
                    let pa = Game.flags.pa;
                    let pb = Game.flags.pb;
                    let pc = Game.flags.pc;
                    let pm = Game.flags.pm;
                    if (p) {
                        global.roomStructsData = autoPlanner63.ManagerPlanner.computeManor(p.pos.roomName, [pc, pm, pa, pb])
                        Game.flags.p.remove()
                    }
                    if (global.roomStructsData) {
                        //这个有点消耗cpu 不看的时候记得关
                        autoPlanner63.HelperVisual.showRoomStructures(global.roomStructsData.roomName, global.roomStructsData.structMap)
                    }
                    break;
            }
        }
    }

}
/**
// export const drawByConfig63 = function (str: string) {
//     // autoPlanner63.Loop();
//     let roomStructsData: StructsData | undefined = undefined //全局变量

//     let p = Game.flags.p;
//     let pa = Game.flags.pa;
//     let pb = Game.flags.pb;
//     let pc = Game.flags.pc;
//     let pm = Game.flags.pm;
//     if (p) {
//         roomStructsData = autoPlanner63.ManagerPlanner.computeManor(p.pos.roomName, [pc, pm, pa, pb])
//         Game.flags.p.remove()
//     }

//     if (str && roomStructsData) {
//         //这个有点消耗cpu 不看的时候记得关
//         autoPlanner63.HelperVisual.showRoomStructures(roomStructsData.roomName, roomStructsData.structMap)
//     }
// }
*/

export const layoutVisualMoudle: AppLifecycleCallbacks = {
    tickEnd: layoutVisual
}