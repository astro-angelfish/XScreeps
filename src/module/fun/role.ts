import { loop } from "@/main";
import { getDistance, isInArray } from "@/utils";

/**
 * 存放非任务类型角色相关的函数
*/

// 采矿工
export function harvest_(creep_: Creep): void {
    if (!Game.rooms[creep_.memory.belong]) return
    creep_.workstate('energy')
    let harvestData = Game.rooms[creep_.memory.belong].memory.harvestData;
    if (!harvestData) return
    // let data = null;
    // if (creep_.memory.targetID) {
    //     data = harvestData[creep_.memory.targetID]
    //     if (!data) return
    // }
    if (creep_.memory.working) {
        let data = harvestData[creep_.memory.targetID]
        if (!data) return
        // 优先寻找link
        if (!data.containerID) {
            /* 最后寻找附近的建筑工地 -补全container*/
            let cons = creep_.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3)
            if (cons.length > 0) {
                creep_.build(cons[0])
            } else {
                let containers = creep_.pos.findInRange(FIND_STRUCTURES, 1, { filter: (stru) => { return stru.structureType == 'container' } })
                if (containers.length < 1) {
                    creep_.pos.createConstructionSite('container')
                    return;
                }
            }
            return
        }
        // else {
        //     /*维修操作检查*/
        //     let container = Game.getObjectById(data.containerID as Id<StructureContainer>) as StructureContainer
        //     if (container) {
        //         if (container.hits < container.hitsMax) {
        //             creep_.repair(container)
        //             return
        //         }
        //     }
        // }
        if (data.linkID) {
            let link = Game.getObjectById(data.linkID as Id<StructureLink>) as StructureLink
            if (!link) delete data.linkID
            else {
                if (link.hits < link.hitsMax) { creep_.repair(link); return }
                if (creep_.pos.isNearTo(link)) {
                    if (link.store.getFreeCapacity('energy') > 0) {
                        creep_.transfer(link, 'energy')
                        return
                    }
                }
                else {
                    creep_.goTo(link.pos, 1)
                    return
                }
            }
        }
        // 其次寻找container
        if (data.containerID) {
            let container = Game.getObjectById(data.containerID as Id<StructureLink>) as StructureLink
            if (!container) delete data.containerID
            else {
                if (container.hits < container.hitsMax) { creep_.repair(container); return }
                if (creep_.pos.isEqualTo(container)) {
                    creep_.transfer(container, 'energy')
                    return
                }
                else {
                    creep_.goTo(container.pos, 0)
                    return
                }
            }

        }
    }
    else {
        // 如果不具备挖矿功能了，就自杀
        if (creep_.hits < creep_.hitsMax) {
            if (creep_.getActiveBodyparts('work') <= 0) {
                creep_.suicide()
            }
        }
        // 绑定矿点
        if (!creep_.memory.targetID) {
            for (var i in harvestData) {
                var data_ = harvestData[i]
                if (data_.carry == creep_.name) {
                    creep_.memory.targetID = i
                    break
                }
                if (!data_.harvest || !Game.creeps[data_.harvest]) {
                    creep_.memory.targetID = i
                    data_.harvest = creep_.name
                    break
                }
            }
            return
        }
        /* 寻找target附近的container */
        let source = Game.getObjectById(creep_.memory.targetID as Id<Source>) as Source
        if (!source) return
        if (source.energy > 0) {
            if (creep_.harvest(source) == ERR_NOT_IN_RANGE) { creep_.goTo(source.pos, 1); return }
        } else {
            if (Game.time % 2) return;
            let data = harvestData[creep_.memory.targetID]
            if (!data) return
            if (!data.containerID || !data.linkID) return
            let container = Game.getObjectById(data.containerID as Id<StructureContainer>) as StructureContainer
            if (!container) return
            let container_energy = container.store.getUsedCapacity(RESOURCE_ENERGY)
            if (container_energy < 1) return/*容器没有能量终止*/
            let link = Game.getObjectById(data.linkID as Id<StructureLink>) as StructureLink
            if (!link) return;
            let link_energy = link.store.getFreeCapacity(RESOURCE_ENERGY)
            if (link_energy < 1) return;/*link已满终止*/
            if (creep_.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep_.moveTo(container);
            }
        }
    }
}

