/* 爬虫原型拓展   --任务  --搬运工任务 */

export default class CreepMissonTransportExtension extends Creep {
    public handle_feed(): void {
        // if (!this.room.memory.StructureIdData.storageID) return
        // var storage_ = Game.getObjectById(this.room.memory.StructureIdData.storageID as string) as StructureStorage
        if (!this.room.storage && !this.room.terminal) return
        this.workstate('energy')
        if (Object.keys(this.store).length > 0) {
            for (var r in this.store) {
                if (r != 'energy') {
                    this.say("🚽")
                    /* 如果是自己的房间，则优先扔到最近的storage去 */
                    if (this.room.name == this.memory.belong) {
                        if (!this.room.storage) return
                        if (this.room.storage.store.getUsedCapacity() > this.store.getUsedCapacity()) {
                            this.transfer_(this.room.storage, r as ResourceConstant)
                        }
                        else return
                    }
                    return
                }
            }
        }
        // console.log('资源搬运-3')
        if (this.memory.working) {
            // console.log('资源搬运-5')
            this.say("🍉")
            let extensions_ = null;
            if (!this.memory.Extensions_id) {
                var extensions = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == 'spawn' || structure.structureType == 'extension') && structure.store.getFreeCapacity('energy') > 0
                    }
                })
                if (extensions) {
                    extensions_ = extensions;
                    this.memory.Extensions_id = extensions.id;
                }
                else {
                    /* 完成就删除任务和自己的记忆 */
                    Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                    this.memory.MissionData = {}
                }
            }
            if (this.memory.Extensions_id) {
                if (!extensions_) {
                    extensions_ = Game.getObjectById(this.memory.Extensions_id as Id<StructureExtension>) as StructureExtension
                }
                if (!extensions_) { this.memory.Extensions_id = null }
                if (extensions_.store.getFreeCapacity(RESOURCE_ENERGY) < 1) {
                    this.memory.Extensions_id = null
                }
                let transfer = this.transfer(extensions_, RESOURCE_ENERGY)
                switch (transfer) {
                    case ERR_NOT_IN_RANGE:
                        this.goTo(extensions_.pos, 1, 200, 1)
                        break;
                    case OK:
                        this.memory.Extensions_id = null
                        break;
                }
            }
        }
        else {
            // 优先提取storage里的能量 不够提取terminal里的
            if (this.room.storage) {
                if (this.room.storage.store['energy'] >= this.store.getCapacity()) {
                    this.withdraw_(this.room.storage, 'energy')
                    return;
                }
            }
            if (this.room.terminal) {
                if (this.room.terminal.store['energy'] >= this.store.getCapacity()) {
                    this.withdraw_(this.room.terminal, 'energy')
                }
            }
        }
    }

    /*位面物资运输*/
    public handle_Carryshard(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (this.room.name == this.memory.belong && this.memory.shard == Game.shard.name && !this.memory.working) {
            if (this.room.name == this.memory.belong) {
                switch (missionData.Data.level) {
                    case 'T3':
                    case 'T2':
                    case 'T1':
                        if (!this.BoostCheck(['move', 'carry'])) return
                        break;
                }
            }
            if (this.room.storage.store.getUsedCapacity(data.rType) < this.store.getFreeCapacity(data.rType)) {
                Game.rooms[this.memory.belong].DeleteMission(id)
            }
            this.withdraw_(this.room.storage, data.rType)
            this.workstate(data.rType)
            return
        }
        if (this.memory.working) {
            // console.log('完成取货准备搬运')
            if ((this.room.name != data.disRoom || Game.shard.name != data.shard)) {
                this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
            } else {
                let storage_ = Game.rooms[data.disRoom].storage
                if (storage_) {
                    if (storage_) {
                        let transfer = this.transfer(storage_, data.rType)
                        switch (transfer) {
                            case ERR_NOT_IN_RANGE:
                                this.goTo(storage_.pos, 1)
                                break;
                        }
                        this.workstate(data.rType)
                    }
                } else {
                    /*搜索spawn*/
                    if (this.pos.inRangeTo(this.room.controller, 3)) {
                        var find_dropped_resources = this.room.find(FIND_DROPPED_RESOURCES, {
                            filter: (res) => {
                                return res.amount > 1000 && res.resourceType == 'energy'
                            }
                        })
                        if (find_dropped_resources.length < 1) {
                            this.suicide();
                        }
                    } else {
                        this.goTo(this.room.controller.pos, 1)
                    }

                    // var find_spawn = this.pos.findClosestByRange(FIND_HOSTILE_SPAWNS)
                    // if (!find_spawn) return;
                    // if (this.pos.inRangeTo(find_spawn, 3)) {
                    //     var find_dropped_resources = this.room.find(FIND_DROPPED_RESOURCES, {
                    //         filter: (res) => {
                    //             return res.amount > 1000 && res.resourceType == 'energy'
                    //         }
                    //     })
                    //     if (find_dropped_resources.length < 1) {
                    //         this.suicide();
                    //     }
                    // } else {
                    //     this.goTo(find_spawn.pos, 1)
                    // }
                }
            }
        } else {
            console.log('目标闲置操作')
            this.suicide();
        }

    }

    /*拾荒者执行*/
    public handle_carrygleaner(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (this.room.name == this.memory.belong && this.memory.shard == Game.shard.name && !this.memory.boostState) {
            if (this.room.name == this.memory.belong) {
                switch (missionData.Data.level) {
                    case 'T3':
                    case 'T2':
                    case 'T1':
                        if (!this.BoostCheck(['move', 'carry'])) return
                        break;
                    case 'T0':
                        this.memory.boostState = true;
                        break;
                }
                return
            }
        }

        if (!this.memory.working) this.memory.working = false;
        if (this.memory.working && this.store.getUsedCapacity() == 0) {
            this.memory.working = false;
        }
        if (!this.memory.working && (this.store.getFreeCapacity() == 0)) {
            this.memory.working = true;
        }
        if (this.memory.working) {
            if (!Game.rooms[this.memory.belong]) {
                console.log('操作存在异常的情况')
            }
            if (this.memory.belong != this.room.name) {
                this.goTo(Game.rooms[this.memory.belong].storage.pos, 3)
                // this.arriveTo(new RoomPosition(24, 24, this.memory.belong), 23, data.shard, data.shardData ? data.shardData : null)
                return;
            }
            if (data.suicide * 2 > this.ticksToLive && this.store.getUsedCapacity() < 1) {
                this.suicide();
            }
            if (this.hits < this.hitsMax && this.room.memory.state == 'peace' && Game.rooms[this.memory.belong].name == this.room.name) {
                this.optTower('heal', this);
            }
            // if (this.room.storage) {
            //     let transfer = this.transfer(this.room.storage, data.rType)
            //     switch (transfer) {
            //         case ERR_NOT_IN_RANGE:
            //             this.goTo(this.room.storage.pos, 1)
            //             break;
            //     }
            // } else if (this.room.terminal) {
            //     let transfer = this.transfer(this.room.terminal, data.rType)
            //     switch (transfer) {
            //         case ERR_NOT_IN_RANGE:
            //             this.goTo(this.room.terminal.pos, 1)
            //             break;
            //     }
            // }
            if (Object.keys(this.store).length > 0) {
                for (var r in this.store) {
                    this.say("🚽")
                    /* 如果是自己的房间，则优先扔到最近的storage去 */
                    if (this.room.name == this.memory.belong) {
                        if (!this.room.storage) return
                        if (this.room.storage.store.getUsedCapacity() > this.store.getUsedCapacity()) {
                            this.transfer_(this.room.storage, r as ResourceConstant)
                        }
                        else return
                    }
                    return
                }
            }

        } else {
            if (data.suicide > this.ticksToLive && this.store.getUsedCapacity() > 0) {
                this.memory.working = true;
            }
            if (data.disRoom != this.room.name) {
                this.goTo(new RoomPosition(24, 24, data.disRoom), 23)
                // this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
                return;
            }
            var find_dropped_resources = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (res) => {
                    return res.amount > 0
                }
            })
            if (find_dropped_resources) {
                if (!this.pos.isNearTo(find_dropped_resources)) this.goTo(find_dropped_resources.pos, 1)
                else this.pickup(find_dropped_resources)
                return;
            }
            /*搜索墓碑*/
            var find_tombstones = this.pos.findClosestByRange(FIND_TOMBSTONES, {
                filter: (structure) => {
                    return structure.store.getUsedCapacity() > 0
                }
            })
            if (find_tombstones) {
                // console.log('存在目的信息')
                /*进行资源遍历操作*/
                if (!this.pos.isNearTo(find_tombstones)) {
                    this.goTo(find_tombstones.pos, 1)
                    return;
                }
                if (Object.keys(find_tombstones.store).length > 0) {
                    for (var r in find_tombstones.store) {
                        if (find_tombstones.store[r] > 0) {
                            this.withdraw(find_tombstones, r as ResourceConstant)
                            return;
                        }
                    }
                }
                if (this.withdraw(find_tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(find_tombstones);
                }
                return;
            }

        }
    }

    /* 物资运输任务  已测试 */
    public handle_carry(): void {
        var Data = this.memory.MissionData.Data
        let belongRoom = Game.rooms[this.memory.belong];
        /* 数据不全拒绝执行任务 */
        if (!Data || Data.num <= 0) {
            belongRoom.DeleteMission(this.memory.MissionData.id)
            return
        }
        var thisPos = new RoomPosition(Data.targetPosX, Data.targetPosY, Data.targetRoom)
        var disPos = new RoomPosition(Data.sourcePosX, Data.sourcePosY, Data.sourceRoom)
        if (!thisPos || !disPos) {
            belongRoom.DeleteMission(this.memory.MissionData.id)
            return
        }
        if (Data.rType) {
            this.say(`📦${Data.rType}`)
            /* 指定了资源类型 */
            this.workstate(Data.rType)
            /* 清除杂质 */
            for (var r in this.store) {
                /* 清除杂志 */
                if (r != Data.rType) {
                    this.say("🚽")
                    /* 如果是自己的房间，则优先扔到最近的storage去 */
                    var storage = this.room.storage as StructureStorage
                    if (!storage) return
                    if (this.room.name == this.memory.belong) {
                        if (storage.store.getFreeCapacity() > this.store.getUsedCapacity(r as ResourceConstant)) {
                            this.transfer_(storage, r as ResourceConstant)
                        } else return
                    }
                    return
                }
            }
            if (Data.num) {
                /* 如果指定了num-- 任务结束条件：[搬运了指定num] */
                if (this.memory.working) {
                    if (!this.pos.isNearTo(thisPos)) this.goTo(thisPos, 1)
                    else {
                        /* 寻找 */
                        var targets = thisPos.GetStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link', 'extension'])
                        if (targets.length > 0) {
                            var target = targets[0]
                            var capacity = this.store[Data.rType]
                            /* 如果送货正确，就减少房间主任务中的num，num低于0代表任务完成 */
                            if (this.transfer(target, Data.rType) == OK) {
                                var thisMisson = belongRoom.GainMission(this.memory.MissionData.id)
                                if (thisMisson) {
                                    thisMisson.Data.num -= capacity
                                    if (thisMisson.Data.num <= 0) {
                                        belongRoom.DeleteMission(this.memory.MissionData.id)
                                        return
                                    }
                                }
                            } else {
                                /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                                belongRoom.DeleteMission(this.memory.MissionData.id)
                                return
                            }
                        } else {
                            /*没有建筑的情况下删除任务*/
                            belongRoom.DeleteMission(this.memory.MissionData.id)
                            return
                        }
                    }
                } else {
                    if (!this.pos.isNearTo(disPos)) { this.goTo(disPos, 1) }
                    else {
                        var targets = disPos.GetStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link', 'extension'])
                        if (targets.length > 0) {
                            var target = targets[0] as StructureStorage
                            if ((!target.store || target.store[Data.rType] == 0) && this.store.getUsedCapacity(Data.rType) <= 0) {
                                /* 如果发现没资源了，就取消搬运任务 */
                                belongRoom.DeleteMission(this.memory.MissionData.id)
                                return
                            }
                            /* 如果已经没资源了 */
                            var thisMisson = belongRoom.GainMission(this.memory.MissionData.id)
                            if (thisMisson.Data.num < this.store.getCapacity() && target.store[Data.rType] && target.store[Data.rType] >= thisMisson.Data.num) {
                                this.withdraw(target, Data.rType, thisMisson.Data.num)
                                this.memory.working = true
                                return
                            }
                            if (target.store.getUsedCapacity(Data.rType) < this.store.getUsedCapacity()) {
                                this.withdraw(target, Data.rType)
                                this.memory.working = true
                                return
                            }
                            if (this.withdraw(target, Data.rType) == ERR_NOT_ENOUGH_RESOURCES) {
                                this.memory.working = true
                            }
                        }
                    }
                }
            } else {
                /* 未指定数目-- 任务结束条件：[source 空了 或 target 满了] */
                if (this.memory.working) {
                    if (!this.pos.isNearTo(thisPos)) this.goTo(thisPos, 1)
                    else {
                        /* 寻找 */
                        var targets = thisPos.GetStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link', 'extension'])
                        if (targets.length > 0) {
                            var target = targets[0]
                            var capacity = this.store[Data.rType]
                            if (this.transfer(target, Data.rType) != OK) {
                                /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                                belongRoom.DeleteMission(this.memory.MissionData.id)
                                return
                            }
                            // 对于类似于防御塔正在使用能量的任务
                            if (target.store.getFreeCapacity() < 50) {
                                belongRoom.DeleteMission(this.memory.MissionData.id)
                                return
                            }
                        }
                        else {
                            belongRoom.DeleteMission(this.memory.MissionData.id)
                            return
                        }
                    }
                } else {
                    /* 清除杂质 */
                    var storage = this.room.storage as StructureStorage
                    if (storage) {
                        for (var r in this.store) {
                            if (r != Data.rType) {
                                this.say("🚽")
                                /* 如果是自己的房间，则优先扔到最近的storage去 */
                                if (this.room.name == this.memory.belong) {
                                    if (storage.store.getUsedCapacity() > this.store.getUsedCapacity()) {
                                        this.transfer_(storage, r as ResourceConstant)
                                    }
                                    else return
                                }
                                return
                            }
                        }
                    }
                    /*  */
                    if (!this.pos.isNearTo(disPos)) this.goTo(disPos, 1)
                    else {
                        var targets = disPos.GetStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link', 'extension'])
                        var ruin = disPos.GetRuin()
                        if (targets.length > 0 || ruin) {
                            var target = targets[0]
                            var targetR = ruin as Ruin
                            if (target) {
                                if ((!target.store || target.store[Data.rType] == 0) && this.store.getUsedCapacity(Data.rType) == 0) {
                                    /* 如果发现没资源了，就取消搬运任务 */
                                    belongRoom.DeleteMission(this.memory.MissionData.id)
                                    return
                                }
                                else {
                                    this.withdraw(target, Data.rType)
                                    this.memory.working = true
                                }
                            }
                            if (targetR) {
                                if (!targetR.store || targetR.store.getUsedCapacity() == 0) {
                                    /* 如果发现没资源了，就取消搬运任务 */
                                    belongRoom.DeleteMission(this.memory.MissionData.id)
                                    return
                                }
                                for (var t in targetR.store) {
                                    this.withdraw(targetR, t as ResourceConstant)
                                }
                                return
                            }
                        }
                    }
                }
            }
        }
        else {
            this.say(`📦`)
            /* 未指定资源类型 */
            /* working状态转换条件 */
            if (!this.memory.working) this.memory.working = false
            if (this.memory.working) {
                if (!this.store || Object.keys(this.store).length <= 0)
                    this.memory.working = false
            } else {
                if (this.store.getFreeCapacity() == 0)
                    this.memory.working = true
            }
            if (Data.num) {
                /* 不考虑这种类型的任务 */
                belongRoom.DeleteMission(this.memory.MissionData.id)
                return
            } else {
                /* 只考虑这种任务 */
                if (this.memory.working) {
                    if (!this.pos.isNearTo(thisPos)) this.goTo(thisPos, 1)
                    else {
                        /* 寻找 */
                        var targets = thisPos.GetStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link', 'extension'])
                        if (targets.length > 0) {
                            var target = targets[0]

                            var capacity = this.store[Data.rType]
                            /* 如果送货正确，就减少房间主任务中的num，num低于0代表任务完成 */
                            for (var i in this.store) {
                                if (this.transfer(target, i as ResourceConstant) != OK) {
                                    /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                                    belongRoom.DeleteMission(this.memory.MissionData.id)
                                    return
                                }
                            }

                            if (target.store.getFreeCapacity() < 40000) {
                                /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                                belongRoom.DeleteMission(this.memory.MissionData.id)
                                this.suicide();
                            }
                        }
                        else {
                            belongRoom.DeleteMission(this.memory.MissionData.id)
                            return
                        }
                    }
                } else {
                    if (this.ticksToLive < 10) {
                        this.suicide();
                        return;
                    }
                    var disPos = new RoomPosition(Data.sourcePosX, Data.sourcePosY, Data.sourceRoom)
                    if (!disPos) {
                        belongRoom.DeleteMission(this.memory.MissionData.id)
                        return
                    }
                    if (!this.pos.isNearTo(disPos)) this.goTo(disPos, 1)
                    else {
                        var targets = disPos.GetStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link', 'extension'])
                        var ruin = disPos.GetRuin()
                        if (targets.length > 0 || ruin) {
                            var target = targets[0] as StructureStorage
                            var targetR = ruin as Ruin
                            if (target) {
                                if (!target.store || target.store.getUsedCapacity() == 0) {
                                    /* 如果发现没资源了，就取消搬运任务 */
                                    belongRoom.DeleteMission(this.memory.MissionData.id)
                                    return
                                }
                                for (var t in target.store) {
                                    this.withdraw(target, t as ResourceConstant)
                                }
                                return
                            }
                            if (targetR) {
                                if (!targetR.store || targetR.store.getUsedCapacity() == 0) {
                                    /* 如果发现没资源了，就取消搬运任务 */
                                    belongRoom.DeleteMission(this.memory.MissionData.id)
                                    return
                                }
                                for (var t in targetR.store) {
                                    this.withdraw(targetR, t as ResourceConstant)
                                }
                                return
                            }
                            this.memory.working = true;
                        }
                    }
                }
            }
        }
    }
}