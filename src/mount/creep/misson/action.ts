import structure from "@/mount/structure"
import { filter_structure, GenerateAbility, generateID, isInArray, unzipPosition, zipPosition } from "@/utils"
import { filter } from "lodash"

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissonActionExtension extends Creep {
    // 刷墙
    public handle_repair(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let belongRoom = Game.rooms[this.memory.belong];
        let mission = belongRoom.GainMission(id)
        if (!id) return
        let storage_ = belongRoom.storage as StructureStorage
        this.workstate('energy')
        /* boost检查 */
        // var a = Game.cpu.getUsed();
        if (mission.LabBind && !this.memory.boostState) {
            // if (!storage_) return   // 如果是boost的，没有仓库就不刷了
            // console.log('检查boost',this.name)
            // 需要boost检查，必要情况下可以不检查
            let boo = false
            for (var ids in mission.LabBind) {
                var lab_ = Game.getObjectById(ids as Id<StructureLab>) as StructureLab
                if (!lab_ || !lab_.mineralType || lab_.store.getUsedCapacity(lab_.mineralType) < 500)
                    boo = true
            }
            if (!boo) {
                switch (missionData.Data.level) {
                    case 'T1':
                    case 'T3':
                        if (!this.BoostCheck(['work', 'move', 'carry'])) return
                        break;
                    default:
                        if (!this.BoostCheck(['work'])) return
                        break;
                }
            }
        }
        if (belongRoom && belongRoom.memory.state == 'war') {
            if (this.hitsMax - this.hits > 500) this.optTower('heal', this)
        }
        if (this.memory.working) {
            switch (mission.Data.RepairType) {
                case 'global':
                case 'globalrampart':
                case 'globalwall':
                    if (this.memory.targetID) {
                        this.say("🛠️")
                        var target_ = Game.getObjectById(this.memory.targetID as Id<StructureRampart>) as StructureRampart
                        if (!target_) { delete this.memory.targetID; return }
                        this.repair_(target_)
                        if (this.room.memory.state == 'war') {
                            let hostileCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                                filter: (creep) => {
                                    return creep.getActiveBodyparts('ranged_attack') > 0
                                }
                            })
                            if (hostileCreep.length > 0) this.Flee(hostileCreep[0].pos, 4)
                        }
                    }
                    else {
                        if (this.room.memory.state == 'peace') {
                            var construction = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
                            if (construction) {
                                this.build_(construction)
                                return;
                            }
                        }
                        let _getListHitsleast = [STRUCTURE_RAMPART, STRUCTURE_WALL];
                        switch (mission.Data.RepairType) {
                            case 'globalrampart':
                                _getListHitsleast = [STRUCTURE_RAMPART];
                                break;
                            case 'globalwall':
                                _getListHitsleast = [STRUCTURE_WALL];
                                break;
                        }
                        var leastRam = this.room.getListHitsleast(_getListHitsleast, 3)
                        if (!leastRam) return
                        if (mission.Data.maxhit) {
                            /*检查是否已经完成所有的刷墙任务*/
                            if (leastRam.hits > mission.Data.maxhit) {
                                /*检测任务已经完成后将会标记新生成爬数量为0 同时保持任务，等待任务检测进程*/
                                mission.CreepBind.repair.num = 0;
                                mission.Data.hangstate = true;
                            }
                        }
                        this.memory.targetID = leastRam.id
                    }
                    if (this.memory.containerID) { delete this.memory.containerID }
                    break;
                case 'nuker':
                    // 核弹防御
                    /* 防核函数  测试成功！*/
                    if (!belongRoom.memory.nukeData) return
                    if (Object.keys(belongRoom.memory.nukeData.damage).length <= 0) {
                        belongRoom.DeleteMission(id)
                        return
                    }
                    /* 优先修spawn和terminal */
                    if (!this.memory.targetID) {
                        for (var dmgPoint in belongRoom.memory.nukeData.damage) {
                            if (belongRoom.memory.nukeData.damage[dmgPoint] <= 0) continue
                            var position_ = unzipPosition(dmgPoint)
                            if (!position_.GetStructure('rampart')) {
                                position_.createConstructionSite('rampart')
                                if (!this.memory.working) this.withdraw_(storage_, 'energy')
                                else this.build_(position_.lookFor(LOOK_CONSTRUCTION_SITES)[0])
                                return
                            }
                            this.memory.targetID = position_.GetStructure('rampart').id
                            return
                        }
                        if (!belongRoom.DeleteMission(id)) this.memory.MissionData = {}
                        return
                    }
                    else {
                        this.memory.standed = false
                        if (this.memory.crossLevel > 10) this.memory.crossLevel = 10 - Math.ceil(Math.random() * 10)
                        var wall_ = Game.getObjectById(this.memory.targetID as Id<StructureRampart>) as StructureRampart
                        var strPos = zipPosition(wall_.pos)
                        if (!wall_ || wall_.hits >= belongRoom.memory.nukeData.damage[strPos] + belongRoom.memory.nukeData.rampart[strPos] + 500000) {
                            delete this.memory.targetID
                            belongRoom.memory.nukeData.damage[strPos] = 0
                            belongRoom.memory.nukeData.rampart[strPos] = 0
                            return
                        }
                        this.repair_(wall_)
                        let hostileCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                            filter: (creep) => {
                                return creep.getActiveBodyparts('ranged_attack') > 0
                            }
                        })
                        if (hostileCreep.length > 0) this.Flee(hostileCreep[0].pos, 4)
                    }
                    break;
                case 'special':
                    if (this.memory.targetID) {
                        this.say("🛠️")
                        var target_ = Game.getObjectById(this.memory.targetID as Id<StructureRampart>) as StructureRampart
                        if (!target_) { delete this.memory.targetID; return }
                        this.repair_(target_)
                        let hostileCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                            filter: (creep) => {
                                return creep.getActiveBodyparts('ranged_attack') > 0
                            }
                        })
                        if (hostileCreep.length > 0) this.Flee(hostileCreep[0].pos, 4)
                    }
                    else {
                        /* 寻找插了旗子的hits最小的墙 */
                        var flags = this.room.find(FIND_FLAGS, {
                            filter: (flag) => {
                                return flag.name.indexOf('repair') == 0
                            }
                        })
                        if (flags.length <= 0) return
                        let disWall = null
                        for (var f of flags) {
                            let fwall = f.pos.GetStructureList(['rampart', 'constructedWall'])[0]
                            if (!fwall) f.remove()
                            else {
                                if (!disWall || fwall.hits < disWall.hits) disWall = fwall
                            }
                        }
                        if (!disWall) {
                            // 没有旗子就删除任务
                            belongRoom.DeleteMission(id)
                            return
                        }
                        this.memory.targetID = disWall.id
                    }
                    delete this.memory.containerID
                    break;
            }
        } else {
            if (this.memory.targetID) delete this.memory.targetID
            if (this.room.terminal && this.room.terminal.store.getUsedCapacity('energy') >= 60000) {
                var tank_ = this.room.terminal as Structure;
            } else if (storage_ && storage_.store.getUsedCapacity('energy') >= this.store.getCapacity()) {
                var tank_ = storage_ as Structure;
            } else {
                if (!this.memory.containerID) {
                    if (this.room.terminal && this.room.controller.level < 8) {
                        this.memory.containerID = this.room.terminal.id
                    } else {
                        var tank = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                            filter: (stru) => {
                                return (
                                    stru.structureType == 'storage' || stru.structureType == 'terminal' ||
                                    (stru.structureType == 'link' && isInArray(belongRoom.memory.StructureIdData.comsume_link, stru.id))
                                ) && stru.store.getUsedCapacity('energy') > this.store.getCapacity()
                            }
                        })
                        if (tank) {
                            this.memory.containerID = tank.id
                        }
                        else {
                            let closestStore = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: (stru) => { return (stru.structureType == 'container' || stru.structureType == 'tower') && stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity() } })
                            if (closestStore) this.withdraw_(closestStore, 'energy')
                            return
                        }
                    }
                }
                var tank_ = Game.getObjectById(this.memory.containerID as Id<Structure>) as Structure
                if (!tank_) {
                    /*没有能量的获取途径*/
                    this.say("无法提取能量")
                    return;
                }
            }
            this.withdraw_(tank_, 'energy')
        }


    }




    // C计划
    public handle_planC(): void {
        let mission = this.memory.MissionData
        // if (Game.rooms[mission.Data.disRoom] && !Game.rooms[mission.Data.disRoom].controller.safeMode) Game.rooms[mission.Data.disRoom].controller.activateSafeMode()
        if (this.memory.role == 'cclaim') {
            if (this.room.name != mission.Data.disRoom || Game.shard.name != mission.Data.shard) {
                this.arriveTo(new RoomPosition(25, 25, mission.Data.disRoom), 20, mission.Data.shard)
                return
            }
            else {
                if (!this.pos.isNearTo(this.room.controller))
                    this.goTo(this.room.controller.pos, 1)
                else {
                    if (!this.room.controller.owner) this.claimController(this.room.controller)
                    this.signController(this.room.controller, 'better to rua BB cat at home!')
                }
            }
        }
        else {
            this.workstate('energy')
            if (this.room.name == this.memory.belong && !this.memory.working) {
                let store = this.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (stru) => {
                        return (stru.structureType == 'container' ||
                            stru.structureType == 'tower' ||
                            stru.structureType == 'storage') && stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity()
                    }
                })
                if (store) {
                    this.withdraw_(store, 'energy')
                }
                return
            }
            if (!Game.rooms[mission.Data.disRoom]) {
                this.goTo(new RoomPosition(25, 25, mission.Data.disRoom), 20)
                return
            }
            if (Game.rooms[mission.Data.disRoom].controller.level >= 2) {
                global.SpecialBodyData[this.memory.belong]['cupgrade'] = GenerateAbility(1, 1, 1, 0, 0, 0, 0, 0)
            }
            if (this.memory.working) {
                if (this.room.name != mission.Data.disRoom) {
                    this.goTo(Game.rooms[mission.Data.disRoom].controller.pos, 1)
                    return
                }
                let cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
                if (cons) this.build_(cons)
                else { this.upgrade_(); this.say("cupgrade") }
            }
            else {
                let source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
                if (source) this.harvest_(source)
            }
        }
    }

    // 扩张援建
    public handle_expand(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        if (this.getActiveBodyparts('heal') && this.hits < this.hitsMax) this.heal(this)
        if (this.room.name == this.memory.belong) {
            switch (this.memory.role) {
                case 'Ebuild':
                case 'Eupgrade':
                    switch (missionData.Data.level) {
                        case 'T3':
                            if (!this.BoostCheck(['work', 'move', 'carry'])) return
                            break;
                        default:
                            if (!this.BoostCheck(['work', 'move'])) return
                            break;

                    }
                    break;
            }
        }
        // pandaflower 修复 援建从旗帜房(应该是援建房隔壁的房间)采集资源 卡在门口横跳的问题
        // 再采集房插旗`${this.memory.belong}/HB/harvest`, 在援建房插旗 `${this.memory.belong}/expand`
        if (!this.memory.arrived || this.memory.working) {
            if (this.room.name != missionData.Data.disRoom || Game.shard.name != missionData.Data.shard) {
                this.arriveTo(new RoomPosition(24, 24, missionData.Data.disRoom), 10, missionData.Data.shard, missionData.Data.shardData ? missionData.Data.shardData : null)
                return
            }
        }
        // end
        if (this.room.name == missionData.Data.disRoom && Game.shard.name == missionData.Data.shard) {

        }
        if (!this.memory.arrived && Game.flags[`${this.memory.belong}/expand`] && Game.flags[`${this.memory.belong}/expand`].pos.roomName == this.room.name) {
            if (!this.pos.isEqualTo(Game.flags[`${this.memory.belong}/expand`])) this.goTo(Game.flags[`${this.memory.belong}/expand`].pos, 0)
            else this.memory.arrived = true
            return
        }
        if (this.room.memory.state == 'peace' && (this.room.controller.my && this.room.controller.level >= 5)) {
            if (this.hits < this.hitsMax) {
                this.optTower('heal', this, true)
            }
        }
        this.workstate('energy')
        if (this.memory.role == 'claim') {
            if (!this.pos.isNearTo(Game.rooms[missionData.Data.disRoom].controller))
                this.goTo(Game.rooms[missionData.Data.disRoom].controller.pos, 1)
            else {
                this.claimController(Game.rooms[missionData.Data.disRoom].controller)
                this.say("claim")
            }
            if (missionData.Data.shard == this.memory.shard) {
                if (Game.rooms[missionData.Data.disRoom].controller.level && Game.rooms[missionData.Data.disRoom].controller.owner) {
                    let mission = Game.rooms[this.memory.belong].GainMission(id)
                    if (!mission) return
                    mission.CreepBind[this.memory.role].num = 0
                }
            }
        }
        else if (this.memory.role == 'Ebuild') {
            if (this.memory.working) {
                if (this.room.controller.level < 8) {
                    let tower = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType == 'tower' && stru.store.getFreeCapacity('energy') > 800
                        }
                    })
                    if (tower) {
                        this.transfer_(tower, 'energy')
                        return
                    }
                }
                /* 优先遭建筑 */
                let cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
                if (cons) {
                    this.build_(cons)
                    return
                }
                if (this.room.controller.level < 6) {
                    let store = this.pos.getClosestStore()
                    if (store) {
                        this.transfer_(store, 'energy')
                        return
                    }
                }
                if (this.room.controller.level < 6) {
                    let roads = this.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (stru) => {
                            return ((stru.structureType == 'road' || stru.structureType == 'container') && stru.hits < stru.hitsMax * 0.8) ||
                                (stru.structureType == 'rampart' && stru.hits < 100000)
                        }
                    })
                    if (roads) {
                        this.repair_(roads)
                        return
                    }
                }
                if (this.room.controller.level > 6) {
                    if (this.memory.targetID) {
                        this.say("🛠️")
                        var target_ = Game.getObjectById(this.memory.targetID as Id<StructureRampart>) as StructureRampart
                        if (!target_) { delete this.memory.targetID; return }
                        if (target_.hits > 1000000) { delete this.memory.targetID; }
                        this.repair_(target_)
                        return
                    }
                    else {
                        var leastRam = this.room.getListHitsleast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3, 1000000)
                        if (leastRam) {
                            this.memory.targetID = leastRam.id
                        }

                    }
                }
                this.upgrade_()
            }
            else {
                delete this.memory.targetID;
                // 以withdraw开头的旗帜  例如： withdraw_0
                let withdrawFlag = this.room.find(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('withdraw') == 0
                    }
                })
                if (withdrawFlag.length > 0) {
                    let tank_ = withdrawFlag[0].pos.GetStructureList(['storage', 'terminal', 'container', 'tower'])
                    let ruin_ = withdrawFlag[0].pos.GetRuin()
                    // console.log(this.name, tank_.length)
                    if (tank_.length > 0) {
                        /*扫描周围如果有八个爬 默认为已经占满 执行2空格策略*/
                        let creeps = tank_[0].pos.findInRange(FIND_MY_CREEPS, 1)
                        if (creeps.length >= 8 && !this.pos.isNearTo(tank_[0])) {
                            if (this.pos.inRangeTo(tank_[0], 2)) {
                                /*寻找相临的爬*/
                                for (let i of creeps) {
                                    if (this.pos.isNearTo(i) && i.store.getUsedCapacity('energy') > 200) {
                                        i.transfer(this, 'energy')
                                        return;
                                    }
                                }

                            }
                            this.goTo(tank_[0].pos, 2);
                        } else {
                            this.withdraw_(tank_[0], 'energy');
                        }
                        return
                    } else if (ruin_ && ruin_.store['energy'] > 0) {
                        if (this.pos.isNearTo(ruin_)) {
                            this.withdraw(ruin_, 'energy');
                        } else {
                            this.goTo(ruin_.pos, 1);
                        }
                        return
                    }
                }
                if (this.room.storage && this.room.storage.my && this.room.terminal) {
                    if (this.room.storage.store.getUsedCapacity('energy') > this.store.getFreeCapacity('energy')) {
                        this.withdraw_(this.room.storage, 'energy'); return
                    }
                }
                let harvestFlag = Game.flags[`${this.memory.belong}/HB/harvest`]
                if (harvestFlag) {
                    if (this.hits < this.hitsMax) {
                        this.heal(this)
                    }
                    if (this.room.name != harvestFlag.pos.roomName) {
                        this.goTo(harvestFlag.pos, 1)
                    }
                    else {
                        let source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
                        if (source) { this.harvest_(source) }
                    }
                    return
                }
                let resources = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (res) => {
                        return res.amount > 200 && res.resourceType == 'energy'
                    }
                })
                if (resources) {
                    if (!this.pos.isNearTo(resources)) this.goTo(resources.pos, 1)
                    else this.pickup(resources)
                    return
                } else {
                    let tombstones = this.pos.findClosestByPath(FIND_TOMBSTONES, {
                        filter: (res) => {
                            return res.store.getUsedCapacity('energy') > 100
                        }
                    })
                    if (tombstones) {
                        if (!this.pos.isNearTo(tombstones)) this.goTo(tombstones.pos, 1)
                        else this.withdraw(tombstones, 'energy')
                        return
                    }
                }

                let source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
                if (source) {
                    this.harvest_(source)
                } else {
                    // let source = this.pos.findClosestByPath(FIND_SOURCES)
                    // if (!this.pos.isNearTo(source)) this.goTo(source.pos, 1)
                }
                // let tombstones = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES)
                // if (tombstones) {
                //     if (!this.pos.isNearTo(tombstones)) this.goTo(resources.pos, 1)
                //     else this.pickup(tombstones)
                //     return
                // }
                // if (this.ticksToLive < 120 && this.store.getUsedCapacity('energy') <= 20) this.suicide()
                if (this.store.getUsedCapacity('energy') / (this.ticksToLive + 50) > 10) this.memory.working = true
            }
        }
        else if (this.memory.role == 'Eupgrade') {
            if (this.memory.working) {
                // this.say("upgrade")
                this.upgrade_()
            }
            else {
                if (this.room.controller.level >= 8) {
                    if (missionData.Data.shard == this.memory.shard) {
                        let mission = Game.rooms[this.memory.belong].GainMission(id)
                        if (!mission) return
                        Game.rooms[this.memory.belong].DeleteMission(id)
                        return;
                    }
                }
                // 以withdraw开头的旗帜  例如： withdraw_0
                let withdrawFlag = this.room.find(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('withdraw') == 0
                    }
                })
                if (withdrawFlag.length > 0) {
                    let tank_ = withdrawFlag[0].pos.GetStructureList(['storage', 'terminal', 'container', 'tower'])
                    let ruin_ = withdrawFlag[0].pos.GetRuin()
                    // console.log(this.name, tank_.length)
                    if (tank_.length > 0) {
                        /*扫描周围如果有八个爬 默认为已经占满 执行2空格策略*/
                        let creeps = tank_[0].pos.findInRange(FIND_MY_CREEPS, 1)
                        if (creeps.length >= 8 && !this.pos.isNearTo(tank_[0])) {
                            if (this.pos.inRangeTo(tank_[0], 2)) {
                                /*寻找相临的爬*/
                                for (let i of creeps) {
                                    if (this.pos.isNearTo(i) && i.store.getUsedCapacity('energy') > 200) {
                                        i.transfer(this, 'energy')
                                        return;
                                    }
                                }

                            }
                            this.goTo(tank_[0].pos, 2);
                        } else {
                            this.withdraw_(tank_[0], 'energy');
                        }
                        return
                    } else if (ruin_ && ruin_.store['energy'] > 0) {
                        if (this.pos.isNearTo(ruin_)) {
                            this.withdraw(ruin_, 'energy');
                        } else {
                            this.goTo(ruin_.pos, 1);
                        }
                        return
                    }
                }
                if (this.room.storage && this.room.storage.my && this.room.terminal) {
                    if (this.room.storage.store.getUsedCapacity('energy') > this.store.getFreeCapacity('energy')) {
                        this.withdraw_(this.room.storage, 'energy'); return
                    }
                }
                let harvestFlag = Game.flags[`${this.memory.belong}/HB/harvest`]
                if (harvestFlag) {
                    if (this.hits < this.hitsMax) {
                        this.heal(this)
                    }
                    if (this.room.name != harvestFlag.pos.roomName) {
                        this.goTo(harvestFlag.pos, 1)
                    }
                    else {
                        let source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
                        if (source) { this.harvest_(source) }
                    }
                    return
                }
                let resources = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (res) => {
                        return res.amount > 200 && res.resourceType == 'energy'
                    }
                })
                if (resources) {
                    if (!this.pos.isNearTo(resources)) this.goTo(resources.pos, 1)
                    else this.pickup(resources)
                    return
                }
                let source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
                if (source) this.harvest_(source)
                // if (this.ticksToLive < 120 && this.store.getUsedCapacity('energy') <= 20) this.suicide()
                if (this.store.getUsedCapacity('energy') / (this.ticksToLive + 50) > 10) this.memory.working = true
            }
        }
    }

    // 急速冲级
    public handle_quickRush(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let mission = Game.rooms[this.memory.belong].GainMission(id)
        if (!mission) return
        // boost检查
        if (mission.LabBind && !this.BoostCheck(['work'])) return
        this.workstate('energy')
        var terminal_ = this.room.terminal as StructureTerminal
        if (!terminal_) { this.say("找不到terminal!"); return }
        if (this.memory.working) {
            this.upgrade_()
            if (this.store.getUsedCapacity('energy') < 35 && terminal_.pos.isNearTo(this))
                this.withdraw_(terminal_, 'energy')
        }
        else {
            this.withdraw_(terminal_, 'energy')
        }
        this.memory.standed = mission.Data.standed
    }

    // 普通冲级
    public handle_normalRush(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let mission = Game.rooms[this.memory.belong].GainMission(id)
        if (!mission) return
        var link_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.StructureIdData.upgrade_link) as StructureLink
        if (!link_) { this.say("找不到冲级link!"); return }
        // boost检查
        if (mission.LabBind && !this.BoostCheck(['work'])) return
        this.workstate('energy')
        if (this.memory.working) {
            this.upgrade_()
            if (this.store.getUsedCapacity('energy') < 35 && link_.pos.isNearTo(this))
                this.withdraw_(link_, 'energy')
        }
        else {
            this.withdraw_(link_, 'energy')
        }
    }

    // 紧急援建
    public handle_helpBuild(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        if (this.room.name == this.memory.belong && Game.shard.name == this.memory.shard) {
            if (!this.BoostCheck(['move', 'work', 'heal', 'tough', 'carry'])) return
            if (this.store.getUsedCapacity('energy') <= 0) {
                let stroge_ = this.room.storage as StructureStorage
                if (stroge_) {
                    this.withdraw_(stroge_, 'energy')
                    return
                }
            }
        }
        if ((this.room.name != data.disRoom || Game.shard.name != data.shard) && !this.memory.swith) {
            if (this.hits < this.hitsMax) {
                this.heal(this)
            }
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
        }
        else {

            this.memory.swith = true
            let runFlag = this.pos.findClosestByRange(FIND_FLAGS, {
                filter: (flag) => {
                    return flag.color == COLOR_BLUE
                }
            })
            if (runFlag) {
                this.goTo(runFlag.pos, 0)
                return
            }
            this.workstate('energy')
            if (this.memory.working) {
                if (this.room.name != data.disRoom) { this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard); return }
                if (this.hits < this.hitsMax) {
                    this.heal(this)
                }
                if (Game.flags[`${this.memory.belong}/first_build`]) {
                    let fcon = Game.flags[`${this.memory.belong}/first_build`].pos.lookFor(LOOK_CONSTRUCTION_SITES)
                    if (fcon.length > 0) {
                        this.build_(fcon[0])
                    }
                    else {
                        Game.flags[`${this.memory.belong}/first_build`].remove()
                    }
                    return
                }
                let cons = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
                if (cons) { this.build_(cons); return }
                let store = this.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (stru) => {
                        return (stru.structureType == 'extension' || stru.structureType == 'spawn') && stru.store.getFreeCapacity('energy') > 0
                    }
                })
                if (store) {
                    this.transfer_(store, 'energy')
                    return
                }
                let tower = this.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'tower' && stru.store.getFreeCapacity('energy') > 0
                    }
                })
                if (tower) {
                    this.transfer_(tower, 'energy')
                    return
                }

                let _storage = this.room.storage;
                if (_storage) {
                    this.transfer_(_storage, 'energy')
                    return
                }
            }
            else {
                if (this.store.getUsedCapacity('energy') / (this.ticksToLive + 50) > 10) this.memory.working = true
                // 以withdraw开头的旗帜  例如： withdraw_0
                let withdrawFlag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('withdraw') == 0
                    }
                })
                if (withdrawFlag) {
                    let tank_ = withdrawFlag.pos.GetStructureList(['storage', 'terminal', 'container', 'tower'])
                    if (tank_.length > 0) { this.withdraw_(tank_[0], 'energy'); return }
                }
                let harvestFlag = Game.flags[`${this.memory.belong}/HB/harvest`]
                if (harvestFlag) {
                    if (this.hits < this.hitsMax) {
                        this.heal(this)
                    }
                    if (this.room.name != harvestFlag.pos.roomName) {
                        this.goTo(harvestFlag.pos, 1)
                    }
                    else {
                        let source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
                        if (source) { this.harvest_(source) }
                    }
                    return
                }
                if ((this.room.name == data.disRoom && Game.shard.name == data.shard) && !this.room.controller?.my) {
                    if (!this.room.controller?.safeMode) this.suicide();
                }
                let resources = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (res) => {
                        return res.amount > 200 && res.resourceType == 'energy'
                    }
                })
                if (resources) {
                    if (!this.pos.isNearTo(resources)) this.goTo(resources.pos, 1)
                    else this.pickup(resources)
                    return
                }

                let source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
                if (source) {
                    this.harvest_(source)
                } else {
                    this.workstate('energy', 0.3)
                }
            }
        }
    }
    /*紧急升级*/
    public handle_helpUpgrade(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        if (this.room.name == this.memory.belong && Game.shard.name == this.memory.shard) {
            if (!this.BoostCheck(['move', 'work', 'heal', 'tough', 'carry'])) return
            if (this.store.getUsedCapacity('energy') <= 0) {
                let stroge_ = this.room.storage as StructureStorage
                if (stroge_) {
                    this.withdraw_(stroge_, 'energy')
                    return
                }
            }
        }
        if ((this.room.name != data.disRoom || Game.shard.name != data.shard) && !this.memory.swith) {
            if (this.hits < this.hitsMax) {
                this.heal(this)
            }
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
        }
        else {
            this.memory.swith = true
            this.workstate('energy')
            if (this.memory.working) {
                if (this.hits < this.hitsMax) {
                    this.optTower('heal', this, true)
                }
                if (!this.pos.inRangeTo(this.room.controller, 3)) this.goTo(this.room.controller.pos, 3)
                this.upgrade_()
            }
            else {
                this.suicide();
            }
        }
    }

    /*紧急墙体*/
    public handle_helpRepair(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        let belongRoom = Game.rooms[this.memory.belong];
        if (!id) return
        this.workstate('energy')
        /* boost检查 */
        // var a = Game.cpu.getUsed();
        if (this.room.name == this.memory.belong && Game.shard.name == this.memory.shard) {
            switch (missionData.Data.level) {
                case 'T3':
                    if (!this.BoostCheck(['work', 'move', 'carry'])) return
                    break;
                default:
                    if (!this.BoostCheck(['work'])) return
                    break;
            }
            // if (!this.BoostCheck(['move', 'work', 'heal', 'tough', 'carry'])) return
            // if (this.store.getUsedCapacity('energy') <= 0) {
            //     let stroge_ = this.room.storage as StructureStorage
            //     if (stroge_) {
            //         this.withdraw_(stroge_, 'energy')
            //         return
            //     }
            // }
        }
        // if (mission.LabBind && !this.memory.boostState) {
        //     // if (!storage_) return   // 如果是boost的，没有仓库就不刷了
        //     // console.log('检查boost',this.name)
        //     // 需要boost检查，必要情况下可以不检查
        //     let boo = false
        //     for (var ids in mission.LabBind) {
        //         var lab_ = Game.getObjectById(ids as Id<StructureLab>) as StructureLab
        //         if (!lab_ || !lab_.mineralType || lab_.store.getUsedCapacity(lab_.mineralType) < 500)
        //             boo = true
        //     }
        //     if (!boo) {

        //     }
        // }
        if (belongRoom && belongRoom.memory.state == 'war') {
            if (this.hitsMax - this.hits > 500) this.optTower('heal', this)
        }
        if ((this.room.name != data.disRoom || Game.shard.name != data.shard)) {
            // if (this.hits < this.hitsMax) {
            //     this.heal(this)
            // }
            if (this.memory.targetID) delete this.memory.targetID
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
        }
        else {
            // this.memory.swith = true
            // console.log('工人信息', this.memory.working)
            if (this.memory.working) {
                if (this.hits < this.hitsMax) {
                    this.optTower('heal', this, true)
                }
                if (this.memory.targetID) {
                    this.say("🛠️")
                    var target_ = Game.getObjectById(this.memory.targetID as Id<StructureRampart>) as StructureRampart
                    if (!target_) { delete this.memory.targetID; return }
                    this.repair_(target_, 400)
                    if (this.room.memory.state == 'war') {
                        let hostileCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                            filter: (creep) => {
                                return creep.getActiveBodyparts('ranged_attack') > 0
                            }
                        })
                        if (hostileCreep.length > 0) this.Flee(hostileCreep[0].pos, 4)
                    }
                }
                else {
                    if (this.room.memory.state == 'peace') {
                        var construction = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
                        if (construction) {
                            this.build_(construction)
                            return;
                        }
                    }
                    var leastRam = this.room.getListHitsleast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
                    if (!leastRam) return
                    this.memory.targetID = leastRam.id
                }
                if (this.memory.containerID) {
                    delete this.memory.containerID
                }
            }
            else {
                /* 寻找hits最小的墙 */
                // var leastRam = this.room.getListHitsleast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
                // if (!leastRam) return
                if (!Game.rooms[data.disRoom]) console.log('错误的房间信息')
                if (this.memory.targetID) delete this.memory.targetID
                if (Game.rooms[data.disRoom].terminal && Game.rooms[data.disRoom].terminal.store.getUsedCapacity('energy') >= 60000) {
                    var tank_ = Game.rooms[data.disRoom].terminal as Structure;
                } else if (Game.rooms[data.disRoom].storage && Game.rooms[data.disRoom].storage.store.getUsedCapacity('energy') >= this.store.getCapacity()) {
                    var tank_ = Game.rooms[data.disRoom].storage as Structure;
                }
                // console.log('取货目标',tank_.id)
                this.withdraw_(tank_, 'energy')
            }
        }

        // var b = Game.cpu.getUsed();
        // console.log(this.name, '刷墙', this.memory.working, b - a)
    }


    // 房间签名
    public handle_sign(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        if (this.room.name != data.disRoom || Game.shard.name != data.shard) {
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
        }
        else {
            let control = this.room.controller
            if (control) {
                if (!this.pos.isNearTo(control)) this.goTo(control.pos, 1)
                else { this.signController(control, data.str) }
                if (control.sign == data.str) {
                    Game.rooms[this.memory.belong].DeleteMission(id)
                }
            }
        }
    }

    /* 原矿开采任务处理 */
    public handle_mineral(): void {
        var extractor = Game.getObjectById(Game.rooms[this.memory.belong].memory.StructureIdData.extractID) as StructureExtractor
        if (!extractor) return
        var container: StructureContainer
        if (!this.memory.containerID) {
            var con = extractor.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: (stru) => {
                    return stru.structureType == 'container'
                }
            }) as StructureContainer[]
            if (con.length > 0) this.memory.containerID = con[0].id
            return
        }
        else {
            container = Game.getObjectById(this.memory.containerID as Id<StructureContainer>) as StructureContainer
            if (!container) return
            /* container杂志清理 */
            if (container.store && container.store.getUsedCapacity() > 0) {
                if (this.pos.isEqualTo(container)) {
                    for (var i in container.store) {
                        this.withdraw(container, i as ResourceConstant)
                    }
                }
            }
            let getFreeCapacity = this.store.getFreeCapacity();
            let getCapacity = this.store.getCapacity();
            if (!this.memory.working) this.memory.working = false
            if (this.memory.working && getFreeCapacity == getCapacity) {
                this.memory.working = false
            } else if (!this.memory.working && getFreeCapacity == 0) {
                this.memory.working = true
            }
            if (this.memory.working) {
                var storage_ = Game.rooms[this.memory.belong].storage as StructureStorage
                if (!storage_) return
                if (!this.pos.isNearTo(storage_)) this.goTo(storage_.pos, 1)
                else {
                    for (var i in this.store) {
                        this.transfer(storage_, i as ResourceConstant)
                        return
                    }
                }
            }
            else {
                if (!this.pos.isEqualTo(container.pos)) { this.goTo(container.pos, 0); return }
                else {
                    var mineral = Game.getObjectById(Game.rooms[this.memory.belong].memory.StructureIdData.mineralID) as Mineral
                    if (!extractor.cooldown) {
                        this.harvest(mineral)
                        return;
                    }
                    if (this.ticksToLive < 15) this.suicide()
                    if (!mineral.mineralAmount) {
                        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                        this.suicide()
                        return
                    }
                }
            }
        }
    }
}