// 搬运工
export function carry_(creep_: Creep): void {
    if (!Game.rooms[creep_.memory.belong]) return
    creep_.workstate('energy')
    if (!creep_.memory.containerID) {
        var harvestData = Game.rooms[creep_.memory.belong].memory.harvestData
        if (!harvestData) return
        if (Object.keys(harvestData).length == 0) return
        else if (Object.keys(harvestData).length > 1) {
            for (var i in Game.rooms[creep_.memory.belong].memory.harvestData) {
                var data_ = Game.rooms[creep_.memory.belong].memory.harvestData[i]
                if (data_.linkID) continue
                if (!data_.containerID) continue
                if (data_.carry == creep_.name) {
                    creep_.memory.containerID = data_.containerID
                    break
                }
                if ((!data_.carry || !Game.creeps[data_.carry]) && data_.containerID) {
                    creep_.memory.containerID = data_.containerID
                    data_.carry = creep_.name
                    break
                }
            }
            return
        }
        else {
            var harvestData_ = harvestData[Object.keys(harvestData)[0]]
            if (harvestData_.containerID) {
                let container = Game.getObjectById(harvestData_.containerID as Id<StructureContainer>)
                if (!container) delete harvestData_.containerID
                else {
                    creep_.memory.containerID = harvestData_.containerID
                }
            }
            else creep_.say("oh No!")
            return
        }
    }
    if (creep_.memory.working) {
        if (creep_.room.controller.level < 7) {
            var target_c = creep_.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (stru: StructureTower | StructureSpawn) => {
                    return isInArray(['tower', 'spawn', 'extension'], stru.structureType) && stru.store.getFreeCapacity('energy') > 0
                }
            })
            if (target_c) {
                creep_.transfer_(target_c, 'energy')
                return
            }
        }
        let target = null
        if (Game.rooms[creep_.memory.belong].storage)  // 优先仓库
        {
            target = Game.rooms[creep_.memory.belong].storage as StructureStorage
        }
        if (!target)    // 其次虫卵
        {
            target = creep_.pos.getClosestStore()
        }
        if (!target)    // 再其次防御塔
        {
            target = creep_.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (stru) => {
                    return stru.structureType == 'tower' && stru.store.getFreeCapacity('energy') > creep_.store.getUsedCapacity('energy')
                }
            })
        }
        if (!target) return
        creep_.transfer_(target, 'energy')
    }
    else {
        let container = Game.getObjectById(creep_.memory.containerID as Id<StructureContainer>) as StructureContainer
        if (!container) {
            /* 删除房间相关的记忆 */
            for (var hdata in Game.rooms[creep_.memory.belong].memory.harvestData) {
                if (Game.rooms[creep_.memory.belong].memory.harvestData[hdata].containerID && Game.rooms[creep_.memory.belong].memory.harvestData[hdata].containerID == creep_.memory.containerID) {
                    delete Game.rooms[creep_.memory.belong].memory.harvestData[hdata].containerID
                }
            }
            /* 删除爬虫相关记忆 */
            delete creep_.memory.containerID
            return
        }
        if (!creep_.pos.isNearTo(container)) creep_.goTo(container.pos, 1)
        else { if (container.store.getUsedCapacity('energy') > creep_.store.getFreeCapacity()) creep_.withdraw(container, 'energy') }
    }
}

