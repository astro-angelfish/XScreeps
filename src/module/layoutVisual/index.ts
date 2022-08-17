import { AppLifecycleCallbacks } from '../framework/types';
let autoPlanner63 = require('autoPlanner63');
// 轮子 非自创
import { drawByConfig } from './common'

export function layoutVisual(): void {
    for (let name of ['LayoutVisualDev','LayoutVisual63','LayoutVisualHoho','LayoutVisualTea']) {
        let flag = Game.flags[name];
        if (flag) {
            switch (name) {
                case 'LayoutVisualDev':
                    drawByConfig(flag.name);
                    break;
                case 'LayoutVisualHoho':
                    drawByConfig(flag.name);
                    break;
                case 'LayoutVisualTea':
                    drawByConfig(flag.name);
                    break;
                case 'LayoutVisual63':
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

export const layoutVisualMoudle: AppLifecycleCallbacks = {
    tickEnd: layoutVisual
}
