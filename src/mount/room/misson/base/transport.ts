/* 房间原型拓展   --任务  --运输工任务 */
export default class RoomMissonTransportExtension extends Room {
    // 虫卵填充任务
    public Spawn_Feed(): void {
        /* 每11 tick 观察一次 */
        if (Game.time % 10) return
        if (!this.storage && !this.terminal) return
        if (this.RoleMissionNum('transport', '虫卵填充') < 1) {
            // let thisPos = new RoomPosition(Memory.RoomControlData[this.name].center[0], Memory.RoomControlData[this.name].center[1], this.name)
            // let emptyExtensions = this.find(FIND_MY_STRUCTURES, {
            //     filter: (structure) => {
            //         return (structure.structureType == 'spawn' || structure.structureType == 'extension') && structure.store.getFreeCapacity('energy') > 0
            //     }
            // })
            let emptyExtensions: boolean = false
            for (let struc of this.find(FIND_MY_SPAWNS) as StructureSpawn[]) {
                if (struc.store.getFreeCapacity('energy') > 0) {
                    emptyExtensions = true;
                    break;
                }
            }
            if (!emptyExtensions) {
                for (let struc of this.getStructure(STRUCTURE_EXTENSION) as StructureExtension[]) {
                    if (struc.store.getFreeCapacity('energy') > 0) {
                        emptyExtensions = true;
                        break;
                    }
                }
            }
            if (emptyExtensions) {
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
    }

    // 防御塔填充任务
    public Tower_Feed(): void {
        if (Game.shard.name == 'shard3') {
            if (Game.time % 15) return
        }
        else {
            if (Game.time % 5) return
        }
        if (!this.storage && !this.terminal) return
        for (let tower of this.getStructure(STRUCTURE_TOWER) as StructureTower[]) {
            if (tower.store.getUsedCapacity('energy') < 500) {
                /* 下达搬运任务搬运 */
                let storage_ = this.storage as StructureStorage
                if (storage_) {
                    if (this.RoleMissionNum('transport', '物流运输') > 3 || !this.Check_Carry('transport', storage_.pos, tower.pos, 'energy')) continue
                    if (storage_.store.getUsedCapacity('energy') >= 1000) {
                        let thisTask = this.public_Carry({ 'transport': { num: 2, bind: [] } }, 35, this.name, storage_.pos.x, storage_.pos.y, this.name, tower.pos.x, tower.pos.y, 'energy', 1000 - tower.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                        return
                    }
                }
                let terminal_ = this.terminal as StructureTerminal;
                if (terminal_) {
                    if (this.RoleMissionNum('transport', '物流运输') > 3 || !this.Check_Carry('transport', terminal_.pos, tower.pos, 'energy')) continue
                    if (terminal_.store.getUsedCapacity('energy') >= 1000) {
                        let thisTask = this.public_Carry({ 'transport': { num: 2, bind: [] } }, 35, this.name, terminal_.pos.x, terminal_.pos.y, this.name, tower.pos.x, tower.pos.y, 'energy', 1000 - tower.store.getUsedCapacity('energy'))
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
        let missionNum = this.RoleMissionNum('transport', '物流运输')
        if (missionNum > 3) return
        for (var thisLab of this.getStructure(STRUCTURE_LAB) as StructureLab[]) {
            if (thisLab.store.getUsedCapacity('energy') <= 1800) {
                /* 下布搬运命令 */
                var storage_ = this.storage as StructureStorage
                if (storage_) {
                    if (storage_.store.getUsedCapacity('energy') > 2000 && this.Check_Carry('transport', storage_.pos, thisLab.pos, 'energy')) {
                        var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 25, this.name, storage_.pos.x, storage_.pos.y, this.name, thisLab.pos.x, thisLab.pos.y, 'energy', 2000 - thisLab.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                        return
                    }
                }
                var terminal_ = this.terminal as StructureTerminal
                if (terminal_) {
                    if (terminal_.store.getUsedCapacity('energy') > 2000 && this.Check_Carry('transport', terminal_.pos, thisLab.pos, 'energy')) {
                        var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 25, this.name, terminal_.pos.x, terminal_.pos.y, this.name, thisLab.pos.x, thisLab.pos.y, 'energy', 2000 - thisLab.store.getUsedCapacity('energy'))
                        this.AddMission(thisTask)
                        return
                    }
                }
                return
            }
            /* 如果该实验室不在绑定状态却有多余资源 */
            if (!this.memory.RoomLabBind[thisLab.id] && thisLab.mineralType) {
                var storage_ = this.storage as StructureStorage
                if (!storage_) return
                var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 25, this.name, thisLab.pos.x, thisLab.pos.y, this.name, storage_.pos.x, storage_.pos.y, thisLab.mineralType, thisLab.store.getUsedCapacity(thisLab.mineralType))
                this.AddMission(thisTask)
                return
            }
        }
    }

    // 核弹填充任务
    public Nuker_Feed(): void {
        if (Game.time % 103) return
        if (this.memory.switch.StopFillNuker) return
        if (!this.memory.StructureIdData.NukerID || !this.storage) return
        if (this.RoleMissionNum('transport', '物流运输') >= 1) return
        var nuker = Game.getObjectById(this.memory.StructureIdData.NukerID) as StructureNuker
        var storage_ = this.storage as StructureStorage
        if (!nuker) { delete this.memory.StructureIdData.NukerID; return }
        // if (!storage_) { delete this.memory.StructureIdData.storageID; return }
        if (nuker.store.getUsedCapacity('G') < 5000 && storage_.store.getUsedCapacity('G') >= 5000) {
            var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 40, this.name, storage_.pos.x, storage_.pos.y, this.name, nuker.pos.x, nuker.pos.y, 'G', 5000 - nuker.store.getUsedCapacity('G'))
            this.AddMission(thisTask)
            return
        }
        if (nuker.store.getUsedCapacity('energy') < 300000 && storage_.store.getUsedCapacity('energy') > 130000) {
            var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 40, this.name, storage_.pos.x, storage_.pos.y, this.name, nuker.pos.x, nuker.pos.y, 'energy', 300000 - nuker.store.getUsedCapacity('energy'))
            this.AddMission(thisTask)
            return
        }
    }
}
