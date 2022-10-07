import { AppLifecycleCallbacks } from '../framework/types';
// let autoPlannerdu = require('autoPlannerdu');
let autoPlanner63 = require('autoPlanner63');
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
                    /* storagePos 可以手动定位中心点 */
                    var p = Game.flags.p;
                    var pa = Game.flags.pa;
                    var pb = Game.flags.pb;
                    var pc = Game.flags.pc;
                    var pm = Game.flags.pm;
                    if (p) {
                        global.roomStructsData = autoPlanner63.ManagerPlanner.computeManor(p.pos.roomName, [pc, pm, pa, pb])
                        Game.flags.p.remove()
                        global.roomStructsData.structMaplv = [];/*进行数据清空的操作*/
                    }
                    if (global.roomStructsData) {
                        if (Game.flags._dayin) {
                            console.log(JSON.stringify(global.roomStructsData))
                            Game.flags._dayin.remove();
                        }
                        let ret = {
                            structMap: global.roomStructsData.structMap
                        };
                        let _add_lv_state = false;
                        if (global.roomStructsData.structMaplv.length < 1) {
                            _add_lv_state = true;
                        }
                        for (let level = 1; level <= 8; level++) {
                            for (let type in CONTROLLER_STRUCTURES) {
                                let lim = CONTROLLER_STRUCTURES[type]
                                switch (type) {
                                    case 'road':
                                        if (level == 4) {
                                            for (let i = 0; i < ret.structMap[type].length; i++) {
                                                let e = ret.structMap[type][i]
                                                if (_add_lv_state) {
                                                    global.roomStructsData.structMaplv.push(`${e[0]}/${e[1]}/${type}/${level}`)
                                                }
                                                new RoomVisual(flag.pos.roomName as string).text(level.toString(), e[0] + 0.3, e[1] + 0.5, { font: 0.4, opacity: 0.8 })
                                            }
                                        }
                                        break;
                                    case 'link':
                                        if (level == 5) {
                                            let link_c = ret.structMap[type][ret.structMap[type].length - 1];
                                            if (_add_lv_state) {
                                                global.roomStructsData.structMaplv.push(`${link_c[0]}/${link_c[1]}/${type}/${level}`)
                                            }
                                            new RoomVisual(flag.pos.roomName as string).text(level.toString(), link_c[0] + 0.3, link_c[1] + 0.5, { font: 0.4, opacity: 0.8 })
                                        }
                                        break;
                                    case 'container':
                                        break;
                                    default:
                                        for (let i = lim[level - 1]; i < Math.min(ret.structMap[type].length, lim[level]); i++) {
                                            let e = ret.structMap[type][i]
                                            if (type != 'rampart') {
                                                if (_add_lv_state) {
                                                    global.roomStructsData.structMaplv.push(`${e[0]}/${e[1]}/${type}/${level}`)
                                                }
                                                // {x: -4, y: -3,structureType:'extension',level:2}
                                                new RoomVisual(flag.pos.roomName as string).text(level.toString(), e[0] + 0.3, e[1] + 0.5, { font: 0.4, opacity: 0.8 })
                                            }
                                        }
                                        break;
                                }
                            }
                        }
                        if (Game.flags.savestructMap && global.roomStructsData?.structMaplv) {
                            if (Memory.RoomControlData[flag.pos.roomName]) {
                                Memory.RoomControlData[flag.pos.roomName].structMap = global.roomStructsData.structMaplv
                                Game.flags.savestructMap.remove();
                                console.log(`[LayoutVisual63] 房间${flag.pos.roomName}63布局已经刷新`)
                            }
                        }

                        //这个有点消耗cpu 不看的时候记得关
                        autoPlanner63.HelperVisual.showRoomStructures(global.roomStructsData.roomName, global.roomStructsData.structMap)
                    }


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
