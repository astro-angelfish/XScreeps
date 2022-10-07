import { isInArray, unzipPosition, zipPosition } from "@/utils";

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissonMineExtension extends Creep {
    /* 外矿开采处理 */
    public handle_outmine(): void {
        var creepMisson = this.memory.MissionData.Data
        var globalMisson = Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)
        if (!globalMisson) { this.say("找不到全局任务了！"); this.memory.MissionData = {}; return }
        if (this.hits < this.hitsMax && globalMisson.Data.state == 2) {
            var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.owner.username)
                }
            })
            if (enemy) globalMisson.Data.state = 3
        }
        if (this.memory.role == 'out-claim') {
            if (this.room.name != creepMisson.disRoom && !this.memory.disPos) {
                this.goTo(new RoomPosition(25, 25, creepMisson.disRoom), 20, null, 2)
                if (this.room.name != this.memory.belong) {
                    /* 如果是别人的房间就不考虑 */
                    if (this.room.controller && this.room.controller.owner && this.room.controller.owner.username != this.owner.username)
                        return
                    if (Memory.outMineData && Memory.outMineData[this.room.name]) {
                        for (var i of Memory.outMineData[this.room.name].road) {
                            var thisPos = unzipPosition(i)
                            if (thisPos.roomName == this.name && !thisPos.GetStructure('road')) {
                                thisPos.createConstructionSite('road')
                            }
                        }
                    }
                }
            }
            if (!this.memory.disPos && this.room.name == creepMisson.disRoom) {
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
                        globalMisson.Data.state = 3
                }
                if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd && this.room.controller.reservation.username != this.owner.username) {
                    globalMisson.Data.state = 3
                }
                if (!this.pos.isNearTo(this.room.controller)) {
                    var controllerPos = unzipPosition(this.memory.disPos)
                    if (controllerPos.roomName == this.room.name)
                        this.goTo(controllerPos, 1, 5000)
                    else this.goTo(controllerPos, 1, 8000)
                }
                else {
                    if (this.room.controller && (!this.room.controller.sign || (Game.time - this.room.controller.sign.time) > 100000)) {
                        if (["somygame"].includes(this.owner.username)) {
                            this.signController(this.room.controller, `麻了，麻了，彻底麻了`)
                        } else if (["Morningtea"].includes(this.owner.username)) {
                            this.signController(this.room.controller, ``)
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
                    if (Game.time % 91 == 0) {
                        if (Memory.outMineData && Memory.outMineData[this.room.name]) {
                            for (var i of Memory.outMineData[this.room.name].road) {
                                var thisPos = unzipPosition(i) as RoomPosition

                                if (thisPos.roomName == this.room.name && !thisPos.GetStructure('road')) {
                                    thisPos.createConstructionSite('road')
                                }
                            }
                        }
                    }
                }
                if (this.room.controller.reservation)
                    this.memory.num = this.room.controller.reservation.ticksToEnd
            }
        }
        else if (this.memory.role == 'out-harvest') {
            if (!Game.rooms[creepMisson.disRoom]) return
            if (!Memory.outMineData[creepMisson.disRoom] || Memory.outMineData[creepMisson.disRoom].minepoint.length <= 0) return
            for (var point of Memory.outMineData[creepMisson.disRoom].minepoint) {
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
            if (this.memory.working) {
                var container_ = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (stru) => { return stru.structureType == 'container' } }) as StructureContainer[]
                if (container_[0]) {
                    if (!this.pos.isEqualTo(container_[0].pos)) this.goTo(container_[0].pos, 0)
                    else {
                        if (container_[0].hits < container_[0].hitsMax) {
                            this.repair(container_[0])
                            return
                        }
                        this.transfer(container_[0], 'energy')
                    }
                    Memory.outMineData[creepMisson.disRoom].car = true
                }
                else {
                    Memory.outMineData[creepMisson.disRoom].car = false
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
                    this.goTo(disPos, 1)
                }
                else this.harvest(source)
            }

        }
        else if (this.memory.role == 'out-car') {
            if (!Game.rooms[creepMisson.disRoom]) return
            this.workstate('energy')
            if (!Memory.outMineData[creepMisson.disRoom] || Memory.outMineData[creepMisson.disRoom].minepoint.length <= 0) return
            for (var point of Memory.outMineData[creepMisson.disRoom].minepoint) {
                if (!point.bind.car && !this.memory.bindpoint) {
                    point.bind.car = this.name
                    this.memory.bindpoint = point.pos
                }
            }
            if (!this.memory.bindpoint) return
            var disPos = unzipPosition(this.memory.bindpoint)
            if (Game.time % 91 == 0 && this.room.name != this.memory.belong && this.room.name != disPos.roomName) {
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

            if (this.memory.working) {
                var stroage_ = Game.rooms[this.memory.belong].storage
                if (!stroage_) return
                if (!this.pos.isNearTo(stroage_)) {
                    if (this.getActiveBodyparts(WORK) > 0) {
                        var construsions = this.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
                            filter: (constr) => {
                                return constr.structureType == 'road'
                            }
                        })
                        // console.log(this.name, '标记1')
                        if (construsions) {
                            this.build_(construsions)
                            return
                        }
                        // console.log(this.name, '标记2')
                        if (this.room.name != this.memory.belong) {/*只修理外矿*/
                            var road_ = this.pos.GetStructure('road')
                            if (road_ && road_.hits < road_.hitsMax - 200 && this.ticksToLive > 100) {
                                this.repair(road_)
                                this.goTo(stroage_.pos, 1, null, 4);
                                return
                            }
                        }
                    }
                    // console.log(this.name, '标记3')
                    if (Memory.outMineData && Memory.outMineData[creepMisson.roomName]) {
                        this.goTo(stroage_.pos, 1, null, 4, Memory.outMineData[creepMisson.roomName].road)
                    } else {
                        this.goTo(stroage_.pos, 1, null, 4)
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
                if (!Game.rooms[disPos.roomName]) {
                    this.goTo(disPos, 1)
                    return
                }
                this.say("🚗", true)
                var container_ = disPos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (stru) => {
                        return stru.structureType == 'container'
                    }
                }) as StructureContainer[]
                if (container_[0] && container_[0].store.getUsedCapacity() > 0) {
                    if (!this.pos.isNearTo(container_[0])) {
                        this.goTo(container_[0].pos, 1);
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
                    this.goTo(disPos, 1)
                    return
                }
            }

        }
        else {
            var heal_state = false;
            if (this.hits < this.hitsMax) heal_state = true
            if (this.room.name != creepMisson.disRoom) {
                this.goTo(new RoomPosition(25, 25, creepMisson.disRoom), 20)
                if (heal_state) { this.heal(this) }
            }
            else {
                if (globalMisson.Data.state == 2) {
                    if (heal_state) { this.heal(this) }
                    let wounded = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (creep) => {
                            return creep.hits < creep.hitsMax && creep != this
                        }
                    })
                    if (wounded) {
                        if (!this.pos.isNearTo(wounded)) this.goTo(wounded.pos, 1)
                        this.heal(wounded)
                    } else {
                        let wounded_isNearTo = this.pos.findInRange(FIND_MY_CREEPS, 1, {
                            filter: (creep) => {
                                return creep.hits < creep.hitsMax && creep != this
                            }
                        })
                        this.heal(wounded_isNearTo[0])
                    }
                    return
                }
                var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username)
                    }
                })
                if (enemy) {
                    if (this.rangedAttack(enemy) == ERR_NOT_IN_RANGE) {
                        this.goTo(enemy.pos, 1)
                    }
                    if (!heal_state) {
                        /*判定是否相邻*/
                        if (this.pos.isNearTo(enemy)) {
                            this.attack(enemy)
                        } else {
                            this.goTo(enemy.pos, 1)
                        }
                    }

                } else {
                    var InvaderCore = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType != 'rampart'
                        }
                    })
                    if (InvaderCore) {
                        this.memory.standed = true
                        if (!this.pos.isNearTo(InvaderCore)) this.goTo(InvaderCore.pos, 1)
                        else this.rangedMassAttack()

                        if (!heal_state) {
                            /*判定是否相邻*/
                            if (this.pos.isNearTo(enemy)) {
                                this.rangedAttack(enemy)
                            }
                        }
                    }
                }
                if (heal_state) { this.heal(this) }
            }
        }
    }

    /* power采集 */
    public handle_power(): void {
        if (!this.memory.notifyWhenAttacked) {
            this.notifyWhenAttacked(false)
            this.memory.notifyWhenAttacked = true;
        }
        var creepMisson = this.memory.MissionData.Data
        var globalMisson = Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)
        if (!globalMisson) { this.say("找不到全局任务了！"); this.memory.MissionData = {}; return }
        var role = this.memory.role
        var missonPostion = new RoomPosition(creepMisson.x, creepMisson.y, creepMisson.room)
        if (!missonPostion) { this.say("找不到目标地点！"); return }
        if (role == 'power-attack') {
            this.memory.standed = true
            if (globalMisson.Data.state == 1) {
                /* 先组队 */
                if (!this.memory.double) {
                    if (Game.time % 7 == 0) {
                        if (globalMisson.CreepBind['power-heal'].bind.length > 0) {
                            for (var c of globalMisson.CreepBind['power-heal'].bind) {
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
                        return (!isInArray([0, 49], object.pos.x) && !isInArray([0, 49], object.pos.y))
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
                                        globalMisson.Data.state = 2
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
                    //     globalMisson.CreepBind['power-attack'].num = 0
                    //     globalMisson.CreepBind['power-heal'].num = 0
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
                            if (globalMisson.CreepBind['power-attack'].num == 2 && globalMisson.CreepBind['power-attack'].num == globalMisson.CreepBind['power-attack'].bind.length && globalMisson.CreepBind['power-heal'].num == globalMisson.CreepBind['power-heal'].bind.length) {
                                globalMisson.CreepBind['power-attack'].num = 1
                                globalMisson.CreepBind['power-heal'].num = 1
                                if (globalMisson.CreepBind['power-attack'].bind.length < 2) return
                            }
                            else {
                                if (this.ticksToLive < (1500 - this.memory.tick + 200)) {
                                    globalMisson.CreepBind['power-attack'].num = 2
                                    globalMisson.CreepBind['power-heal'].num = 2
                                }
                            }
                            /* 新增一层逻辑判断 */
                            if (this.ticksToLive < 40) {
                                globalMisson.CreepBind['power-attack'].num = 1
                                globalMisson.CreepBind['power-heal'].num = 1
                            }
                        }
                        var enemy_creep = powerbank_.pos.findInRange(FIND_HOSTILE_CREEPS, 2)
                        if (enemy_creep.length == 0 && powerbank_.hits < 280000) {
                            globalMisson.Data.state = 2
                        }
                        else if (enemy_creep.length > 0 && powerbank_.hits < 550000) {
                            globalMisson.Data.state = 2
                        }
                    } else {
                        /* 说明过期了，删除任务，自杀 */
                        for (var ii in globalMisson.CreepBind)
                            for (var jj of globalMisson.CreepBind[ii].bind)
                                Game.creeps[jj].suicide()
                        Game.rooms[this.memory.belong].DeleteMission(globalMisson.id)
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
                            globalMisson.CreepBind['power-carry'].num = 0
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
        var creepMisson = this.memory.MissionData.Data
        if (!creepMisson) return
        /* 判断是否正在遭受攻击 */
        if (this.hits < this.hitsMax / 2) {
            let hcreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
            Game.notify(`来自${this.memory.belong}的商品爬虫在房间${this.room.name}遭受攻击,攻击者疑似为${hcreep ? hcreep.owner.username : "不明生物"}`)
        }
        let myroom = Game.rooms[this.memory.belong];
        if (this.memory.role == 'deposit-transfer') {
            if (creepMisson.creeptime) {
                if (this.ticksToLive <= creepMisson.creeptime * 2 && !this.store.getUsedCapacity() && this.pos.roomName == this.memory.belong) { this.suicide(); return; }/*回传之后不够来回的直接操作自杀*/
                if (this.ticksToLive <= creepMisson.creeptime || this.store.getFreeCapacity() < 1)//回家放资源
                {
                    this.transfer_(myroom.storage ? myroom.storage : myroom.terminal, Object.keys(this.store)[0] as ResourceConstant);
                    return;
                }
            }
        }
        var missonPostion = new RoomPosition(creepMisson.x, creepMisson.y, creepMisson.room)
        if (!missonPostion) { this.say("找不到目标地点！"); return }
        switch (this.memory.role) {
            case 'deposit-harvest':
                if (!this.memory.standed) this.memory.standed = true;
                /*这里对transfer进行绑定操作*/
                if (this.pos.roomName != creepMisson.room) {
                    this.goTo(missonPostion, 4)
                    return;
                }
                if (this.pos.roomName == creepMisson.room) {
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
                            if (Game.creeps[this.memory.transfercreep].pos.roomName != creepMisson.room) {
                                delete this.memory.transfercreep;
                            }
                        }

                        /*地上捡垃圾*/
                        var deposit_ = Game.getObjectById(creepMisson.deposit_id) as Deposit
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
                            var T_creepMisson = Game.creeps[this.memory.transfercreep].memory.MissionData.Data;
                            if (Game.creeps[this.memory.transfercreep].ticksToLive <= T_creepMisson.creeptime) return;
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
                    var deposit_ = Game.getObjectById(creepMisson.deposit_id) as Deposit
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
                creepMisson.creeptimebool = false;//停止计时

                if (this.pos.roomName == creepMisson.room) {
                    if (Game.time % 10 == 0) {
                        /*地上捡垃圾*/
                        var deposit_ = Game.getObjectById(creepMisson.deposit_id) as Deposit
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
                        if (!creepMisson.creeptime) {
                            /*标记爬的距离信息*/
                            creepMisson.creeptime = 1500 - this.ticksToLive + 50;
                        }
                    }
                } else {
                    this.goTo(missonPostion, 2)
                }
                break;
            default:
                this.workstate(creepMisson.rType)
                if (this.memory.working) {
                    var storage_ = Game.rooms[this.memory.belong].storage as StructureStorage
                    if (!storage_) return
                    if (!this.pos.isNearTo(storage_)) this.goTo(storage_.pos, 1)
                    else {
                        this.transfer(storage_, creepMisson.rType)
                        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
                        this.suicide()
                    }
                }
                else {
                    var missonPostion = new RoomPosition(creepMisson.x, creepMisson.y, creepMisson.room)
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
                        if (this.ticksToLive < (1500 - (this.memory.tick ? this.memory.tick : 1000) + 70) && this.store.getUsedCapacity(creepMisson.rType) > 0) {
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