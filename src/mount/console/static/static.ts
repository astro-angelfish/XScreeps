import { Colorful, isInArray, GenerateAbility, CalculateEnergy } from "@/utils"
import { forEach, result } from "lodash"
import { allResource, roomResource } from "../control/local/resource"
import { getStore } from "../control/local/store"


/* 与资源相关的 */
export default {
    resource: {
        all(): string {
            allResource()
            return `[resource] 全局资源统计完毕!`
        },
        room(roomName: string): string {
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[resource] 不存在房间${roomName}`
            roomResource(roomName)
            return `[resource] 房间${roomName}资源统计完毕!`
        },
        com(): string {
            let result = '压缩商品资源:\n'
            result += 'battery(wn) utrium_bar(U) lemergium_bar(L) keanium_bar(K) zynthium_bar(Z) \n'
            result += 'ghodium_melt(G) oxidant(O) reductant(H) purifier(X)\n'
            result += '基础商品资源:\n'
            result += 'wire cell alloy condensate composite crystal liquid\n'
            result += Colorful('机械商品:\n', '#f8a505', true)
            result += Colorful('tube fixtures frame hydraulics machine\n', '#f8a505', false)
            result += Colorful('生物商品:\n', '#05f817', true)
            result += Colorful('phlegm tissue muscle organoid organism\n', '#05f817', false)
            result += Colorful('电子商品:\n', 'blue', true)
            result += Colorful('switch transistor microchip circuit device\n', 'blue', false)
            result += Colorful('奥秘商品:\n', '#5147ea', true)
            result += Colorful('concentrate extract spirit emanation essence\n', '#5147ea', false)
            return result
        }
    },
    store: {
        all(): string {
            getStore()
            return `[store] 全局容量信息统计完毕!`
        },
        room(roomName: string): string {
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[store] 不存在房间${roomName}`
            getStore(roomName)
            return `[store] 房间${roomName}容量信息统计完毕!`
        }
    },
    /* 任务输出调试屏蔽 */
    MissionVisual: {
        add(name: string): string {
            if (!isInArray(Memory.ignoreMissonName, name))
                Memory.ignoreMissonName.push(name)
            return `[ignore] 已经将任务${name}添加进输出调试的忽略名单里!`
        },
        remove(name: string): string {
            if (isInArray(Memory.ignoreMissonName, name)) {
                var index = Memory.ignoreMissonName.indexOf(name)
                Memory.ignoreMissonName.splice(index, 1)
                return `[ignore] 已经将任务${name}删除出输出调试的忽略名单里!`
            }
            return `[ignore] 删除 ${name} 出调试输出忽略名单失败!`

        },
    },
    /*左上角显示操作*/
    Visualdisplay: {
        change(roomName: string): string {
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[Visual] 不存在房间${roomName}`
            thisRoom.memory.Visualdisplay = !thisRoom.memory.Visualdisplay
            return `[Visual] ${thisRoom} 可视化显示${thisRoom.memory.Visualdisplay}`

        },
        clearflagall(): string {
            for (let flags_key in Game.flags) {
                Game.flags[flags_key].remove()
            }
            return `[Visual] 完成旗帜清理`
        }
    },
    /*房间维护开销的计算*/
    Maintain: {
        roommaintain(roomName: string): string {
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[Visual] 不存在房间${roomName}`
            /*筛选出所有的道路*/
            let structures_list = thisRoom.find(FIND_STRUCTURES, {
                filter: (i) => i.structureType == STRUCTURE_ROAD
            })
            let road_maintain_energy = 0;
            let role_maintain_energy = 0;
            if (structures_list.length > 0) {
                let getNtowerID = Game.getObjectById(thisRoom.memory.StructureIdData.NtowerID) as StructureTower
                if (!getNtowerID) {
                    return `[Maintain]  ${thisRoom} 没有对应的维修单位!`
                }
                let from_pos = `W${getNtowerID.pos.x}N${getNtowerID.pos.y}`
                for (let Data_ of structures_list) {
                    let to_pos = `W${Data_.pos.x}N${Data_.pos.y}`
                    let _number = Game.map.getRoomLinearDistance(from_pos, to_pos)
                    /*计算healnumber*/
                    let _heal_number = 800;
                    if (_number > 5) {
                        _heal_number -= (_number - 5) * 40
                    }
                    _heal_number = _heal_number < 200 ? 200 : _heal_number;
                    /*获取偏差数值*/
                    let _loss_number = 110;
                    if (Data_.hitsMax > 20000) {
                        _loss_number = 550;
                    }
                    if (Data_.hitsMax > 700000) {
                        _loss_number = 16500;
                    }

                    let _heal = Math.ceil(_loss_number / _heal_number);
                    road_maintain_energy += _heal * 10 * 1.5
                }
            }
            /*开始统计孵化开销*/
            for (let cof in thisRoom.memory.SpawnConfig) {
                let role = thisRoom.memory.SpawnConfig[cof]
                if (role.num === 0) continue
                let bd = global.CreepBodyData[thisRoom.name][cof];
                let body = GenerateAbility(bd[0], bd[1], bd[2], bd[3], bd[4], bd[5], bd[6], bd[7])
                let energy_ = CalculateEnergy(body)
                role_maintain_energy += energy_ * role.num
            }

            /*筛选出维护塔*/
            /*计算 基于塔的维修效果*/
            return `[Maintain]  ${thisRoom} 道路维护 ${road_maintain_energy},基础孵化 ${role_maintain_energy} 300tick ${(road_maintain_energy + role_maintain_energy) / 5}`
        }

    }
}