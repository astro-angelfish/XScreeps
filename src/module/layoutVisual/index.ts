import { AppLifecycleCallbacks } from '../framework/types';
// let autoPlannerdu = require('autoPlannerdu');
// let autoPlanner63 = require('autoPlanner63');
// 轮子 非自创
import { drawByConfig } from './common'

export function layoutVisual(): void {
    for (let name of ['LayoutVisualDev', 'LayoutVisual63', 'LayoutVisualHoho', 'LayoutVisualTea', 'LayoutVisualdu']) {
        let flag = Game.flags[name] as any;
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
                    // var p = Game.flags.p;
                    // var pa = Game.flags.pa;
                    // var pb = Game.flags.pb;
                    // var pc = Game.flags.pc;
                    // var pm = Game.flags.pm;
                    // if (p) {
                    //     global.roomStructsData = autoPlanner63.ManagerPlanner.computeManor(p.pos.roomName, [pc, pm, pa, pb])
                    //     Game.flags.p.remove()
                    // }
                    // if (global.roomStructsData) {
                    //     //这个有点消耗cpu 不看的时候记得关
                    //     autoPlanner63.HelperVisual.showRoomStructures(global.roomStructsData.roomName, global.roomStructsData.structMap)
                    // }

                    // if (Game.flags._dayin) {
                    //     console.log(JSON.stringify(global.roomStructsData))
                    //     Game.flags._dayin.remove();
                    // }
                    // let ret = {
                    //     structMap: global.roomStructsData.structMap
                    // };
                    // for (let level = 1; level <= 8; level++) {
                    //     for (let type in CONTROLLER_STRUCTURES) {
                    //         let lim = CONTROLLER_STRUCTURES[type]
                    //         // if (type == 'road') lim = ret.roadLength
                    //         for (let i = lim[level - 1]; i < Math.min(ret.structMap[type].length, lim[level]); i++) {
                    //             let e = ret.structMap[type][i]
                    //             if (type != 'rampart') {
                    //                 new RoomVisual(flag.roomName as string).text(level.toString(), e[0] + 0.3, e[1] + 0.5, { font: 0.4, opacity: 0.8 })
                    //             }
                    //         }
                    //     }
                    // }
                    break;
                case 'LayoutVisualdu':
                    // let center = Game.flags.center; // 房间中心的位置
                    // let pa = Game.flags.pa;
                    // let pb = Game.flags.pb;
                    // let pc = Game.flags.pc;
                    // let pm = Game.flags.pm;
                    // if (center) {
                    //     let points = [pc.pos, pm.pos, pa.pos]
                    //     if (pb) points.push(pb.pos)
                    //     let _data = autoPlannerdu.run(center.pos, points)
                    //     if (Game.flags._dayin) {
                    //         console.log(JSON.stringify(_data))
                    //         Game.flags['_dayin'].remove();
                    //     }
                    // }
                    break;
            }
        }
    }

}

export const layoutVisualMoudle: AppLifecycleCallbacks = {
    tickEnd: layoutVisual
}
