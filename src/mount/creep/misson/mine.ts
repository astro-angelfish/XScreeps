import { colors, isInArray, unzipPosition, zipPosition } from "@/utils";

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissonMineExtension extends Creep {
    /* 外矿开采处理 */
    public handle_outmine(): void {
        var creepMission = this.memory.MissionData.Data
        var globalMission = Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)

        //中央九房处理
        function centralSector(creep_: Creep, range: number): boolean {
            var globalMission = Game.rooms[creep_.memory.belong].GainMission(creep_.memory.MissionData.id)
            if (creep_.memory.enemyID) {
                var enemy = Game.getObjectById(creep_.memory.enemyID as Id<Creep>) as Creep
                if (enemy) {
                    if (creep_.pos.inRangeTo(enemy, 6)) {
                        creep_.Flee(enemy.pos, 5)
                        return true
                    }
                } else {
                    creep_.memory.enemyID = undefined
                }
            }
            if (globalMission.Data.lairID) {  //使用缓存减少cpu
                for (const lairID of globalMission.Data.lairID) {
                    var lair = Game.getObjectById(lairID) as StructureKeeperLair
                    if (!lair.ticksToSpawn) {  //说明有keeper
                        if (creep_.pos.inRangeTo(lair, range)) {
                            var enemies = lair.pos.findInRange(FIND_HOSTILE_CREEPS, range, {
                                filter: (c) => {
                                    return c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
                                }
                            });
                            if (enemies.length > 0) {
                                creep_.memory.enemyID = enemies[0].id
                                creep_.Flee(enemies[0].pos, 5)
                                return true
                            }
                        }
                    } else if (lair.ticksToSpawn < 5) { //快产爬了
                        creep_.Flee(lair.pos, 5)
                        return true
                    }
                }
            } else {
                //寻找Keeper
                var keeper = creep_.pos.findInRange(FIND_HOSTILE_CREEPS, range, {
                    filter: (creep) => {
                        return creep.owner.username == 'Source Keeper' || creep.owner.username == 'Invader'
                    }
                })
                //逃离keeper
                if (keeper.length > 0) {
                    creep_.Flee(keeper[0].pos, 5)
                    creep_.memory.enemyID = keeper[0].id
                    return true
                }
            }
            return false
        }

        if (!globalMission) { this.say("找不到全局任务了！"); this.memory.MissionData = {}; return }
        if (this.hits < this.hitsMax && globalMission.Data.state == 2) {
            var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.owner.username)
                }
            })
            if (enemy) globalMission.Data.state = 3
        }
        if (this.memory.role == 'out-claim') {
            if (globalMission.Data.state == 4) {
                return
            }
            if (this.room.name != creepMission.disRoom && !this.memory.disPos) {
                // this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20, null, 2)
                this.moveTo(new RoomPosition(25, 25, creepMission.disRoom), { range: 20, visualizePathStyle: { stroke: colors.purple } })
                if (this.room.name != this.memory.belong) {
                    /* 如果是别人的房间就不考虑 */
                    if (this.room.controller && this.room.controller.owner && this.room.controller.owner.username != this.owner.username)
                        return
                    // if (Memory.outMineData && Memory.outMineData[this.room.name]) {
                    //     for (var i of Memory.outMineData[this.room.name].road) {
                    //         var thisPos = unzipPosition(i)
                    //         if (thisPos.roomName == this.name && !thisPos.GetStructure('road')) {
                    //             thisPos.createConstructionSite('road')
                    //         }
                    //     }
                    // }
                }
            }
            if (!this.memory.disPos && this.room.name == creepMission.disRoom && this.room.controller) {
                var controllerPos = this.room.controller.pos
                this.memory.disPos = zipPosition(controllerPos)
            }
            if (this.memory.disPos) {
                if (!this.memory.num) this.memory.num = 5000
                if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd && this.room.controller.reservation.username == this.owner.username && this.room.controller.reservation.ticksToEnd <= this.memory.num) {
                    var Cores = this.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_INVADER_CORE
                        }
                    })
                    if (Cores.length > 0)
                        globalMission.Data.state = 3
                }
                if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd && this.room.controller.reservation.username != this.owner.username) {
                    globalMission.Data.state = 3
                }
                if (!this.pos.isNearTo(this.room.controller)) {
                    var controllerPos = unzipPosition(this.memory.disPos)
                    if (controllerPos.roomName == this.room.name)
                        // this.goTo(controllerPos, 1, 500)
                        this.moveTo(controllerPos, { range: 1, maxOps: 500, visualizePathStyle: { stroke: colors.purple } })
                    else //this.goTo(controllerPos, 1, 800)
                        this.moveTo(controllerPos, { range: 1, maxOps: 800, visualizePathStyle: { stroke: colors.purple } })
                }
                else {
                    if (this.room.controller && (!this.room.controller.sign || (Game.time - this.room.controller.sign.time) > 100000)) {
                        if (["somygame"].includes(this.owner.username)) {
                            this.signController(this.room.controller, `麻了，麻了，彻底麻了`)
                        } else if (["Morningtea"].includes(this.owner.username)) {
                            if (this.room.controller.sign) {
                                this.signController(this.room.controller, ``)
                            }
                        } else if (!["superbitch", "ExtraDim"].includes(this.owner.username)) {
                            this.signController(this.room.controller, `${this.owner.username}'s 🌾 room!  Auto clean, Please keep distance!`)
                        }
                        else if (["CalvinG"].includes(this.owner.username)) {
                            this.signController(this.room.controller, `垒土成垛，择高而上🌾`)
                        }
                        else {
                            this.signController(this.room.controller, `躬耕陇亩`)
                        }
                    }
                    /* somygame 改 */
                    let _reserve_state = 0;
                    if (this.room.controller.reservation) {
                        if (this.room.controller.reservation.username == "Invader" && this.room.controller.reservation.ticksToEnd > 0) {
                            this.attackController(this.room.controller)
                            _reserve_state = 1
                        }
                    }
                    if (_reserve_state < 1) {
                        this.reserveController(this.room.controller)
                    }
                    /* 终 */
                    // if (Game.time % 91 == 0) {
                    //     if (Memory.outMineData && Memory.outMineData[this.room.name]) {
                    //         for (var i of Memory.outMineData[this.room.name].road) {
                    //             var thisPos = unzipPosition(i) as RoomPosition
                    //             if (thisPos.roomName == this.room.name && !thisPos.GetStructure('road')) {
                    //                 thisPos.createConstructionSite('road')
                    //             }
                    //         }
                    //     }
                    // }
                }
                if (this.room.controller.reservation)
                    this.memory.num = this.room.controller.reservation.ticksToEnd
            }
        }
        else if (this.memory.role == 'out-harvest') {
            if (!Game.rooms[creepMission.disRoom]) return
            if (!Memory.outMineData[creepMission.disRoom] || Memory.outMineData[creepMission.disRoom].minepoint.length <= 0) return
            for (var point of Memory.outMineData[creepMission.disRoom].minepoint) {
                if (!point.bind) point.bind = {}
                if (!point.bind.harvest && !this.memory.bindpoint) {
                    point.bind.harvest = this.name
                    this.memory.bindpoint = point.pos
                }
            }
            if (!this.memory.bindpoint) return
            if (this.memory.carsourceid) {
                var source = Game.getObjectById(this.memory.carsourceid as Id<Source>) as Source;

            } else {
                var disPos = unzipPosition(this.memory.bindpoint)
                var source = disPos.lookFor(LOOK_SOURCES)[0]
            }

            if (!source) return
            this.workstate('energy')

            //防御状态回到自己房间
            if (globalMission.Data.state == 3 || globalMission.Data.hasInvader || Game.time < globalMission.Data.sleepTime) {
                // this.goTo(new RoomPosition(25, 25, this.memory.belong), 15)
                this.moveTo(new RoomPosition(25, 25, this.memory.belong), { range: 15, visualizePathStyle: { stroke: colors.lime } })
                if (this.room.name != this.memory.belong) {
                    return
                } else if ((Game.time - globalMission.Data.sleepTime) > this.ticksToLive + 100) {
                    this.suicide()
                }
            }
            //中央九房特殊处理
            if (globalMission.Data.state == 4) {
                if (centralSector(this, 5)) return
            }

            if (this.memory.working) {
                var container_ = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (stru) => { return stru.structureType == 'container' } }) as StructureContainer[]
                if (container_[0]) {
                    if (!this.pos.isEqualTo(container_[0].pos)) {
                        // this.goTo(container_[0].pos, 0)
                        this.moveTo(container_[0], { range: 0, visualizePathStyle: { stroke: colors.yellow } })
                    }
                    else {
                        if (container_[0].hits < container_[0].hitsMax) {
                            this.repair(container_[0])
                            return
                        }
                        this.transfer(container_[0], 'energy')
                    }
                    Memory.outMineData[creepMission.disRoom].car = true
                }
                else {
                    Memory.outMineData[creepMission.disRoom].car = false
                    var constainer_constru = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, { filter: (stru) => { return stru.structureType == 'container' } })
                    if (constainer_constru[0]) {
                        this.build(constainer_constru[0])
                    }
                    else {
                        this.pos.createConstructionSite('container')
                    }
                }
            }
            else {
                if (!this.pos.isNearTo(disPos)) {
                    // this.goTo(disPos, 1)
                    this.moveTo(disPos, { range: 1, visualizePathStyle: { stroke: colors.yellow } })
                }
                else this.harvest(source)
            }
        }
        else if (this.memory.role == 'out-car') {
            this.memory.crossLevel = 9
            if (!Game.rooms[creepMission.disRoom]) return
            this.workstate('energy', 0.9)
            if (!Memory.outMineData[creepMission.disRoom] || Memory.outMineData[creepMission.disRoom].minepoint.length <= 0) return
            if (!this.memory.bindpoint) {
                for (var point of Memory.outMineData[creepMission.disRoom].minepoint) {
                    if (!point.bind.car) {
                        point.bind.car = this.name
                        this.memory.bindpoint = point.pos
                        break
                    }
                }
            }
            if (!this.memory.bindpoint) return
            var disPos = unzipPosition(this.memory.bindpoint)
            if ((Game.time - global.Gtime[this.memory.belong]) % 91 == 0 && this.room.name != this.memory.belong) {
                if (Memory.outMineData && Memory.outMineData[disPos.roomName]) {
                    for (var i of Memory.outMineData[disPos.roomName].road) {
                        var thisPos = unzipPosition(i) as RoomPosition
                        if (!Game.rooms[thisPos.roomName]) continue;
                        if (!thisPos.GetStructure('road')) {
                            thisPos.createConstructionSite('road')
                        }
                    }
                }
            }

            //防御状态回到自己房间
            if (globalMission.Data.state == 3 || globalMission.Data.hasInvader || Game.time < globalMission.Data.sleepTime) {
                // this.goTo(new RoomPosition(25, 25, this.memory.belong), 15)
                this.moveTo(new RoomPosition(25, 25, this.memory.belong), { range: 15, visualizePathStyle: { stroke: colors.lime } })
                if (this.room.name != this.memory.belong) {
                    return
                } else {
                    if (this.store.getUsedCapacity() > 0) {
                        this.memory.working = true
                    } else {
                        if ((Game.time - globalMission.Data.sleepTime) > this.ticksToLive + 100) this.suicide()
                        this.memory.working = false
                        return
                    }
                }
            }
            //中央九房特殊处理
            if (globalMission.Data.state == 4) {
                if (centralSector(this, 5)) return
            }

            if (this.memory.working) {
                var stroage_ = Game.rooms[this.memory.belong].storage
                if (!stroage_) return
                if (!this.pos.isNearTo(stroage_)) {
                    if (this.getActiveBodyparts(WORK) > 0) {
                        if ((Game.time - global.Gtime[this.memory.belong]) % 7 == 0) {
                            var constructions = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, {
                                filter: (constr) => {
                                    return constr.structureType == 'road'
                                }
                            })
                            if (constructions) {
                                this.memory.targetID = constructions.id
                            }
                        }
                        // console.log(this.name, '标记1')
                        if (this.memory.targetID) {
                            var targetRoad = Game.getObjectById(this.memory.targetID as Id<ConstructionSite>)
                            if (targetRoad) {
                                this.build_(targetRoad)
                                return
                            } else delete this.memory.targetID
                        }

                        // console.log(this.name, '标记2')
                        if (this.room.name != this.memory.belong) {/*只修理外矿*/
                            var road_ = this.pos.GetStructure('road')
                            if (road_ && road_.hits < road_.hitsMax - 200 && this.ticksToLive > 100) {
                                this.repair(road_)
                                // this.goTo(stroage_.pos, 1, null, 4);
                                this.moveTo(stroage_, { range: 1, plainCost: 4, swampCost: 20, visualizePathStyle: { stroke: colors.orange } })
                                return
                            }
                        }
                    }
                    // console.log(this.name, '标记3')
                    // if (Memory.outMineData && Memory.outMineData[creepMission.roomName]) {
                    // this.goTo(stroage_.pos, 1, null, 4, Memory.outMineData[creepMission.roomName].road)
                    // } else {
                    //     this.goTo(stroage_.pos, 1, null, 4)
                    // }
                    this.moveTo(stroage_, { range: 1, plainCost: 4, swampCost: 20, visualizePathStyle: { stroke: colors.orange } })

                }
                else {
                    if (Object.keys(this.store).length > 0) {
                        for (var r in this.store) {
                            if (this.room.storage.store.getFreeCapacity() > this.store.getUsedCapacity()) {
                                this.transfer_(this.room.storage, r as ResourceConstant)
                                return
                            }
                            else return
                        }
                    }
                    if (this.ticksToLive < 100) this.suicide()
                }
            }
            else {
                if (this.ticksToLive < 200 || this.hits < this.hitsMax) {
                    let _path_length = 100;
                    if (this.memory.moveData?.path) {
                        _path_length = this.memory.moveData.path.length;
                    }
                    if (this.memory.belong == this.room.name) {
                        if (this.hits < this.hitsMax) this.optTower('heal', this);
                        if (_path_length * 2 + 30 > this.ticksToLive) {
                            this.suicide()
                        }
                    } else {
                        if (this.ticksToLive < _path_length + 20) this.memory.working = true;
                    }
                }
                if (!Game.rooms[disPos.roomName]) {
                    // this.goTo(disPos, 1)
                    this.moveTo(disPos, { range: 1, visualizePathStyle: { stroke: colors.orange } })
                    return
                }
                // this.say("🚗")
                var container_ = disPos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (stru) => {
                        return stru.structureType == 'container'
                    }
                }) as StructureContainer[]
                if (container_[0] && container_[0].store.getUsedCapacity() > 0) {
                    if (!this.pos.isNearTo(container_[0])) {
                        // this.goTo(container_[0].pos, 1);
                        this.moveTo(disPos, { range: 1, visualizePathStyle: { stroke: colors.orange } })
                        return;
                    }
                    /*进行资源遍历操作*/
                    if (Object.keys(container_[0].store).length > 0) {
                        for (var r in container_[0].store) {
                            if (container_[0].store[r] > 0) {
                                this.withdraw(container_[0], r as ResourceConstant);
                                return;
                            }
                        }
                    }
                }
                else if (!container_[0]) {
                    // this.goTo(disPos, 2)
                    this.moveTo(disPos, { range: 2, visualizePathStyle: { stroke: colors.orange } })
                    return
                }
            }
        }
        else if (this.memory.role == 'out-carry') {
            this.memory.crossLevel = 9
            if (!Game.rooms[creepMission.disRoom]) return
            this.workstate('energy', 0.9)

            //防御状态回到自己房间
            if (globalMission.Data.state == 3 || globalMission.Data.hasInvader || Game.time < globalMission.Data.sleepTime) {
                // this.goTo(new RoomPosition(25, 25, this.memory.belong), 15)
                this.moveTo(new RoomPosition(25, 25, this.memory.belong), { range: 15, visualizePathStyle: { stroke: colors.lime } })
                if (this.room.name != this.memory.belong) {
                    return
                } else {
                    if (this.store.getUsedCapacity() > 0) {
                        this.memory.working = true
                    } else {
                        if ((Game.time - globalMission.Data.sleepTime) > this.ticksToLive + 100) this.suicide()
                        this.memory.working = false
                        return
                    }
                }
            }
            //中央九房特殊处理
            if (globalMission.Data.state == 4) {
                if (centralSector(this, 5)) return
            }

            if (this.memory.working) {
                var stroage_ = Game.rooms[this.memory.belong].storage
                if (!stroage_) return
                if (!this.pos.isNearTo(stroage_)) {
                    if (Memory.outMineData && Memory.outMineData[creepMission.roomName]) {
                        // this.goTo(stroage_.pos, 1, null, 4, Memory.outMineData[creepMission.roomName].road)
                        this.moveTo(stroage_, { plainCost: 4, swampCost: 20, visualizePathStyle: { stroke: colors.rose } })
                    } else {
                        // this.goTo(stroage_.pos, 1, null, 4)
                        this.moveTo(stroage_, { plainCost: 4, swampCost: 20, visualizePathStyle: { stroke: colors.rose } })
                    }
                }
                else {
                    if (Object.keys(this.store).length > 0) {
                        for (var r in this.store) {
                            if (this.room.storage.store.getFreeCapacity() > this.store.getUsedCapacity()) {
                                this.transfer_(this.room.storage, r as ResourceConstant)
                            }
                            else return
                        }
                    }
                    if (this.ticksToLive < 100) this.suicide()
                }
            }
            else {
                if (this.ticksToLive < 200 || this.hits < this.hitsMax) {
                    let _path_length = 100;
                    if (this.memory.moveData?.path) {
                        _path_length = this.memory.moveData.path.length;
                    }
                    if (this.memory.belong == this.room.name) {
                        if (this.hits < this.hitsMax) this.optTower('heal', this);
                        if (_path_length * 2 + 30 > this.ticksToLive) {
                            this.suicide()
                        }
                    } else {
                        if (this.ticksToLive < _path_length + 20) this.memory.working = true;
                    }
                }
                if (this.room.name != creepMission.disRoom) {
                    // this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)
                    this.moveTo(new RoomPosition(25, 25, creepMission.disRoom), { range: 20, visualizePathStyle: { stroke: colors.slate } })
                    return
                }
                // this.say("🚗")
                if (!this.memory.targetID && (Game.time - global.Gtime[this.memory.belong]) % 5 == 0) {
                    var drop = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (res: Resource) => {
                            return (res.resourceType == 'energy' ? res.amount > 300 : true)
                        }
                    }) as Resource
                    var tomb = this.pos.findClosestByRange(FIND_TOMBSTONES, {
                        filter: (tomb: Tombstone) => {
                            return (tomb.store.getUsedCapacity() > 300 || tomb.store.getUsedCapacity() > tomb.store.getUsedCapacity('energy'))
                        }
                    }) as Tombstone
                    var ruin = this.pos.findClosestByRange(FIND_RUINS, {
                        filter: (ruin: Tombstone) => {
                            return (ruin.store.getUsedCapacity() > 300 || ruin.store.getUsedCapacity() > ruin.store.getUsedCapacity('energy'))
                        }
                    }) as Ruin
                    var container = this.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType == 'container' &&
                                (stru.store.getUsedCapacity() > 1800 || stru.store.getUsedCapacity() > stru.store.getUsedCapacity('energy'))
                        }
                    }) as StructureContainer
                    var range = 0xff
                    if (drop && drop.pos.getRangeTo(this) < range) {
                        range = drop.pos.getRangeTo(this)
                        this.memory.targetID = drop.id
                    }
                    if (tomb && tomb.pos.getRangeTo(this) < range) {
                        range = tomb.pos.getRangeTo(this)
                        this.memory.targetID = tomb.id
                    }
                    if (ruin && ruin.pos.getRangeTo(this) < range) {
                        range = ruin.pos.getRangeTo(this)
                        this.memory.targetID = ruin.id
                    }
                    if (container) {
                        this.memory.targetID = container.id
                    }
                } else {
                    var target = Game.getObjectById(this.memory.targetID) as Resource | Tombstone | Ruin | StructureContainer
                    if (!target) {
                        delete this.memory.targetID
                        return
                    }
                    if (!this.pos.isNearTo(target)) {
                        // this.goTo(target.pos, 1, null, 4)
                        this.moveTo(target, { visualizePathStyle: { stroke: colors.rose } })
                    }
                    if (target instanceof Resource) {
                        this.pickup(target)
                    } else {
                        if (target.store.getUsedCapacity() < 300 && target.store.getUsedCapacity('energy') == target.store.getUsedCapacity()) {
                            delete this.memory.targetID
                            return
                        }
                        if (Object.keys(target.store).length > 0) {
                            for (const r in target.store) {
                                if (target.store[r] > 0) {
                                    this.withdraw(target, r as ResourceConstant);
                                }
                            }
                        } else {
                            delete this.memory.targetID
                        }
                    }
                }
            }
        }
        else if (this.memory.role == 'out-defend') {
            this.memory.crossLevel = 11
            var heal_state = false;
            if (this.hits < this.hitsMax) heal_state = true
            if (this.room.name != creepMission.disRoom) {
                // this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)
                this.moveTo(new RoomPosition(25, 25, creepMission.disRoom), { range: 20, visualizePathStyle: { stroke: colors.slate } })
                if (heal_state) { this.heal(this) }
            }
            else {
                if (globalMission.Data.state == 2) {
                    if (heal_state) { this.heal(this) }
                    let wounded = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (creep) => {
                            return creep.hits < creep.hitsMax && creep != this
                        }
                    })
                    if (wounded) {
                        if (!this.pos.isNearTo(wounded)) {
                            // this.goTo(wounded.pos, 1)
                            this.moveTo(wounded, { range: 1, visualizePathStyle: { stroke: colors.emerald } })
                        }
                        this.heal(wounded)
                    } else {
                        let wounded_isNearTo = this.pos.findInRange(FIND_MY_CREEPS, 1, {
                            filter: (creep) => {
                                return creep.hits < creep.hitsMax && creep != this
                            }
                        })
                        this.heal(wounded_isNearTo[0])
                    }
                    if ((Game.time - global.Gtime[this.memory.belong]) % 7 && !this.memory.targetID) {
                        return
                    }
                }
                if (!this.memory.targetID) {
                    var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                        filter: (creep) => {
                            return !isInArray(Memory.whitesheet, creep.owner.username)
                        }
                    })
                    if (enemy) {
                        this.memory.targetID = enemy.id
                        return
                    } else {
                        var InvaderCore = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                            filter: (stru) => {
                                return stru.structureType == STRUCTURE_INVADER_CORE
                            }
                        })
                        if (InvaderCore) {
                            this.memory.targetID = InvaderCore.id
                            return
                        }
                    }
                } else {
                    var atkTarget = Game.getObjectById(this.memory.targetID) as Creep | Structure
                    if (!atkTarget) {
                        delete this.memory.targetID
                        return
                    }
                    if (atkTarget instanceof Creep) {
                        /*判定是否相邻*/
                        if (this.pos.isNearTo(atkTarget)) {
                            this.attack(atkTarget)
                            this.rangedMassAttack()
                        } else {
                            if ((atkTarget.owner.username == 'Invader') || (atkTarget.getActiveBodyparts(ATTACK) == 0 && atkTarget.getActiveBodyparts(RANGED_ATTACK) == 0)) {
                                // this.goTo(atkTarget.pos, 1)
                                this.moveTo(atkTarget, { range: 1, visualizePathStyle: { stroke: colors.red } })
                            } else {
                                if (heal_state) {
                                    this.Flee(atkTarget.pos, 3)
                                } else {
                                    // this.goTo(atkTarget.pos, 3)
                                    this.moveTo(atkTarget, { range: 3, visualizePathStyle: { stroke: colors.red } })
                                }
                            }
                            this.rangedAttack(atkTarget)
                        }
                    } else {
                        this.memory.standed = true
                        if (!this.pos.isNearTo(atkTarget)) {
                            // this.goTo(atkTarget.pos, 1)
                            this.moveTo(atkTarget, { range: 1, visualizePathStyle: { stroke: colors.red } })
                            this.rangedAttack(atkTarget)
                        } else {
                            this.rangedMassAttack()
                            this.attack(atkTarget)
                        }
                    }
                }
                if (heal_state) { this.heal(this) }
            }
        }
        else {    //攻击keeper
            this.memory.crossLevel = 12
            var heal_state = false;
            if (this.hits < this.hitsMax) heal_state = true
            if (this.room.name != creepMission.disRoom) {
                // this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)
                this.moveTo(new RoomPosition(25, 25, creepMission.disRoom), { range: 20, visualizePathStyle: { stroke: colors.slate } })
                if (heal_state) { this.heal(this) }
            }
            else {
                //缓存据点id
                if (!globalMission.Data.updatedLairs) {
                    const lairFilter = {
                        filter: (stru: Structure) => {
                            return stru.structureType == STRUCTURE_KEEPER_LAIR &&
                                (!globalMission.Data.lairID || !globalMission.Data.lairID.includes(stru.id))
                                && stru.pos.findInRange(FIND_SOURCES, 5).length > 0
                        }
                    }
                    var hasLair = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, lairFilter)
                    let cnt = 1
                    while (hasLair && cnt < 4) {
                        if (!globalMission.Data.lairID) {
                            globalMission.Data.lairID = [hasLair.id]
                        } else {
                            globalMission.Data.lairID.push(hasLair.id)
                        }
                        hasLair = hasLair.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, lairFilter)
                        cnt++
                    }
                    globalMission.Data.updatedLairs = true
                    if (globalMission.Data.lairID.length > 0) {
                        globalMission.Data.nextLair = 0
                    }
                }

                //优先攻击Invader
                if (globalMission.Data.hasInvader) {
                    var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                        filter: (c) => {
                            return c.owner.username == 'Invader'
                        }
                    });
                    if (enemy) {
                        this.say(`🔪(${enemy.pos.x},${enemy.pos.y})`)
                        if (this.pos.isNearTo(enemy)) {
                            this.attack(enemy)
                        } else {
                            // this.goTo(enemy.pos, 1)
                            this.moveTo(enemy, { range: 1, visualizePathStyle: { stroke: colors.red } })
                        }
                        return
                    } else {
                        globalMission.Data.hasInvader = false
                    }
                }

                //寻找敌对爬
                var nextLair = Game.getObjectById(globalMission.Data.lairID[globalMission.Data.nextLair]) as StructureKeeperLair
                if (!this.memory.targetID) {
                    var enemies = nextLair.pos.findInRange(FIND_HOSTILE_CREEPS, 7, {
                        filter: (c) => {
                            return c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
                        }
                    });
                    if (enemies.length > 0) {
                        this.memory.targetID = enemies[0].id
                        if (enemies[0].owner.username == 'Source Keeper') {
                            globalMission.Data.nextLair = (globalMission.Data.nextLair + 1) % globalMission.Data.lairID.length
                        }
                    } else {
                        delete this.memory.targetID
                        //空闲时治疗其他爬
                        if (!heal_state) {
                            let wounded = this.pos.findInRange(FIND_MY_CREEPS, 5, {
                                filter: (creep) => {
                                    return creep.hits < creep.hitsMax && creep != this
                                }
                            })
                            if (wounded.length > 0) {
                                if (!this.pos.isNearTo(wounded[0])) {
                                    // this.goTo(wounded[0].pos, 1)
                                    this.moveTo(wounded[0], { range: 1, visualizePathStyle: { stroke: colors.emerald } })
                                    this.rangedHeal(wounded[0])
                                } else {
                                    this.heal(wounded[0])
                                }
                                return
                            }
                        } else {
                            this.heal(this)
                        }
                        //没事情干就到下一个据点
                        this.say(`🚨(${nextLair.pos.x},${nextLair.pos.y})`)
                        // this.goTo(nextLair.pos, 1, 800, 2)
                        this.moveTo(nextLair, { range: 1, visualizePathStyle: { stroke: colors.slate } })
                    }
                }

                if (this.memory.targetID) {
                    var enemy = Game.getObjectById(this.memory.targetID as Id<Creep>) as Creep
                    if (enemy) {
                        if (this.pos.isNearTo(enemy)) {
                            this.attack(enemy)
                        } else {
                            if (heal_state) {
                                this.heal(this)
                            }
                            this.say(`⚔️(${enemy.pos.x},${enemy.pos.y})`)
                            // this.goTo(enemy.pos, 1, 800, 2)
                            this.moveTo(enemy, { range: 1, visualizePathStyle: { stroke: colors.red } })
                        }
                    } else {
                        delete this.memory.targetID
                    }
                }
            }
        }
    }

    /* power采集 */
    public handle_power(): void {
        if (!this.memory.notifyWhenAttacked) {
            this.notifyWhenAttacked(false)
            this.memory.notifyWhenAttacked = true;
        }
        var creepMission = this.memory.MissionData.Data
        var globalMission = Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)
        if (!globalMission) { this.say("找不到全局任务了！"); this.memory.MissionData = {}; return }
        var role = this.memory.role
        var missonPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
        if (!missonPostion) { this.say("找不到目标地点！"); return }
        if (role == 'power-attack') {
            this.memory.standed = true
            if (globalMission.Data.state == 1) {
                /* 先组队 */
                if (!this.memory.double) {
                    if (Game.time % 7 == 0) {
                        if (globalMission.CreepBind['power-heal'].bind.length > 0) {
                            for (var c of globalMission.CreepBind['power-heal'].bind) {
                                if (Game.creeps[c] && Game.creeps[c].pos.roomName == this.room.name && !Game.creeps[c].memory.double) {
                                    var disCreep = Game.creeps[c]
                                    disCreep.memory.double = this.name
                                    this.memory.double = disCreep.name
                                }
                            }
                        }
                    }
                    return
                }
                /* 附件没有治疗虫就等 */
                if (!Game.creeps[this.memory.double]) { this.suicide(); return }
                if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double]) && (!isInArray([0, 49], this.pos.x) && !isInArray([0, 49], this.pos.y)))
                    return
                if (this.fatigue || Game.creeps[this.memory.double].fatigue)
                    return

                /*出击 主动攻击*/
                const h_creeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 4, {
                    filter: function (object) {
                        return !isInArray(Memory.whitesheet, object.owner.username) && (!isInArray([0, 49], object.pos.x) && !isInArray([0, 49], object.pos.y))
                    }
                });
                if (h_creeps.length > 0) {
                    // console.log("找到攻击目标",h_creeps[0].name)
                    /*搜索拥有攻击组件的爬为优先*/
                    let _creeps_data: Creep = null;
                    for (var creep_data of h_creeps) {
                        if (!_creeps_data) {
                            if (creep_data.getActiveBodyparts(ATTACK)) _creeps_data = creep_data
                        }
                    }
                    if (!_creeps_data) {
                        _creeps_data = h_creeps[0];
                    }
                    if (this.pos.isNearTo(_creeps_data)) {
                        this.attack(_creeps_data);
                    } else {
                        this.goTo(_creeps_data.pos, 1)
                    }
                    return
                }
                /* 先寻找powerbank周围的空点，并寻找空点上有没有人 */
                if (!this.pos.isNearTo(missonPostion)) {
                    if (!Game.rooms[missonPostion.roomName]) {
                        this.goTo(missonPostion, 1)
                        return
                    }
                    var harvest_void: RoomPosition[] = missonPostion.getSourceVoid()
                    var active_void: RoomPosition[] = []
                    for (var v of harvest_void) {
                        var creep_ = v.lookFor(LOOK_CREEPS)
                        if (creep_.length <= 0) active_void.push(v)

                    }
                    if (active_void.length > 0) {
                        this.goTo(missonPostion, 1)
                    }
                    else {
                        if (!missonPostion.inRangeTo(this.pos.x, this.pos.y, 3))
                            this.goTo(missonPostion, 3)
                        else {
                            if (Game.time % 10 == 0) {
                                var powerbank_ = missonPostion.GetStructure('powerBank')
                                if (powerbank_) {
                                    var enemy_creep = powerbank_.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
                                    if (enemy_creep.length > 0 && powerbank_ && powerbank_.hits < 600000) {
                                        globalMission.Data.state = 2
                                    }
                                }
                            }
                        }
                    }
                }
                else {

                    /* 这是被攻击了 */
                    // if (this.hits < 1000) {
                    //     /* 被攻击停止所有爬虫生产 */
                    //     globalMission.CreepBind['power-attack'].num = 0
                    //     globalMission.CreepBind['power-heal'].num = 0
                    //     let hostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
                    //     Game.notify(`[warning] 采集爬虫小队${this.name}遭受${hostileCreep ? hostileCreep.owner.username : "不明"}攻击，地点在${this.room.name}！已经停止该power爬虫孵化！`)
                    //     return
                    // }
                    if (!this.memory.tick) this.memory.tick = this.ticksToLive
                    if (this.hitsMax - 400 > this.hits) {
                        /*等待治疗*/
                        return;
                    }
                    var powerbank_ = missonPostion.GetStructure('powerBank')
                    if (powerbank_) {
                        this.attack(powerbank_)
                        if ((powerbank_.hits / 600) + 30 > this.ticksToLive) // 快没有生命了就增加爬虫数量，以方便继续采集
                        {
                            /* 填充完毕就这么干 */
                            if (globalMission.CreepBind['power-attack'].num == 2 && globalMission.CreepBind['power-attack'].num == globalMission.CreepBind['power-attack'].bind.length && globalMission.CreepBind['power-heal'].num == globalMission.CreepBind['power-heal'].bind.length) {
                                globalMission.CreepBind['power-attack'].num = 1
                                globalMission.CreepBind['power-heal'].num = 1
                                if (globalMission.CreepBind['power-attack'].bind.length < 2) return
                            }
                            else {
                                if (this.ticksToLive < (1500 - this.memory.tick + 200)) {
                                    globalMission.CreepBind['power-attack'].num = 2
                                    globalMission.CreepBind['power-heal'].num = 2
                                }
                            }
                            /* 新增一层逻辑判断 */
                            if (this.ticksToLive < 40) {
                                globalMission.CreepBind['power-attack'].num = 1
                                globalMission.CreepBind['power-heal'].num = 1
                            }
                        }
                        var enemy_creep = powerbank_.pos.findInRange(FIND_HOSTILE_CREEPS, 2)
                        if (enemy_creep.length == 0 && powerbank_.hits < 280000) {
                            globalMission.Data.state = 2
                        }
                        else if (enemy_creep.length > 0 && powerbank_.hits < 550000) {
                            globalMission.Data.state = 2
                        }
                    } else {
                        /* 说明过期了，删除任务，自杀 */
                        for (var ii in globalMission.CreepBind)
                            for (var jj of globalMission.CreepBind[ii].bind)
                                Game.creeps[jj].suicide()
                        Game.rooms[this.memory.belong].DeleteMission(globalMission.id)
                    }
                }
            }
            else {
                if (!this.pos.isNearTo(missonPostion)) {
                    this.goTo(missonPostion, 1)
                    return
                }
                /* 没有powerbank说明已经打掉了 */
                var powerbank_ = missonPostion.GetStructure('powerBank')
                if (!powerbank_) this.suicide()
                else this.attack(powerbank_)
            }
        }
        else if (role == 'power-heal') {
            if (!this.memory.double) {
                return
            }
            if (Game.creeps[this.memory.double]) {
                if (this.hits < this.hitsMax) {
                    this.heal(this)
                }
                if (this.pos.isNearTo(Game.creeps[this.memory.double])) {
                    this.memory.standed = true
                    if (!this.pos.inRangeTo(missonPostion, 2)) {
                        this.memory.standed = false
                        if (this.room.name == this.memory.belong)
                            this.moveTo(Game.creeps[this.memory.double].pos, {
                                ignoreRoads: true,
                                maxOps: 200,
                                maxRooms: 1
                            })
                        else
                            this.moveTo(Game.creeps[this.memory.double].pos, {
                                ignoreRoads: true,
                                maxOps: 1000,
                                maxRooms: 4
                            })
                    }
                    if (Game.creeps[this.memory.double].hits < Game.creeps[this.memory.double].hitsMax) {
                        this.heal(Game.creeps[this.memory.double])
                        return;
                    }
                } else {
                    this.goTo(Game.creeps[this.memory.double].pos, 1)
                }
            } else {
                // if (this.room.name == this.memory.belong) {
                //     var powerbank_ = missonPostion.GetStructure('powerBank')
                //     if (!powerbank_) this.suicide()
                //     if (this.hits < this.hitsMax) {
                //         this.heal(this)
                //         return
                //     }
                // }
                this.suicide()
            }
        }
        else if (role == 'power-carry') {
            if (this.fatigue > 0) return;
            this.workstate('power')
            if (!this.memory.working) {
                if (!this.pos.inRangeTo(missonPostion, 5)) {
                    this.goTo(missonPostion, 5)
                }
                else {
                    /* 寻找powerbank */
                    var powerbank_ = missonPostion.GetStructure('powerBank')
                    if (powerbank_) {
                        this.goTo(missonPostion, 4)
                        if (!this.memory.standed) this.memory.standed = true
                    }
                    else {
                        /* 寻找掉落资源 */
                        /* 优先寻找ruin */
                        var ruins = missonPostion.lookFor(LOOK_RUINS)
                        if (ruins.length > 0 && ruins[0].store.getUsedCapacity('power') > 0) {
                            if (this.memory.standed) this.memory.standed = false
                            if (!this.pos.isNearTo(ruins[0])) this.goTo(ruins[0].pos, 1)
                            else this.withdraw(ruins[0], 'power')
                            return
                        }
                        var drop_power = missonPostion.lookFor(LOOK_RESOURCES)
                        if (drop_power.length > 0) {
                            for (var i of drop_power) {
                                if (i.resourceType == 'power') {
                                    if (this.memory.standed) this.memory.standed = true
                                    if (!this.pos.isNearTo(i)) this.goTo(i.pos, 1)
                                    else this.pickup(i)
                                    return
                                }
                            }
                        }
                        /* 说明没有资源了 */
                        if (this.store.getUsedCapacity('power') > 0) this.memory.working = true
                        if (ruins.length <= 0 && drop_power.length <= 0 && this.store.getUsedCapacity('power') <= 0) {
                            globalMission.CreepBind['power-carry'].num = 0
                            this.suicide()
                        }
                    }
                }
            }
            else {
                var storage_ = Game.rooms[this.memory.belong].storage as StructureStorage
                if (!storage_) return
                if (!this.pos.isNearTo(storage_)) this.goTo(storage_.pos, 1)
                else {
                    this.transfer(storage_, 'power')
                    this.suicide()
                }
            }
        }
    }

    /* deposit采集任务处理 */
    public handle_deposit(): void {
        if (!this.memory.notifyWhenAttacked) {
            this.notifyWhenAttacked(false)
            this.memory.notifyWhenAttacked = true;
        }
        // if (!Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) { this.memory.MissionData = {}; return }
        var creepMission = this.memory.MissionData.Data
        if (!creepMission) return
        /* 判断是否正在遭受攻击 */
        if (this.hits < this.hitsMax / 2) {
            let hcreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
            Game.notify(`来自${this.memory.belong}的商品爬虫在房间${this.room.name}遭受攻击,攻击者疑似为${hcreep ? hcreep.owner.username : "不明生物"}`)
        }
        let myroom = Game.rooms[this.memory.belong];
        if (this.memory.role == 'deposit-transfer') {
            if (creepMission.creeptime) {
                if (this.ticksToLive <= creepMission.creeptime * 2 && !this.store.getUsedCapacity() && this.pos.roomName == this.memory.belong) { this.suicide(); return; }/*回传之后不够来回的直接操作自杀*/
                if (this.ticksToLive <= creepMission.creeptime || this.store.getFreeCapacity() < 1)//回家放资源
                {
                    this.transfer_(myroom.storage ? myroom.storage : myroom.terminal, Object.keys(this.store)[0] as ResourceConstant);
                    return;
                }
            }
        }
        var missonPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
        if (!missonPostion) { this.say("找不到目标地点！"); return }
        switch (this.memory.role) {
            case 'deposit-harvest':
                if (!this.memory.standed) this.memory.standed = true;
                /*这里对transfer进行绑定操作*/
                if (this.pos.roomName != creepMission.room) {
                    this.goTo(missonPostion, 4)
                    return;
                }
                if (this.pos.roomName == creepMission.room) {
                    if (Game.time % 10 == 0) {
                        if (!this.memory.transfercreep) {
                            var transfercreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                                filter: (creep) => {
                                    return creep.memory.role == 'deposit-transfer'
                                }
                            })
                            if (transfercreep) {
                                this.memory.transfercreep = transfercreep.name;/*进行搬运工赋值操作*/
                            }
                        }
                        if (!Game.creeps[this.memory.transfercreep]) {
                            delete this.memory.transfercreep;
                        } else {
                            if (Game.creeps[this.memory.transfercreep].pos.roomName != creepMission.room) {
                                delete this.memory.transfercreep;
                            }
                        }

                        /*地上捡垃圾*/
                        var deposit_ = Game.getObjectById(creepMission.deposit_id) as Deposit
                        let targets = this.pos.findInRange(FIND_TOMBSTONES, 2, { filter: function (object) { return object.store.getUsedCapacity(deposit_.depositType); } });
                        if (targets.length > 0) {
                            if (this.withdraw(targets[0], deposit_.depositType) == ERR_NOT_IN_RANGE) {
                                this.goTo(targets[0].pos, 1);
                            }
                        }
                    }
                }
                if (!Game.creeps[this.memory.transfercreep]) {
                    delete this.memory.transfercreep;
                }
                let User_number = this.store.getUsedCapacity();
                let Free_number = this.store.getFreeCapacity()
                /*检查是否容量已经超过200或者一半*/
                if ((User_number >= 200 || User_number >= Free_number) && this.memory.transfercreep) {
                    if (Game.creeps[this.memory.transfercreep].pos.roomName == this.pos.roomName) {
                        /*这里执行搬运操作*/
                        if (Game.creeps[this.memory.transfercreep].store.getFreeCapacity() > 0) {
                            /*检查是否达到回归时效*/
                            var T_creepMission = Game.creeps[this.memory.transfercreep].memory.MissionData.Data;
                            if (Game.creeps[this.memory.transfercreep].ticksToLive <= T_creepMission.creeptime) return;
                            if (!this.pos.isNearTo(Game.creeps[this.memory.transfercreep])) {
                                Game.creeps[this.memory.transfercreep].goTo(this.pos, 1, 100)
                                return;
                            }
                            this.transfer(Game.creeps[this.memory.transfercreep], Object.keys(this.store)[0] as ResourceConstant)
                            return;
                        }
                    }
                }
                if (Free_number < 1) return;
                if (!deposit_) {
                    var deposit_ = Game.getObjectById(creepMission.deposit_id) as Deposit
                }
                if (deposit_) {
                    if (!this.pos.isNearTo(missonPostion)) {
                        var harvest_void: RoomPosition[] = missonPostion.getSourceVoid()
                        var active_void: RoomPosition[] = []
                        for (var v of harvest_void) {
                            var creep_ = v.lookFor(LOOK_CREEPS)
                            if (creep_.length <= 0) active_void.push(v)

                        }
                        if (active_void.length > 0) {
                            this.goTo(missonPostion, 1, 200)
                        } else {
                            this.goTo(missonPostion, 3, 200)
                        }
                    }
                    if (!deposit_.cooldown && Free_number > 0) {
                        let harvest_state = this.harvest(deposit_)
                        this.memory.arrive = 1;
                        switch (harvest_state) {
                            case OK:
                                if (!this.memory.tick) this.memory.tick = this.ticksToLive
                                break;
                            case ERR_NOT_IN_RANGE:
                                this.goTo(missonPostion, 1)
                                break;
                        }
                    }
                } else {
                    Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                    return
                }

                break;
            case 'deposit-transfer':
                if (!this.memory.standed) this.memory.standed = true;
                creepMission.creeptimebool = false;//停止计时

                if (this.pos.roomName == creepMission.room) {
                    if (Game.time % 10 == 0) {
                        /*地上捡垃圾*/
                        var deposit_ = Game.getObjectById(creepMission.deposit_id) as Deposit
                        if (this.pos.isNearTo(deposit_)) {
                            this.Flee(deposit_.pos, 2)
                        }
                        if (!this.memory.Missionstate && deposit_?.lastCooldown > 110) {
                            Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                            this.memory.Missionstate = true;
                        }
                        let targets = this.pos.findInRange(FIND_TOMBSTONES, 3, { filter: function (object) { return object.store.getUsedCapacity(deposit_.depositType); } });
                        if (targets.length > 0) {
                            if (this.withdraw(targets[0], deposit_.depositType) == ERR_NOT_IN_RANGE) {
                                this.goTo(targets[0].pos, 1);
                                return;
                            }
                        }
                    }
                    if (!this.pos.inRangeTo(missonPostion, 2)) {
                        this.goTo(missonPostion, 2, 100)
                    } else {
                        if (!creepMission.creeptime) {
                            /*标记爬的距离信息*/
                            creepMission.creeptime = 1500 - this.ticksToLive + 50;
                        }
                    }
                } else {
                    this.goTo(missonPostion, 2)
                }
                break;
            default:
                this.workstate(creepMission.rType)
                if (this.memory.working) {
                    var storage_ = Game.rooms[this.memory.belong].storage as StructureStorage
                    if (!storage_) return
                    if (!this.pos.isNearTo(storage_)) this.goTo(storage_.pos, 1)
                    else {
                        this.transfer(storage_, creepMission.rType)
                        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                        this.suicide()
                    }
                }
                else {
                    var missonPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
                    if (!missonPostion) { this.say("找不到目标地点！"); return }
                    if (!this.pos.isNearTo(missonPostion)) {
                        if (!Game.rooms[missonPostion.roomName]) {
                            this.goTo(missonPostion, 1)
                            return
                        }
                        var harvest_void: RoomPosition[] = missonPostion.getSourceVoid()
                        var active_void: RoomPosition[] = []
                        for (var v of harvest_void) {
                            var creep_ = v.lookFor(LOOK_CREEPS)
                            if (creep_.length <= 0) active_void.push(v)
                        }
                        if (active_void.length > 0) {
                            this.goTo(missonPostion, 1)
                        }
                        else {
                            if (!missonPostion.inRangeTo(this.pos.x, this.pos.y, 3))
                                this.goTo(missonPostion, 3)
                        }
                    }
                    else {
                        if (!this.memory.tick) this.memory.tick = this.ticksToLive
                        if (this.ticksToLive < (1500 - (this.memory.tick ? this.memory.tick : 1000) + 70) && this.store.getUsedCapacity(creepMission.rType) > 0) {
                            this.memory.working = true
                        }
                        /* 开始采集 */
                        var deposit_ = missonPostion.lookFor(LOOK_DEPOSITS)[0] as Deposit
                        if (deposit_) {
                            if (!deposit_.cooldown) {
                                this.harvest(deposit_)
                            }
                        }
                        else {
                            Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                            return
                        }
                    }
                }
                break;
        }
    }

}