// 升级工
export function upgrade_(creep_: Creep): void {
    if (!Game.rooms[creep_.memory.belong]) return
    creep_.workstate('energy', 0.5)
    if (creep_.memory.working) {
        creep_.upgrade_()
        if (creep_.memory.targetID) {
            delete creep_.memory.targetID
        }
    }
    else {
        if (creep_.room.controller.level < 6 && creep_.room.memory.switch.speedstate) {
            var find_tombstones = creep_.pos.findClosestByRange(FIND_TOMBSTONES, {
                filter: (structure) => {
                    return structure.store.getUsedCapacity('energy') > 0
                }
            })
            if (find_tombstones) {
                if (creep_.withdraw(find_tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep_.moveTo(find_tombstones);
                }
                return;
            }
        }
        if (Game.flags[`${creep_.memory.belong}/ruin`]) {
            if (!creep_.pos.isNearTo(Game.flags[`${creep_.memory.belong}/ruin`]))
                creep_.goTo(Game.flags[`${creep_.memory.belong}/ruin`].pos, 1)
            else {
                let ruin = Game.flags[`${creep_.memory.belong}/ruin`].pos.lookFor(LOOK_RUINS)
                let swi = false
                for (var i of ruin) {
                    if (i.store.getUsedCapacity('energy') > 0) { creep_.withdraw(i, 'energy'); swi = true; return }
                }
                if (!swi) Game.flags[`${creep_.memory.belong}/ruin`].remove()
            }
            return
        }
        if (!creep_.memory.targetID) {
            let target = null
            if (creep_.room.controller.level < 8 && creep_.room.terminal && !Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link) {
                target = creep_.room.terminal
            } else {
                if (Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link)       // 优先Link
                {
                    target = Game.getObjectById(Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link) as StructureLink
                    if (!target) delete Game.rooms[creep_.memory.belong].memory.StructureIdData.upgrade_link
                }
                else if (Game.rooms[creep_.memory.belong].storage)  // 优先仓库
                {
                    target = Game.rooms[creep_.memory.belong].storage as StructureStorage
                }
                if (!target)    // 其次container
                {
                    target = creep_.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType == 'container' && stru.store.getUsedCapacity('energy') > creep_.store.getFreeCapacity()
                        }
                    })
                }
            }
            if (!target) { return }
            else { creep_.memory.targetID = target.id }
        }
        else {
            let target = Game.getObjectById(creep_.memory.targetID as Id<StructureStorage>) as StructureStorage
            if (target) creep_.withdraw_(target, 'energy')
        }

    }

}

