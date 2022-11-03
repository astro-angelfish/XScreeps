import { checkSend, DispatchNum } from "@/module/fun/funtion";
import { Colorful } from "@/utils";

/* 房间原型拓展   --任务  --运输工任务 */
export default class RoomMissonTransportExtension extends Room {
    // 虫卵填充任务
    public Spawn_Feed(): void {
        /* 每11 tick 观察一次 */
        if ((Game.time - global.Gtime[this.name]) % 11) return
        if (!this.storage && !this.terminal) return
        if (this.energyAvailable >= this.energyCapacityAvailable) return;
        if (this.RoleMissionNum('transport', '虫卵填充') < 1) {
            /*存储填充对象的信息*/
            // this.memory.Transport['SpawnFeed'] = []
            // for (let id in emptyExtensions) {
            //     this.memory.Transport['SpawnFeed'].push(emptyExtensions[id].id)
            // }
            /* 满足条件则触发虫卵填充任务 */
            var thisMisson: MissionModel = {
                name: "虫卵填充",
                range: "Creep",
                delayTick: 50,
                cooldownTick: 4,
                CreepBind: { 'transport': { num: 2, bind: [] } },
                Data: {}
            }
            this.AddMission(thisMisson)
        }
    }

    // 资源回收任务
    public Resource_Recycle(): void {
        if ((Game.time - global.Gtime[this.name]) % 17) return
        if (!this.storage) return
        let tombstone = this.find(FIND_TOMBSTONES, { 
            filter: (tomb) => {
                return (tomb.store.getUsedCapacity('energy') >= tomb.pos.getRangeTo(this.storage!) * 25) ||
                        (tomb.store.getUsedCapacity() > tomb.store.getUsedCapacity('energy'))
            }
        }) as Tombstone[];
        if (tombstone.length > 0) {
            /* 下达搬运任务搬运 */
            if (this.RoleMissionNum('transport', '物流运输') > 3) return
            if (this.storage) {
                if (!this.Check_Carry('transport', this.storage.pos, tombstone[0].pos)) return
                let thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 35, this.name, tombstone[0].pos.x, tombstone[0].pos.y, this.name, this.storage.pos.x, this.storage.pos.y)
                this.AddMission(thisTask)
                return
            }
        } else {
            let droppedResource = this.find(FIND_DROPPED_RESOURCES, {
                filter: (dropped) => {
                    return (dropped.amount >= dropped.pos.getRangeTo(this.storage!) * 25) || (dropped.resourceType != 'energy')
                }
            }) as Resource[];
            if (droppedResource.length > 0) {
                /* 下达搬运任务搬运 */
                if (this.RoleMissionNum('transport', '物流运输') > 3) return
                if (this.storage) {
                    if (!this.Check_Carry('transport', this.storage.pos, droppedResource[0].pos)) return
                    let thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 35, this.name, droppedResource[0].pos.x, droppedResource[0].pos.y, this.name, this.storage.pos.x, this.storage.pos.y)
                    this.AddMission(thisTask)
                    return
                }
            }
        }
    }

    // 防御塔填充任务
    public Tower_Feed(): void {
        if (Game.shard.name == 'shard3') {
            if ((Game.time - global.Gtime[this.name]) % 17) return
        }
        else {
            if ((Game.time - global.Gtime[this.name]) % 5) return
        }
        if (!this.storage && !this.terminal) return
        if (!this.memory.StructureIdData?.AtowerID) return;
        for (let towerid of this.memory.StructureIdData.AtowerID) {
            let tower = Game.getObjectById(towerid) as StructureTower;
            if (!tower) {
                this.memory.StructureIdData.AtowerID = _.difference(this.memory.StructureIdData.AtowerID, [towerid])
                continue
            };
            if (tower.store.getUsedCapacity('energy') < 500) {
                /* 下达搬运任务搬运 */
                if (this.RoleMissionNum('transport', '物流运输') > 3) continue;
                if (this.storage) {
                    if (!this.Check_Carry('transport', this.storage.pos, tower.pos, 'energy')) continue
                    if (this.storage.store.getUsedCapacity('energy') >= 1000) {
                        let thisTask = this.public_Carry({ 'transport': { num: 2, bind: [] } }, 35, this.name, this.storage.pos.x, this.storage.pos.y, this.name, tower.pos.x, tower.pos.y, 'energy', 1000 - tower.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                        return
                    }
                }
                if (this.controller.level < 6) return;
                if (this.terminal) {
                    if (!this.Check_Carry('transport', this.terminal.pos, tower.pos, 'energy')) continue
                    if (this.terminal.store.getUsedCapacity('energy') >= 1000) {
                        let thisTask = this.public_Carry({ 'transport': { num: 2, bind: [] } }, 35, this.name, this.terminal.pos.x, this.terminal.pos.y, this.name, tower.pos.x, tower.pos.y, 'energy', 1000 - tower.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                    }
                }

            }
        }
    }

    // 实验室能量填充任务 [包含多余物回收]
    public Lab_Feed(): void {
        if ((global.Gtime[this.name] - Game.time) % 13) return
        if (!this.storage && !this.terminal) return
        if (!this.memory.StructureIdData?.labs) return;
        let missionNum = this.RoleMissionNum('transport', '物流运输')
        if (missionNum > 3) return
        for (var thisLabid of this.memory.StructureIdData.labs) {
            let thisLab = Game.getObjectById(thisLabid) as StructureLab;
            if (!thisLab) {
                this.memory.StructureIdData.labs = _.difference(this.memory.StructureIdData.labs, [thisLabid])
                continue
            };
            if (thisLab.store.getUsedCapacity('energy') <= 1800) {
                /* 下布搬运命令 */
                if (this.storage) {
                    if (this.storage.store.getUsedCapacity('energy') > 2000) {
                        if (!this.Check_Carry('transport', this.storage.pos, thisLab.pos, 'energy')) return;
                        var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 25, this.name, this.storage.pos.x, this.storage.pos.y, this.name, thisLab.pos.x, thisLab.pos.y, 'energy', 2000 - thisLab.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                        return
                    }
                }
                if (this.controller.level < 6) return;
                if (this.terminal) {
                    if (this.terminal.store.getUsedCapacity('energy') > 2000) {
                        if (!this.Check_Carry('transport', this.terminal.pos, thisLab.pos, 'energy')) return;
                        var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 25, this.name, this.terminal.pos.x, this.terminal.pos.y, this.name, thisLab.pos.x, thisLab.pos.y, 'energy', 2000 - thisLab.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                        return
                    }
                }
                return
            }
            /* 如果该实验室不在绑定状态却有多余资源 */
            if (!this.memory.RoomLabBind[thisLab.id] && thisLab.mineralType) {
                if (!this.storage) return
                var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 25, this.name, thisLab.pos.x, thisLab.pos.y, this.name, this.storage.pos.x, this.storage.pos.y, thisLab.mineralType, thisLab.store.getUsedCapacity(thisLab.mineralType))
                this.AddMission(thisTask)
                return
            }
        }
    }

    // 核弹填充任务
    public Nuker_Feed(): void {
        if ((Game.time - global.Gtime[this.name]) % 103) return
        if (this.memory.switch.StopFillNuker) return
        if (!this.memory.StructureIdData.NukerID || !this.storage) return
        if (this.RoleMissionNum('transport', '物流运输') >= 1) return
        const nuker = Game.getObjectById(this.memory.StructureIdData.NukerID) as StructureNuker
        const storage_ = this.storage as StructureStorage
        const terminal_ = this.terminal as StructureTerminal
        if (!nuker) { delete this.memory.StructureIdData.NukerID; return }
        if (!storage_ || !terminal_) { return }
        const storedGhodium = storage_.store.getUsedCapacity('G') + terminal_.store.getUsedCapacity('G')
        if (nuker.store.getUsedCapacity('G') < 5000 && (storedGhodium + nuker.store.getUsedCapacity('G')) >= 5000) {
            var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 40, this.name, storage_.pos.x, storage_.pos.y, this.name, nuker.pos.x, nuker.pos.y, 'G', 5000 - nuker.store.getUsedCapacity('G'))
            this.AddMission(thisTask)
            return
        } else {
            if (nuker.store.getUsedCapacity('G') < 5000) {
                let ghodiumRequired = 5000 - storedGhodium
                if (ghodiumRequired > 0) {
                    let _DispatchNum = DispatchNum(this.name);
                    /* 资源调度 */
                    if (_DispatchNum <= 0 && this.MissionNum('Structure', '资源购买') <= 0 && !checkSend(this.name, 'G' as ResourceConstant)) {
                        console.log(Colorful(`[资源调度] 房间${this.name}没有足够的资源[G],将执行资源调度!`, 'yellow'))
                        let dispatchTask: RDData = {
                            sourceRoom: this.name,
                            rType: 'G' as ResourceConstant,
                            num: ghodiumRequired,
                            delayTick: 200,
                            conditionTick: 20,
                            buy: true,
                            mtype: 'deal'
                        }
                        Memory.ResourceDispatchData.push(dispatchTask)
                    }
                }
            }
        }
        if (nuker.store.getUsedCapacity('energy') < 300000 && storage_.store.getUsedCapacity('energy') > 200000) {
            var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 40, this.name, storage_.pos.x, storage_.pos.y, this.name, nuker.pos.x, nuker.pos.y, 'energy', Math.min(300000 - nuker.store.getUsedCapacity('energy'), storage_.store.getUsedCapacity('energy') - 200000))
            this.AddMission(thisTask)
            return
        }
    }
}