// 建筑工
export function build_(creep: Creep): void {
    var thisRoom = Game.rooms[creep.memory.belong]
    if (!thisRoom) return
    if (!creep.memory.standed) creep.memory.standed = false
    creep.workstate('energy')
    if (creep.memory.working) {
        var construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (construction) {
            creep.build_(construction)
        }
        else {
            if (creep.room.controller.level < 3) {
                /* 没有建筑物则考虑道路维护 */
                var roads = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == 'road' && structure.hits < structure.hitsMax
                    }
                })
                if (roads) {
                    // creep.say("🛠️", true)
                    if (creep.repair(roads) == ERR_NOT_IN_RANGE) {
                        creep.goTo(roads.pos, 1)
                    }
                    if (getDistance(creep.pos, roads.pos) <= 3)
                        creep.memory.standed = false
                }
            } else {
                if (global.Repairlist[thisRoom.name].length > 0) {
                    let Repairdata = Game.getObjectById(global.Repairlist[thisRoom.name][0] as Id<StructureTower>) as StructureTower
                    if (!Repairdata) {
                        global.Repairlist[thisRoom.name].shift()
                        return
                    }
                    if (Repairdata.hits >= Repairdata.hitsMax) {
                        global.Repairlist[thisRoom.name].shift()
                        return
                    }
                    if (creep.repair(Repairdata) == ERR_NOT_IN_RANGE) {
                        creep.goTo(Repairdata.pos, 2)
                    }
                }
            }
        }
    }
    else {
        creep.memory.standed = false
        if (Game.flags[`${creep.memory.belong}/withdraw`]) {
            let tank_ = Game.flags[`${creep.memory.belong}/withdraw`].pos.GetStructureList(['storage', 'terminal', 'container', 'tower'])
            if (tank_.length > 0) {
                creep.withdraw_(tank_[0], 'energy')
                return
            }
        }
        if (Game.flags[`${creep.memory.belong}/ruin`]) {
            if (!creep.pos.isNearTo(Game.flags[`${creep.memory.belong}/ruin`]))
                creep.goTo(Game.flags[`${creep.memory.belong}/ruin`].pos, 1)
            else {
                let ruin = Game.flags[`${creep.memory.belong}/ruin`].pos.lookFor(LOOK_RUINS)
                let swi = false
                for (var i of ruin) {
                    if (i.store.getUsedCapacity('energy') > 0) { creep.withdraw(i, 'energy'); swi = true; return }
                }
                if (!swi) Game.flags[`${creep.memory.belong}/ruin`].remove()
            }
            return
        }
        /* 如果有storage就去storage里找，没有就自己采集 */
        if (creep.room.storage) {
            if (creep.room.storage.store.getUsedCapacity('energy') >= creep.store.getCapacity()) {
                creep.withdraw_(creep.room.storage, 'energy')
                return;
            }
        }
        if (creep.room.terminal) {
            if (creep.room.terminal.store.getUsedCapacity('energy') >= creep.store.getCapacity()) {
                creep.withdraw_(creep.room.terminal, 'energy')
                return;
            }
        }

        var container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (stru) => { return stru.structureType == 'container' && stru.store.getUsedCapacity('energy') > creep.store.getCapacity() } })
        if (container) {
            if (!creep.pos.isNearTo(container)) {
                creep.goTo(container.pos, 1)
            }
            else {
                creep.withdraw(container, 'energy')
            }
        } else {
            /*进行资源采集*/
            const target = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                creep.goTo(target.pos, 1);
            }
        }

    }

}
/*新房起步专用*/
export function initial_speed_(creep: Creep): void {
    var thisRoom = Game.rooms[creep.memory.belong]
    if (!thisRoom) return
    if (!creep.memory.standed) creep.memory.standed = false
    creep.workstate('energy')
    if (creep.memory.working) {
        /*检查是否有需要填充的单位*/
        if (thisRoom.controller.level < 2) {
            var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (stru: StructureTower | StructureSpawn) => {
                    return isInArray(['tower', 'spawn', 'extension'], stru.structureType) && stru.store.getFreeCapacity('energy') > 0
                }
            })
            if (target) {
                creep.transfer_(target, 'energy')
                return
            }
        } else {
            if (thisRoom.controller.level < 4) {
                var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (stru: StructureTower | StructureSpawn) => {
                        return isInArray(['tower', 'spawn'], stru.structureType) && stru.store.getFreeCapacity('energy') > 0
                    }
                })

                if (target) {
                    let _number = getDistance(target.pos, creep.pos)
                    if (_number < 7) {
                        creep.transfer_(target, 'energy')
                        return
                    }
                }
            }
        }
        /*检查是否有工地*/
        var construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (construction) {
            creep.build_(construction)
        } else {
            if (!creep.pos.inRangeTo(creep.room.controller, 2)) {
                creep.goTo(creep.room.controller.pos, 2)
            } else {
                creep.upgrade_()
            }
            // if (creep.room.controller) {
            //     if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            //         // this.goTo(this.room.controller.pos, 3)
            //         creep.memory.standed = false
            //     }
            //     else creep.memory.standed = true
            // }
            // 
        }
    } else {
        /*搜索掉落的资源*/

        var find_dropped_resources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: (res) => {
                return res.amount > 100 && res.resourceType == 'energy'
            }
        })
        if (find_dropped_resources) {
            if (!creep.pos.isNearTo(find_dropped_resources)) creep.goTo(find_dropped_resources.pos, 1)
            else creep.pickup(find_dropped_resources)
            return;
        }
        /*搜索墓碑*/
        var find_tombstones = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
            filter: (structure) => {
                return structure.store.getUsedCapacity('energy') > 0
            }
        })
        if (find_tombstones) {
            if (creep.withdraw(find_tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(find_tombstones);
            }
            return;
        }
        /*搜索地上的废墟*/
        var find_ruins = creep.pos.findClosestByRange(FIND_RUINS, {
            filter: (structure) => {
                return structure.store.getUsedCapacity('energy') > 0
            }
        })
        if (find_ruins) {
            if (creep.withdraw(find_ruins, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(find_ruins);
            }
            return;
        }
        if (creep.room.storage) {
            if (creep.room.storage.store.getUsedCapacity('energy') > 1000) {
                if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
                return;
            }
        }
        /*进行采集*/
        var find_sources = creep.pos.findClosestByRange(FIND_SOURCES, {
            filter: (structure) => {
                return structure.energy > 0
            }
        })
        if (find_sources) {
            creep.harvest_(find_sources);
            return;
        }
    }
}
