import { findFollowData, findNextData, identifyGarrison, identifyNext, parts, RoomInRange } from "@/module/fun/funtion"
import { canSustain, pathClosestFlag, pathClosestStructure, RangeClosestCreep, RangeCreep, warDataInit, CheckExcludeRampart } from "@/module/war/war"
import { generateID, getDistance, isInArray } from "@/utils"

export default class CreepMissonWarExtension extends Creep {


    // 黄球拆迁
    public handle_dismantle(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (data.boost) {
            if (!this.BoostCheck(['move', 'work'])) return
        }
        if (this.room.name != data.disRoom || data.shard != Game.shard.name) {
            this.arriveTo(new RoomPosition(25, 25, data.disRoom), 20, data.shard, data.shardData ? data.shardData : null)
            return
        }
        this.memory.standed = true
        // 对方开安全模式情况下 删除任务
        if (this.room.controller && this.room.controller.safeMode) {
            if (Game.shard.name == this.memory.shard) {
                Game.rooms[this.memory.belong].DeleteMission(id)
            }
            return
        }

        if ((this.room.controller?.my && this.room.controller.level >= 5)) {
            if (this.hits < this.hitsMax) {
                this.optTower('heal', this, true)
            }
        }

        /* dismantle_0 */
        let disFlag = this.pos.findClosestByPath(FIND_FLAGS, {
            filter: (flag) => {
                return flag.name.indexOf('dismantle') == 0
            }
        })
        if (!disFlag) {
            var clostStructure = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: (struc) => {
                    return !isInArray(['controller'], struc.structureType)
                }
            })
            if (clostStructure) {
                let randomStr = Math.random().toString(36).substr(3)
                clostStructure.pos.createFlag(`dismantle_${randomStr}`, COLOR_WHITE)
                return
            }
            else
                return
        }
        let stru = disFlag.pos.lookFor(LOOK_STRUCTURES)[0]
        if (stru) {
            if (this.dismantle(stru) == ERR_NOT_IN_RANGE) {
                this.goTo(stru.pos, 1)
                return
            }
        }
        else { disFlag.remove() }
    }

    // 控制攻击
    public handle_control(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (this.room.name != data.disRoom || Game.shard.name != data.shard) {
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)

        }
        else {
            // 对方开安全模式情况下 删除任务
            if (this.room.controller && this.room.controller.safeMode) {
                if (Game.shard.name == this.memory.shard) {
                    Game.rooms[this.memory.belong].DeleteMission(id)
                }
                return
            }
            let control = this.room.controller
            if (control.level < 1) {
                /*完成攻击任务删除*/
                if (Game.shard.name == this.memory.shard) {
                    // console.log('完成攻击',this.memory.taskRB)
                    Game.rooms[this.memory.belong].DeleteMission(this.memory.taskRB)
                    // console.log('完成攻击-A')
                }
            }
            if (!this.pos.isNearTo(control)) this.goTo(control.pos, 1)
            else {
                if (control.owner) this.attackController(control)
                else this.reserveController(control)
            }
        }
    }
    public Checkaroundhurt(pos: RoomPosition, range: number = 1, hits: number = 600) {
        // console.log(this.name)
        if (!global.HostileData[this.room.name]) return true
        if (!global.HostileData[this.room.name].data) return true
        // console.log(pos,'开始算伤')
        for (let x = pos.x - range; x < pos.x + range; x++) {
            for (let y = pos.y - range; y < pos.y + range; y++) {
                let pos_ = `${x}/${y}`
                let _atk_data = global.HostileData[this.room.name].data[pos_]
                if (_atk_data) {
                    if (_atk_data.attack + _atk_data.rattack > hits) {
                        // console.log(this.name, _atk_data.attack + _atk_data.rattack, pos_)
                        return true;
                    }
                }
            }
        }
        return false;
    }


    // 红球防御
    public handle_defend_attack(): void {
        if (!this.BoostCheck(['move', 'attack'])) return
        this.memory.standed = true
        if (this.hitsMax - this.hits > 200) this.optTower('heal', this)
        this.memory.crossLevel = 16
        /* 如果周围1格发现敌人，爬虫联合防御塔攻击 */
        // var nearCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
        //     filter: (creep) => {
        //         return !isInArray(Memory.whitesheet, creep.name)
        //     }
        // })
        let nearCreep = this.SearchHostilecreeps(1)
        if (nearCreep) {
            this.attack(nearCreep)
            this.optTower('attack', nearCreep)
        }

        // var nearCreep_A = this.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
        //     filter: (creep) => {
        //         return !isInArray(Memory.whitesheet, creep.name)
        //     }
        // })
        // if(nearCreep_A.length>0)
        // {
        //     this.attack(nearCreep_A[0])
        //     this.optTower('attack', nearCreep_A[0])
        //     return;
        // }

        /* 寻路去距离敌对爬虫最近的rampart */
        var hostileCreep = Game.rooms[this.memory.belong].find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.name)
            }
        })

        if (hostileCreep.length > 0) {
            let hostileCreep_atk = this.hostileCreep_atk(hostileCreep)
            for (var c of hostileCreep) {
                /* 如果发现Hits/hitsMax低于百分之80的爬虫，直接防御塔攻击 */
                if (c.hits / c.hitsMax <= 0.8)
                    this.optTower('attack', c)
            }
            if (Number(hostileCreep_atk) < 600 && this.room.controller.level >= 8) {
                // this.goTo(hostileCreep[0], 0)
                if (Game.flags['TowerVisualWar']) {
                    this.room.visual.line(this.pos, hostileCreep[0].pos,
                        { color: 'red', lineStyle: 'dashed' });
                }
                this.goTo_defend(hostileCreep[0].pos, 0)
                let attack_state = this.attack(hostileCreep[0])
                if (attack_state == OK) {
                    this.optTower('attack', hostileCreep[0])
                }
                return
            }
        }
        else {

        }
        // 以gather_attack开头的旗帜  例如： defend_attack_0 优先前往该旗帜附近
        let gatherFlag = this.pos.findClosestByPath(FIND_FLAGS, {
            filter: (flag) => {
                return flag.name.indexOf('defend_attack') == 0
            }
        })
        if (gatherFlag) {
            this.goTo(gatherFlag.pos, 0)
            return
        }
        if (!Game.rooms[this.memory.belong].memory.enemy[this.name]) Game.rooms[this.memory.belong].memory.enemy[this.name] = []
        if (Game.rooms[this.memory.belong].memory.enemy[this.name].length <= 0) {
            /* 领取敌对爬虫 */
            let creeps_ = []
            for (var creep of hostileCreep) {
                /* 判断一下该爬虫的id是否存在于其他爬虫的分配里了 */
                if (this.isInDefend(creep)) continue
                else {
                    creeps_.push(creep)
                }
            }
            if (creeps_.length > 0) {
                let highestAim: Creep = creeps_[0]
                for (var i of creeps_) {
                    if (parts(i, 'attack') || parts(i, 'work')) {
                        highestAim = i
                        break
                    }
                }
                Game.rooms[this.memory.belong].memory.enemy[this.name].push(highestAim.id)
                /* 方便识别小队，把周围的爬也放进去 【如果本来不是小队但暂时在周围的，后续爬虫会自动更新】 */
                let nearHCreep = highestAim.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.name) && !this.isInDefend(creep)
                    }
                })
                if (nearHCreep.length > 0) for (var n of nearHCreep) Game.rooms[this.memory.belong].memory.enemy[this.name].push(n.id)
            }
        }
        else {
            let en = Game.getObjectById(Game.rooms[this.memory.belong].memory.Enemydistribution[this.name] as Id<Creep>) as Creep
            if (!isInArray(global.HostileGroup[this.memory.belong] as any, Game.rooms[this.memory.belong].memory.Enemydistribution[this.name])) {
                delete Game.rooms[this.memory.belong].memory.Enemydistribution[this.name];
                en = null;
            }
            if (!en) {
                /*重新进行任务分配*/
                if (Game.rooms[this.memory.belong].memory.Enemydistribution[this.name]) {
                    delete Game.rooms[this.memory.belong].memory.Enemydistribution[this.name];
                }
                for (let ii in Game.rooms[this.memory.belong].memory.Enemydistribution) {
                    if (isInArray(global.HostileGroup[this.memory.belong] as any, Game.rooms[this.memory.belong].memory.Enemydistribution[ii])) {
                        var index = global.HostileGroup[this.memory.belong].indexOf(Game.rooms[this.memory.belong].memory.Enemydistribution[ii])
                        global.HostileGroup[this.memory.belong].splice(index, 1)
                    }
                }
                console.log('待分配', global.HostileGroup[this.memory.belong].length)
                if (global.HostileGroup[this.memory.belong].length > 0) {
                    var HostileGroupnearstram = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                        filter: (stru) => {
                            return isInArray(global.HostileGroup[this.memory.belong] as any, stru.id)
                        }
                    })
                    console.log(this.name, '分配', HostileGroupnearstram.id)
                    Game.rooms[this.memory.belong].memory.Enemydistribution[this.name] = HostileGroupnearstram.id
                    en = Game.getObjectById(Game.rooms[this.memory.belong].memory.Enemydistribution[this.name] as Id<Creep>) as Creep
                }
            }

            if (en) {
                let nstC = en
                if (nstC) {
                    // 寻找最近的爬距离最近的rampart,去那里呆着
                    var nearstram = nstC.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (stru) => {
                            return (stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 || stru.pos.lookFor(LOOK_CREEPS)[0] == this) && CheckExcludeRampart(this.room, stru.pos))
                        }
                    })
                    if (nearstram) {
                        if (Game.flags['TowerVisualWar']) {
                            this.room.visual.line(this.pos, nearstram.pos,
                                { color: 'red', lineStyle: 'dashed' });
                            this.room.visual.line(nearstram.pos, nstC.pos,
                                { color: 'green', lineStyle: 'dashed' });
                        }
                        /*检查当前范围可能受到的伤害如果不会超过600则追出去*/
                        if (this.Checkaroundhurt(this.pos, 2, 400) || this.Checkaroundhurt(nstC.pos, 2, 400) || this.hitsMax - 1200 > this.hits) {
                            // console.log(this.name, '不满足追踪条件')
                            this.goTo_defend(nearstram.pos, 0)
                        } else {
                            console.log(this.name, '满足伤害要求|追出去')
                            this.goTo_defend(nstC.pos, 0)
                        }
                        // this.goTo_defend(nearstram.pos, 0)
                        /*如果对应的爬不在3的范围内则进行删除操作*/
                        // if (!nearstram.pos.inRangeTo(nstC,2)) {
                        //     // console.log(this.name, '放弃当前目标', nstC.name)
                        //     Game.rooms[this.memory.belong].memory.enemy[this.name].splice(0, 1)
                        // }
                    }
                    else this.moveTo(nstC.pos)
                } else {
                    console.log('没有ram')
                    var ramp = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && CheckExcludeRampart(this.room, stru.pos)
                        }
                    })
                    console.log(ramp)
                    if (this.pos.inRangeTo(ramp, 3) && !this.pos.isEqualTo(ramp)) {
                        this.moveTo(ramp.pos)
                    }
                }
            } else {
                console.log(this.name, '分配已饱和')
                if (this.room.memory.DefendDouId) {
                    let DefendDou = Game.getObjectById(this.room.memory.DefendDouId as Id<Creep>) as Creep
                    if (DefendDou || !this.Checkaroundhurt(DefendDou.pos, 2, 400)) {
                        console.log(this.name, '分配已饱和|追出去')
                        this.goTo_defend(DefendDou.pos, 0)
                    }

                }
            }

            // let en = Game.getObjectById(Game.rooms[this.memory.belong].memory.enemy[this.name][0]) as Creep
            // if (!en) {
            //     Game.rooms[this.memory.belong].memory.enemy[this.name].splice(0, 1)
            //     return
            // }
            // let nstC = en
            // // 查找是否是小队爬, 发现不是小队爬就删除
            // if (Game.rooms[this.memory.belong].memory.enemy[this.name].length > 1) {
            //     B:
            //     for (var id of Game.rooms[this.memory.belong].memory.enemy[this.name]) {
            //         let idCreep = Game.getObjectById(id) as Creep
            //         if (!idCreep) continue B
            //         if (Game.time % 10 == 0)    // 防止敌方爬虫bug
            //             if (Math.abs(idCreep.pos.x - en.pos.x) >= 2 || Math.abs(idCreep.pos.y - en.pos.y) >= 2) {
            //                 let index = Game.rooms[this.memory.belong].memory.enemy[this.name].indexOf(id)
            //                 Game.rooms[this.memory.belong].memory.enemy[this.name].splice(index, 1)
            //                 continue B
            //             }
            //         if (getDistance(this.pos, idCreep.pos) < getDistance(this.pos, nstC.pos))
            //             nstC = idCreep
            //     }
            // }
            // if (nstC) {
            //     // 寻找最近的爬距离最近的rampart,去那里呆着
            //     var nearstram = nstC.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            //         filter: (stru) => {
            //             return (stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 || stru.pos.lookFor(LOOK_CREEPS)[0] == this) && CheckExcludeRampart(this.room, stru.pos))
            //         }
            //     })
            //     if (nearstram) {
            //         if (Game.flags['TowerVisualWar']) {
            //             this.room.visual.line(this.pos, nearstram.pos,
            //                 { color: 'red', lineStyle: 'dashed' });
            //             this.room.visual.line(nearstram.pos, nstC.pos,
            //                 { color: 'green', lineStyle: 'dashed' });
            //         }
            //         this.goTo_defend(nearstram.pos, 0)
            //         /*如果对应的爬不在3的范围内则进行删除操作*/
            //         // if (!nearstram.pos.inRangeTo(nstC,2)) {
            //         //     // console.log(this.name, '放弃当前目标', nstC.name)
            //         //     Game.rooms[this.memory.belong].memory.enemy[this.name].splice(0, 1)
            //         // }
            //     }
            //     else this.moveTo(nstC.pos)
            // } else {
            //     console.log('没有ram')
            //     var ramp = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            //         filter: (stru) => {
            //             return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && CheckExcludeRampart(this.room, stru.pos)
            //         }
            //     })
            //     console.log(ramp)
            //     if (this.pos.inRangeTo(ramp, 3) && !this.pos.isEqualTo(ramp)) {
            //         this.moveTo(ramp.pos)
            //     }
            // }
        }
        // 仍然没有说明主动防御已经饱和
        if (Game.rooms[this.memory.belong].memory.enemy[this.name].length <= 0) {
            this.say("🔍")
            var closestCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.name)
                }
            })
            if (closestCreep && !this.pos.inRangeTo(closestCreep.pos, 2)) {
                /* 找离虫子最近的rampart */
                var nearstram = closestCreep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 || stru.pos.lookFor(LOOK_CREEPS)[0] == this) && CheckExcludeRampart(this.room, stru.pos)
                    }
                })
                if (nearstram) {
                    if (Game.flags['TowerVisualWar']) {
                        this.room.visual.line(this.pos, nearstram.pos,
                            { color: 'red', lineStyle: 'dashed' });
                    }
                    this.goTo_defend(nearstram.pos, 0)
                }

            } else {
                var nearstram = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 || stru.pos.lookFor(LOOK_CREEPS)[0] == this) && CheckExcludeRampart(this.room, stru.pos)
                    }
                })
                if (nearstram) {

                    if (Game.flags['TowerVisualWar']) {
                        this.room.visual.line(this.pos, nearstram.pos,
                            { color: 'aqua', lineStyle: 'dashed' });
                    }
                    this.goTo_defend(nearstram.pos, 0)
                }
            }
            /*检查是否有相邻的敌对目标。进行进攻*/
            var adjoinCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.name)
                }
            })
            if (adjoinCreep.length > 0) {
                console.log(this.name, '攻击相邻', adjoinCreep[0].name)
                this.attack(adjoinCreep[0])
            }
        }
        if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1) {
            this.moveTo(new RoomPosition(Memory.RoomControlData[this.memory.belong].center[0], Memory.RoomControlData[this.memory.belong].center[1], this.memory.belong))
        }
    }

    // 蓝球防御
    public handle_defend_range(): void {
        if (!this.BoostCheck(['move', 'ranged_attack'])) return
        this.memory.crossLevel = 15
        if (this.hitsMax - this.hits > 200) this.optTower('heal', this)
        /* 如果周围1格发现敌人，爬虫联合防御塔攻击 */
        var nearCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.name)
            }
        })
        if (nearCreep.length > 0) {
            var nearstCreep = this.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.name)
                }
            })
            if (nearstCreep.length > 0) this.rangedMassAttack()
            else this.rangedAttack(nearCreep[0])
            if (Game.time % 4 == 0)
                this.optTower('attack', nearCreep[0])
        }
        /* 寻路去距离敌对爬虫最近的rampart */
        var hostileCreep = Game.rooms[this.memory.belong].find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.name)
            }
        })
        if (hostileCreep.length > 0) {
            for (var c of hostileCreep)
                /* 如果发现Hits/hitsMax低于百分之80的爬虫，直接防御塔攻击 */
                if (c.hits / c.hitsMax <= 0.8)
                    this.optTower('attack', c)
        }
        // 以gather_attack开头的旗帜  例如： defend_range_0 优先前往该旗帜附近
        let gatherFlag = this.pos.findClosestByPath(FIND_FLAGS, {
            filter: (flag) => {
                return flag.name.indexOf('defend_range') == 0
            }
        })
        if (gatherFlag) {
            this.goTo(gatherFlag.pos, 0)
            return
        }
        if (!Game.rooms[this.memory.belong].memory.enemy[this.name]) Game.rooms[this.memory.belong].memory.enemy[this.name] = []
        if (Game.rooms[this.memory.belong].memory.enemy[this.name].length <= 0) {
            /* 领取敌对爬虫 */
            let creeps_ = []
            for (var creep of hostileCreep) {
                /* 判断一下该爬虫的id是否存在于其他爬虫的分配里了 */
                if (this.isInDefend(creep)) continue
                else {
                    creeps_.push(creep)
                }
            }
            if (creeps_.length > 0) {
                let highestAim: Creep = creeps_[0]
                for (var i of creeps_) {
                    if (parts(i, 'ranged_attack')) {
                        highestAim = i
                        break
                    }
                }
                Game.rooms[this.memory.belong].memory.enemy[this.name].push(highestAim.id)
                /* 方便识别小队，把周围的爬也放进去 【如果本来不是小队但暂时在周围的，后续爬虫会自动更新】 */
                let nearHCreep = highestAim.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.name) && !this.isInDefend(creep)
                    }
                })
                if (nearHCreep.length > 0) for (var n of nearHCreep) Game.rooms[this.memory.belong].memory.enemy[this.name].push(n.id)
            }
        }
        else {
            let en = Game.getObjectById(Game.rooms[this.memory.belong].memory.enemy[this.name][0] as Id<Creep>) as Creep
            if (!en) {
                Game.rooms[this.memory.belong].memory.enemy[this.name].splice(0, 1)
                return
            }
            let nstC = en
            // 查找是否是小队爬, 发现不是小队爬就删除
            if (Game.rooms[this.memory.belong].memory.enemy[this.name].length > 1) {
                B:
                for (var id of Game.rooms[this.memory.belong].memory.enemy[this.name]) {
                    let idCreep = Game.getObjectById(id as Id<Creep>) as Creep
                    if (!idCreep) continue B
                    if (Game.time % 10 == 0)
                        if (Math.abs(idCreep.pos.x - en.pos.x) >= 2 || Math.abs(idCreep.pos.y - en.pos.y) >= 2) {
                            let index = Game.rooms[this.memory.belong].memory.enemy[this.name].indexOf(id)
                            Game.rooms[this.memory.belong].memory.enemy[this.name].splice(index, 1)
                            continue B
                        }
                    if (getDistance(this.pos, idCreep.pos) < getDistance(this.pos, nstC.pos))
                        nstC = idCreep
                }
            }
            if (nstC) {
                // 寻找最近的爬距离最近的rampart,去那里呆着
                var nearstram = nstC.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 || stru.pos.lookFor(LOOK_CREEPS)[0] == this) && CheckExcludeRampart(this.room, stru.pos)
                    }
                })
                if (nearstram)
                    this.goTo_defend(nearstram.pos, 0)
                else this.moveTo(nstC.pos)
            } else {
                var ramp = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && CheckExcludeRampart(this.room, stru.pos)
                    }
                })
                if (this.pos.inRangeTo(ramp, 3) && !this.pos.isEqualTo(ramp)) {
                    this.moveTo(ramp.pos)
                }
            }
        }
        // 仍然没有说明主动防御已经饱和
        if (Game.rooms[this.memory.belong].memory.enemy[this.name].length <= 0) {
            this.say("🔍")
            var closestCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.name)
                }
            })
            if (closestCreep && !this.pos.inRangeTo(closestCreep.pos, 3)) {
                /* 找离虫子最近的rampart */
                var nearstram = closestCreep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'rampart' && stru.pos.GetStructureList(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0 && (stru.pos.lookFor(LOOK_CREEPS).length <= 0 || stru.pos.lookFor(LOOK_CREEPS)[0] == this) && CheckExcludeRampart(this.room, stru.pos)
                    }
                })
                if (nearstram)
                    this.goTo_defend(nearstram.pos, 0)
            }
        }
        if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1) {
            this.moveTo(new RoomPosition(Memory.RoomControlData[this.memory.belong].center[0], Memory.RoomControlData[this.memory.belong].center[1], this.memory.belong))
        }
    }

    // 双人防御
    public handle_defend_double(): void {
        // let s =Game.cpu.getUsed();
        if (this.memory.role == 'defend-douAttack') {
            if (!this.BoostCheck(['move', 'attack', 'tough'])) return
        }
        else {
            if (!this.BoostCheck(['move', 'heal', 'tough'])) return
        }
        if (!this.memory.double) {
            if (this.memory.role == 'defend-douHeal') {
                /* 由heal来进行组队 */
                if (Game.time % 7 == 0) {
                    var disCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (creep) => {
                            return creep.memory.role == 'defend-douAttack' && !creep.memory.double
                        }
                    })
                    if (disCreep) {
                        this.memory.double = disCreep.name
                        disCreep.memory.double = this.name
                        this.memory.captain = false
                        disCreep.memory.captain = true
                    }
                }
                if (!this.memory.double) {
                    if (this.hitsMax - this.hits > 600) {
                        this.optTower('heal', this)
                        this.heal(this)
                    }
                    this.goTo(Game.rooms[this.memory.belong].storage.pos, 1)
                }
            }
            return
        }
        if (this.memory.role == 'defend-douAttack') {
            if (this.hitsMax - this.hits > 1200) this.optTower('heal', this)
            if (!Game.creeps[this.memory.double]) {
                delete this.memory.double
                return
            }
            if (this.fatigue || Game.creeps[this.memory.double].fatigue) return
            if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double]) && (!isInArray([0, 49], this.pos.x) && !isInArray([0, 49], this.pos.y))) {
                /*只扫描周围目标进行攻击 不操作移动*/
                let creeps = this.SearchHostilecreeps(1)
                if (creeps) {
                    this.optTower('attack', creeps)
                    this.attack(creeps)
                }
                return
            }

            /* 确保在自己房间 */
            if (this.room.name != this.memory.belong) {
                this.goTo(new RoomPosition(24, 24, this.memory.belong), 23)
            }
            else {


                let flag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('defend_double') == 0
                    }
                })
                if (flag) {
                    let creeps = this.SearchHostilecreeps(1)
                    if (creeps) {
                        this.optTower('attack', creeps)
                        this.attack(creeps)
                    }
                    this.goTo(flag.pos, 0)
                    return
                }
                let creeps = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username) && (!isInArray([0, 49], creep.pos.x) && !isInArray([0, 49], creep.pos.y))
                    }
                })
                if (this.hitsMax - this.hits > 1500 && this.Checkaroundhurt(this.pos, 1, (this.hitsMax - this.hits) / 2)) {
                    console.log(this.name, '逃离')
                    this.Flee(creeps.pos, 3)
                    return;
                }
                /*检查是否存在已经针对的目标信息*/
                if (this.room.memory.DefendDouId) {
                    let DouID = Game.getObjectById(this.room.memory.DefendDouId as Id<Creep>) as Creep;
                    if (!DouID) { delete this.room.memory.DefendDouId }
                    if (DouID) {
                        console.log(this.name, '协同追踪', this.room.memory.DefendDouId)
                        if (DouID && !isInArray([0, 49], DouID.pos.x) && !isInArray([0, 49], DouID.pos.y)) {
                            this.room.visual.line(this.pos, DouID.pos,
                                { color: 'red', lineStyle: 'dashed' });
                            if (this.pos.isNearTo(DouID)) {
                                let s_tet = this.attack(DouID)
                                console.log(this.name, '调度塔一起攻击', s_tet)
                                this.optTower('attack', DouID)
                                // switch () {
                                //     case ERR_NOT_IN_RANGE:
                                //         /*检查周围目标信息*/
                                //         this.goTo(DouID.pos, 1)
                                //         break;
                                //     case OK:

                                //         break;
                                // }
                            } else {
                                let atk_creeps = this.SearchHostilecreeps(1)
                                if (atk_creeps) {
                                    console.log('未达到协防目标,攻击周围', atk_creeps.id)
                                    this.attack(atk_creeps)
                                }
                                this.goTo(DouID.pos, 1)
                            }

                            this.room.memory.DefendDouPosition.push(this.pos)
                            return
                        }
                    }
                }
                if (creeps && !isInArray([0, 49], creeps.pos.x) && !isInArray([0, 49], creeps.pos.y)) {
                    this.room.visual.line(this.pos, creeps.pos,
                        { color: 'red', lineStyle: 'dashed' });
                    let DefendDoulist = this.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                        filter: (creep) => {
                            return !isInArray(Memory.whitesheet, creep.owner.username) && creep.id != creeps.id
                        }
                    })
                    if (DefendDoulist) {
                        this.room.memory.DefendDouPosition.push(this.pos)
                        this.room.memory.DefendDouId = creeps.id;
                    }
                    switch (this.attack(creeps)) {
                        case ERR_NOT_IN_RANGE:
                            this.goTo(creeps.pos, 1)
                            break;
                        case OK:
                            console.log('调度塔一起攻击')
                            this.optTower('attack', creeps)
                            break;
                    }
                }

                if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1) {
                    this.moveTo(new RoomPosition(Memory.RoomControlData[this.memory.belong].center[0], Memory.RoomControlData[this.memory.belong].center[1], this.memory.belong))
                }
            }
        }
        else {
            if (this.hitsMax - this.hits > 600) this.optTower('heal', this)
            this.moveTo(Game.creeps[this.memory.double])
            if (Game.creeps[this.memory.double]) {
                let double_creeps = Game.creeps[this.memory.double];
                if (double_creeps.hitsMax * 0.8 < double_creeps.hits) {
                    let creeps = this.pos.findInRange(FIND_MY_CREEPS, 1, {
                        filter: (creep) => {
                            return Game.creeps[this.memory.double].id != creep.id && creep.id != this.id && creep.hitsMax * 0.8 > creep.hits
                        }
                    })
                    if (creeps.length > 0) {
                        if (Game.flags['TowerVisualWar']) {
                            this.room.visual.line(this.pos, creeps[0].pos,
                                { color: 'green' });
                        }
                        this.heal(creeps[0])
                    } else {
                        if (Game.flags['TowerVisualWar']) {
                            this.room.visual.line(this.pos, Game.creeps[this.memory.double].pos,
                                { color: 'green' });
                        }
                        this.heal(Game.creeps[this.memory.double])
                    }
                } else {
                    if (Game.flags['TowerVisualWar']) {
                        this.room.visual.line(this.pos, Game.creeps[this.memory.double].pos,
                            { color: 'green' });
                    }
                    this.heal(Game.creeps[this.memory.double])
                }
            }
            else this.heal(this)
            if (!Game.creeps[this.memory.double]) {
                if (this.ticksToLive < 100) {
                    this.suicide(); return
                }
                delete this.memory.double;
            }
            else {
                if (this.pos.isNearTo(Game.creeps[this.memory.double])) {
                    var caption_hp = Game.creeps[this.memory.double].hits
                    var this_hp = this.hits
                    if (this_hp == this.hitsMax && caption_hp == Game.creeps[this.memory.double].hitsMax) this.heal(Game.creeps[this.memory.double])
                    if (caption_hp < this_hp) {
                        this.heal(Game.creeps[this.memory.double])
                    }
                    else {
                        this.heal(this)
                    }
                    let otherCreeps = this.pos.findInRange(FIND_MY_CREEPS, 3, { filter: (creep) => { return creep.hits < creep.hitsMax - 300 } })
                    if (otherCreeps[0] && this.hits == this.hitsMax && Game.creeps[this.memory.double].hits == Game.creeps[this.memory.double].hitsMax) {
                        if (otherCreeps[0].pos.isNearTo(this))
                            this.heal(otherCreeps[0])
                        else this.rangedHeal(otherCreeps[0])
                    }
                }
                else {
                    this.heal(this)
                    this.moveTo(Game.creeps[this.memory.double])
                }
            }
        }
        // let e =Game.cpu.getUsed();
        // console.log(this.name,e-s)
    }

    /*踩工地*/
    public handle_cconstruction(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        if (this.room.name == this.memory.belong && Game.shard.name == this.memory.shard) {
            if (data.boost) {
                switch (data.bodylevel) {
                    case 'T3':
                        if (!this.BoostCheck(['move', 'heal', 'tough', 'ranged_attack'])) return
                        break;
                    default:
                        // if (!this.BoostCheck(['move', 'heal', 'tough', 'ranged_attack'])) return
                        break;
                }
            }
        }

        if ((this.room.name != data.disRoom || Game.shard.name != data.shard)) {
            if (this.hits < this.hitsMax) {
                switch (data.bodylevel) {
                    case 'T3':
                        this.heal(this)
                        break;
                }
                /*检查坐标信息*/
                if (isInArray([0, 49], this.pos.x) || isInArray([0, 49], this.pos.y)) {
                    this.Flee(this.pos, 2)
                }
                /*检查是否存在敌对目标的信息*/
                return
            }
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
        }
        else {
            // 对方开安全模式情况下 删除任务
            if (this.room.controller && this.room.controller.safeMode && !this.room.controller.my) {
                if (Game.shard.name == this.memory.shard) {
                    Game.rooms[this.memory.belong].DeleteMission(id)
                }
                return
            }
            if (Game.flags['cconstruction_flags']) {
                if (!this.pos.inRangeTo(Game.flags['cconstruction_flags'], 1)) {
                    this.goTo(Game.flags['cconstruction_flags'].pos, 0)
                }
            }
            if (this.getActiveBodyparts(HEAL)) {
                this.heal(this)
            }
            switch (data.bodylevel) {
                case 'T3':
                    warDataInit(Game.rooms[data.disRoom])
                    let creeps = global.warData.enemy[data.disRoom].data
                    let ranged3Attack = RangeCreep(this.pos, creeps, 3, true)  // 三格内的攻击性爬虫
                    if (ranged3Attack.length > 0) {
                        // 防御塔伤害数据
                        let towerData = global.warData.tower[this.room.name].data
                        let posStr = `${this.pos.x}/${this.pos.y}`
                        let towerHurt = towerData[posStr] ? towerData[posStr]['attack'] : 0
                        if (!canSustain(ranged3Attack, this, towerHurt)) {
                            this.say("危")
                            /* 删除记忆 */
                            let closestHurtCreep = RangeClosestCreep(this.pos, ranged3Attack, true)
                            if (closestHurtCreep) {
                                this.Flee(closestHurtCreep.pos, 4)
                                return;
                            }
                        }
                    }
                    var pos_ = this.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES)
                    if (pos_) {
                        if (!this.pos.isEqualTo(pos_)) {
                            this.goTo(pos_.pos, 0)
                        }
                    } else {
                        if (this.getActiveBodyparts(RANGED_ATTACK)) {
                            let creeps = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                                filter: (creep) => {
                                    return creep.getActiveBodyparts(WORK) && !creep.getActiveBodyparts(ATTACK) && !creep.getActiveBodyparts(RANGED_ATTACK)
                                }
                            })
                            if (creeps) {
                                if (!this.pos.inRangeTo(creeps, 1)) {
                                    this.goTo(creeps.pos, 1)
                                }
                                this.rangedMassAttack()
                                return;
                            }
                        }
                    }
                    break;
                default:
                    var pos_ = this.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES)
                    if (!pos_) return
                    this.goTo(pos_.pos, 0)
                    break;
            }


        }
    }


    // 攻防一体 已经做一定测试 目前未发现bug
    public handle_aio(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        if (this.room.name == this.memory.belong && Game.shard.name == this.memory.shard) {
            if (data.boost) {

                switch (data.bodylevel) {
                    case 'T8':
                        if (!this.BoostCheck(['move', 'heal', 'ranged_attack'])) return
                        break;
                    default:
                        if (!this.BoostCheck(['move', 'ranged_attack', 'heal', 'tough'])) return
                        break;
                }
            }
        }

        if ((this.room.name != data.disRoom || Game.shard.name != data.shard)) {
            if (this.hits < this.hitsMax) {
                this.heal(this)
                /*检查坐标信息*/
                if (isInArray([0, 49], this.pos.x) || isInArray([0, 49], this.pos.y)) {
                    this.Flee(this.pos, 2)
                }
                /*检查是否存在敌对目标的信息*/
                return
            }
            this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
        }
        else {
            // 对方开安全模式情况下 删除任务
            if (this.room.controller && this.room.controller.safeMode && !this.room.controller.my) {
                if (Game.shard.name == this.memory.shard) {
                    Game.rooms[this.memory.belong].DeleteMission(id)
                }
                return
            }
            warDataInit(Game.rooms[data.disRoom])
            let creeps = global.warData.enemy[data.disRoom].data
            let flags = global.warData.flag[data.disRoom].data
            if (!this.memory.targetFlag && (!this.room.controller || (this.room.controller && !this.room.controller.my)))    // 没有目标旗帜Memory的情况下，先查找有没有最近的周围没有攻击爬的旗帜
            {
                this.heal(this)
                let flag_attack = pathClosestFlag(this.pos, flags, 'aio', true, 4) // 最近的攻击旗帜
                if (flag_attack) {
                    this.memory.targetFlag = flag_attack.name
                }
                else {
                    // 没有旗帜，就寻找一个最近的非危险建筑【优先没有rampart的】
                    let safeStructure = pathClosestStructure(this.pos, true, true, true, 4)
                    if (!safeStructure) {
                        // 还没有就寻找ram
                        let ramStructure = pathClosestStructure(this.pos, true, false, true, 4)
                        if (!ramStructure) {
                            let wallStructure = pathClosestStructure(this.pos, false, false, true, 2)
                            if (!wallStructure) {
                            }
                            else {
                                let randomStr = Math.random().toString(36).substr(3)
                                if (!Game.flags[`aio_${randomStr}`])
                                    wallStructure.pos.createFlag(`aio_${randomStr}`)
                                this.memory.targetFlag = `aio_${randomStr}`
                            }
                        }
                        else {
                            let randomStr = Math.random().toString(36).substr(3)
                            if (!Game.flags[`aio_${randomStr}`])
                                ramStructure.pos.createFlag(`aio_${randomStr}`)
                            this.memory.targetFlag = `aio_${randomStr}`
                        }
                    }
                    else {
                        let randomStr = Math.random().toString(36).substr(3)
                        if (!Game.flags[`aio_${randomStr}`]) {
                            safeStructure.pos.createFlag(`aio_${randomStr}`)
                            this.memory.targetFlag = `aio_${randomStr}`
                        }
                    }
                }
                // 遇到不能承受的爬就规避
                let ranged3Attack = RangeCreep(this.pos, creeps, 3, true)  // 三格内的攻击性爬虫
                if (ranged3Attack.length > 0) {
                    // 防御塔伤害数据
                    let towerData = global.warData.tower[this.room.name].data
                    let posStr = `${this.pos.x}/${this.pos.y}`
                    let towerHurt = towerData[posStr] ? towerData[posStr]['attack'] : 0
                    if (!canSustain(ranged3Attack, this, towerHurt)) {
                        this.say("危")
                        let closestHurtCreep = RangeClosestCreep(this.pos, ranged3Attack, true)
                        if (closestHurtCreep) {
                            this.Flee(closestHurtCreep.pos, 3)
                        }
                    }
                }
                /*检查是否有对方的爬进行攻击*/
            }
            else {
                if (!Game.flags[this.memory.targetFlag]) {
                    delete this.memory.targetFlag
                }
                else {
                    let pos_ = Game.flags[this.memory.targetFlag].pos
                    if (pos_.roomName != this.room.name) {
                        delete this.memory.targetFlag
                        return
                    }
                    let stru = pos_.lookFor(LOOK_STRUCTURES)
                    if (stru.length <= 0 || (stru[0].structureType == 'road' || stru[0].structureType == 'container') && stru.length == 1) {
                        this.heal(this)
                        Game.flags[this.memory.targetFlag].remove()
                        delete this.memory.targetFlag
                        // 尝试看一下有没有建筑 对墙就不做尝试了
                        let safeStructure = pathClosestStructure(this.pos, true, true, true, 4)
                        if (safeStructure) {
                            let randomStr = Math.random().toString(36).substr(3)
                            if (!Game.flags[`aio_${randomStr}`]) {
                                safeStructure.pos.createFlag(`aio_${randomStr}`)
                                this.memory.targetFlag = `aio_${randomStr}`
                            }
                            return
                        }
                    }
                    else {
                        // 自动规避
                        let ranged3Attack = RangeCreep(this.pos, creeps, 3, true)  // 三格内的攻击性爬虫
                        if (ranged3Attack.length > 0) {
                            // 防御塔伤害数据
                            let towerData = global.warData.tower[this.room.name].data
                            let posStr = `${this.pos.x}/${this.pos.y}`
                            let towerHurt = towerData[posStr] ? towerData[posStr]['attack'] : 0
                            if (!canSustain(ranged3Attack, this, towerHurt)) {
                                this.say("危")
                                /* 删除记忆 */
                                if (!this.pos.isNearTo(Game.flags[this.memory.targetFlag])) {
                                    delete this.memory.targetFlag
                                }
                                this.heal(this)
                                let closestHurtCreep = RangeClosestCreep(this.pos, ranged3Attack, true)
                                if (closestHurtCreep) {
                                    this.Flee(closestHurtCreep.pos, 4)
                                }
                            }
                            else {
                                if (!this.pos.isNearTo(pos_)) {
                                    this.goTo_aio(pos_, 1)
                                }
                            }
                        }
                        else {
                            if (!this.pos.isNearTo(pos_)) {
                                this.goTo_aio(pos_, 1)
                            }
                        }
                        // 根据建筑类型判断攻击方式
                        if (isInArray([STRUCTURE_WALL, STRUCTURE_ROAD, STRUCTURE_CONTAINER], stru[0].structureType)) {
                            this.rangedAttack(stru[0])
                        }
                        else {
                            if (stru[0].pos.isNearTo(this)) {
                                this.rangedMassAttack()
                            }
                            else {
                                this.rangedAttack(stru[0])
                            }
                        }
                    }
                }
            }
            let ranged3ramcreep = RangeCreep(this.pos, creeps, 3, false, true)
            // 自动攻击爬虫
            if (ranged3ramcreep.length > 0) {
                if (this.pos.isNearTo(ranged3ramcreep[0])) {
                    this.rangedMassAttack()
                }
                else {
                    this.rangedAttack(ranged3ramcreep[0])
                }
            }
            // 治疗自己和周围友军
            if (this.hits < this.hitsMax) this.heal(this)
            else {
                let allys = this.pos.findInRange(FIND_CREEPS, 3, {
                    filter: (creep) => {
                        return (creep.my || isInArray(Memory.whitesheet, creep.owner.username)) && creep.hitsMax - creep.hits > 350
                    }
                })
                if (allys.length > 0) {
                    // 寻找最近的爬
                    let ally_ = allys[0]
                    for (var i of allys) if (getDistance(this.pos, i.pos) < getDistance(ally_.pos, this.pos)) ally_ = i
                    if (this.pos.isNearTo(ally_)) this.heal(ally_)
                    else this.rangedHeal(ally_)
                }
                else this.heal(this)
            }
            // 寻找最近的敌人攻击
            let closestCreep = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.owner.username) && !creep.pos.GetStructure('rampart') && (!isInArray([0, 49], creep.pos.x) && !isInArray([0, 49], creep.pos.y))
                }
            })
            if (closestCreep && !this.pos.isNearTo(closestCreep)) {
                this.goTo(closestCreep.pos, 3)
            } else {
                /*寻找移动旗帜待命*/
                let withdrawFlag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('automove') == 0
                    }
                })
                if (withdrawFlag && !this.pos.inRangeTo(withdrawFlag.pos, 2)) {
                    this.goTo(withdrawFlag.pos, 1)
                }
            }
        }
    }

    // 四人小队 已经测试 多次跨shard未测试
    public handle_task_squard(): void {
        var data = this.memory.MissionData.Data
        var shard = data.shard          // 目标shard
        var roomName = data.disRoom     // 目标房间名
        var squadID = data.squadID      // 四人小队id
        /* controlledBySquadFrame为true代表不再受任务控制，改为战斗模块控制 */
        if (this.memory.controlledBySquardFrame) {
            /* 说明到达指定房间，并到达合适位置了 */
            /* 添加战争框架控制信息 */
            if (!Memory.squadMemory) Memory.squadMemory = {}
            if (!squadID) { this.say("找不到squardID!"); return }
            if (!Memory.squadMemory[squadID]) {
                Memory.squadMemory[squadID] = {
                    creepData: this.memory.squad,
                    sourceRoom: this.memory.belong,
                    presentRoom: this.room.name,
                    disRoom: data.disRoom,
                    ready: false,
                    array: 'free',
                    sourceShard: this.memory.shard,
                    disShard: this.memory.targetShard,
                    squardType: data.flag
                }
            }
            return
        }
        else {
            /* 任务开始前准备 */
            if (this.room.name == this.memory.belong && this.memory.shard == Game.shard.name) {
                var thisRoom = Game.rooms[this.memory.belong]
                /* boost检查 */
                if (this.getActiveBodyparts('move') > 0) {
                    if (!this.BoostCheck([, 'move'], false)) return
                }
                if (this.getActiveBodyparts('heal') > 0) {
                    if (!this.BoostCheck([, 'heal'], false)) return
                }
                if (this.getActiveBodyparts('work') > 0) {
                    if (!this.BoostCheck([, 'work'], false)) return
                }
                if (this.getActiveBodyparts('attack') > 0) {
                    if (!this.BoostCheck([, 'attack'], false)) return
                }
                if (this.getActiveBodyparts('ranged_attack') > 0) {
                    if (!this.BoostCheck([, 'ranged_attack'], false)) return
                }
                if (this.getActiveBodyparts('tough') > 0) {
                    if (!this.BoostCheck([, 'tough'], false)) return
                }
                /* 组队检查 */
                if (!squadID) return
                if (!this.memory.MissionData.id) return
                if (!thisRoom.memory.squadData) Game.rooms[this.memory.belong].memory.squadData = {}
                let MissonSquardData = thisRoom.memory.squadData[squadID]
                if (!MissonSquardData) thisRoom.memory.squadData[squadID] = {}
                /* 编队信息初始化 */
                if (this.memory.creepType == 'heal' && !this.memory.squad) {
                    if (this.memory.role == 'x-aio') {
                        if (MissonSquardData == null || MissonSquardData == undefined) MissonSquardData = {}
                        if (Object.keys(MissonSquardData).length <= 0) MissonSquardData[this.name] = { position: '↙', index: 1, role: this.memory.role, creepType: this.memory.creepType }
                        if (Object.keys(MissonSquardData).length == 1 && !isInArray(Object.keys(MissonSquardData), this.name)) MissonSquardData[this.name] = { position: '↖', index: 0, role: this.memory.role, creepType: this.memory.creepType }
                        if (Object.keys(MissonSquardData).length == 2 && !isInArray(Object.keys(MissonSquardData), this.name)) MissonSquardData[this.name] = { position: '↘', index: 3, role: this.memory.role, creepType: this.memory.creepType }
                        if (Object.keys(MissonSquardData).length == 3 && !isInArray(Object.keys(MissonSquardData), this.name)) MissonSquardData[this.name] = { position: '↗', index: 2, role: this.memory.role, creepType: this.memory.creepType }
                    }
                    else {
                        if (MissonSquardData == null || MissonSquardData == undefined) MissonSquardData = {}
                        if (Object.keys(MissonSquardData).length <= 0) MissonSquardData[this.name] = { position: '↙', index: 1, role: this.memory.role, creepType: this.memory.creepType }
                        if (Object.keys(MissonSquardData).length == 2 && !isInArray(Object.keys(MissonSquardData), this.name)) MissonSquardData[this.name] = { position: '↘', index: 3, role: this.memory.role, creepType: this.memory.creepType }
                    }
                }
                else if (this.memory.creepType == 'attack' && !this.memory.squad) {
                    if (MissonSquardData == null || MissonSquardData == undefined) MissonSquardData = {}
                    if (Object.keys(MissonSquardData).length == 1 && !isInArray(Object.keys(MissonSquardData), this.name)) MissonSquardData[this.name] = { position: '↖', index: 0, role: this.memory.role, creepType: this.memory.creepType }
                    if (Object.keys(MissonSquardData).length == 3 && !isInArray(Object.keys(MissonSquardData), this.name)) MissonSquardData[this.name] = { position: '↗', index: 2, role: this.memory.role, creepType: this.memory.creepType }
                }
                if (Object.keys(thisRoom.memory.squadData[squadID]).length == 4 && !this.memory.squad) {
                    console.log(`[squad] 房间${this.memory.belong}ID为:${squadID}的四人小队数量已经到位!将从房间分发组队数据!`)
                    this.memory.squad = thisRoom.memory.squadData[squadID]
                    return
                }
                /* 检查是否所有爬虫都赋予记忆了 */
                if (!this.memory.squad) return
                for (var mem in this.memory.squad) {
                    if (!Game.creeps[mem]) return
                    if (!Game.creeps[mem].memory.squad) return
                }
                /* 爬虫都被赋予了组队数据了，就删除房间内的原始数据 */
                if (thisRoom.memory.squadData[squadID]) delete thisRoom.memory.squadData[squadID]
            }
            /* 在到达任务房间的隔壁房间前，默认攻击附近爬虫 */
            if (this.getActiveBodyparts('ranged_attack')) {
                let enemy = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username)
                    }
                })
                if (enemy.length > 0) {
                    for (let enemy_ of enemy) {
                        if (enemy_.pos.isNearTo(this)) this.rangedMassAttack()
                    }
                    this.rangedAttack(enemy[0])
                }
            }
            /* 在到达任务房间的隔壁房间前，默认治疗附近爬虫 */
            if (this.getActiveBodyparts('heal')) {
                var bol = true
                for (var i in this.memory.squad) {
                    if (Game.creeps[i] && Game.creeps[i].hits < Game.creeps[i].hitsMax && this.pos.isNearTo(Game.creeps[i])) {
                        bol = false
                        this.heal(Game.creeps[i])
                    }
                }
                if (bol) this.heal(this)
            }
            /* 线性队列行走规则: 有成员疲劳就停止行走 */
            for (var cc in this.memory.squad) {
                if (Game.creeps[cc] && Game.creeps[cc].fatigue) return
            }
            /* 编号为 0 1 2 的爬需要遵守的规则 */
            if (this.memory.squad[this.name].index != 3 && (!isInArray([0, 49], this.pos.x) && !isInArray([0, 49], this.pos.y))) {
                var followCreepName = findNextData(this)
                if (followCreepName == null) return
                var portal = this.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'portal'
                    }
                })
                var followCreep = Game.creeps[followCreepName]
                if (!followCreep && portal) { return }
                if (followCreep) {
                    // 跟随爬不靠在一起就等一等
                    if (!this.pos.isNearTo(followCreep)) {
                        return;
                    }
                }
            }
            /* 编号为 1 2 3 的爬需要遵守的规则 */
            if (this.memory.squad[this.name].index != 0) {
                var disCreepName = findFollowData(this)
                var portal = this.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == 'portal'
                    }
                })
                // 跨shard信息更新 可以防止一些可能出现的bug
                if (portal && data.shardData) {
                    this.updateShardAffirm()
                }
                if (disCreepName == null || (!Game.creeps[disCreepName] && !portal)) return
                if (!Game.creeps[disCreepName] && portal) {
                    this.arriveTo(new RoomPosition(24, 24, roomName), 20, shard, data.shardData ? data.shardData : null);
                    return
                }
                if (Game.shard.name == shard && !Game.creeps[disCreepName]) return
                var disCreep = Game.creeps[disCreepName]
                if (this.room.name == this.memory.belong) this.goTo(disCreep.pos, 0)
                else this.moveTo(disCreep)
                return
            }
            // 接下来在门口自动组队
            if (this.memory.squad[this.name].index == 0) {
                /* 判断在不在目标房间入口房间 */
                if (Game.flags[`squad_unit_${this.memory.MissionData.id}`]) {
                    // 有集结旗帜的情况下，优先前往目标房间
                    if (this.room.name != Game.flags[`squad_unit_${this.memory.MissionData.id}`].pos.roomName || Game.shard.name != data.shard) {
                        if (this.memory.squad[this.name].index == 0)
                            this.arriveTo(new RoomPosition(24, 24, roomName), 18, shard, data.shardData ? data.shardData : null)
                        return
                    }
                }
                else {
                    // 没有集结旗帜的情况下，自动判断
                    if (identifyNext(this.room.name, roomName) == false || Game.shard.name != data.shard) {
                        this.say("🔪")

                        if (this.memory.squad[this.name].index == 0)
                            // console.log('四人小队移动',this.name,roomName)
                            this.arriveTo(new RoomPosition(24, 24, roomName), 18, shard, data.shardData ? data.shardData : null)
                        return
                    }
                }
                this.say('⚔️', true)
                if (!this.memory.arrived) {
                    if (Game.flags[`squad_unit_${this.memory.MissionData.id}`]) {
                        // 有旗帜的情况下，如果到达旗帜附近，就判定arrived为true
                        if (!this.pos.isEqualTo(Game.flags[`squad_unit_${this.memory.MissionData.id}`]))
                            this.goTo(Game.flags[`squad_unit_${this.memory.MissionData.id}`].pos, 0)
                        else
                            this.memory.arrived = true
                    }
                    else {
                        // 没有旗帜的情况下，到入口前5格组队
                        if (RoomInRange(this.pos, roomName, 5)) {
                            this.memory.arrived = true
                        }
                        else {
                            this.arriveTo(new RoomPosition(24, 24, roomName), 24, shard, data.shardData ? data.shardData : null)
                        }
                    }
                }
                else {
                    // 能组队就组队 否则就继续走
                    if (identifyGarrison(this))
                        for (var crp in this.memory.squad) {
                            if (Game.creeps[crp])
                                Game.creeps[crp].memory.controlledBySquardFrame = true
                        }
                    else {
                        this.arriveTo(new RoomPosition(24, 24, roomName), 24, shard, data.shardData ? data.shardData : null)
                    }
                }
            }

        }
    }

    // 紧急支援 已经修改，但未作充分测试 可能有bug
    public handle_support(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        var roomName = data.disRoom
        if (this.room.name == this.memory.belong && data.boost) {
            if (this.memory.role == 'double-attack') {
                if (!this.BoostCheck(['move', 'attack', 'tough'])) return
            }
            else if (this.memory.role == 'double-heal') {
                if (!this.BoostCheck(['move', 'heal', 'ranged_attack', 'tough'])) return
            }
            else if (this.memory.role == 'aio') {
                if (!this.BoostCheck(['move', 'heal', 'ranged_attack', 'tough'])) return
            }
        }
        if (this.memory.role != 'aio' && !this.memory.double) {
            if (this.memory.role == 'double-heal') {
                /* 由heal来进行组队 */
                if (Game.time % 7 == 0) {
                    var disCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (creep) => {
                            return creep.memory.role == 'double-attack' && !creep.memory.double
                        }
                    })
                    if (disCreep) {
                        this.memory.double = disCreep.name
                        disCreep.memory.double = this.name
                        this.memory.captain = false
                        disCreep.memory.captain = true
                    }
                }
            }
            return
        }
        if (this.memory.role == 'double-attack') {
            if (!Game.creeps[this.memory.double]) return
            if (this.fatigue || Game.creeps[this.memory.double].fatigue) return
            if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double]) && (!isInArray([0, 49], this.pos.x) && !isInArray([0, 49], this.pos.y)))
                return
            /* 去目标房间 */
            if (this.room.name != roomName || Game.shard.name != data.shard) {
                this.arriveTo(new RoomPosition(24, 24, roomName), 23, data.shard, data.shardData ? data.shardData : null)
            }
            else {
                let creeps = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username)
                    }
                })
                if (creeps) {
                    if (this.attack(creeps) == ERR_NOT_IN_RANGE) this.goTo(creeps.pos, 1)
                }
                else {
                    this.goTo(new RoomPosition(24, 24, data.disRoom), 10)
                }
                // 支援旗帜 support_double
                let flag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('support_double') == 0
                    }
                })
                if (flag) {
                    let creeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                        filter: (creep) => {
                            return !isInArray(Memory.whitesheet, creep.owner.username)
                        }
                    })
                    if (creeps[0]) this.attack(creeps[0])
                    this.goTo(flag.pos, 0)
                    return
                }
                // 攻击建筑
                let attack_flag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('support_structure') == 0
                    }
                })
                if (attack_flag) {
                    if (attack_flag.pos.lookFor(LOOK_STRUCTURES).length > 0) {
                        if (this.attack(attack_flag.pos.lookFor(LOOK_STRUCTURES)[0]) == ERR_NOT_IN_RANGE) this.goTo(creeps.pos, 1)
                    }
                    else attack_flag.remove()
                }
            }
        }
        if (this.memory.role == 'double-heal') {
            var disCreepName = this.memory.double
            var portal = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (stru) => {
                    return stru.structureType == 'portal'
                }
            })
            // 跨shard信息更新 可以防止一些可能出现的bug
            if (portal && data.shardData) {
                this.updateShardAffirm()
            }
            if (!Game.creeps[disCreepName] && portal) { this.arriveTo(new RoomPosition(25, 25, roomName), 20, data.shard, data.shardData ? data.shardData : null); return }
            if (Game.creeps[this.memory.double]) this.moveTo(Game.creeps[this.memory.double])
            // 寻找敌人 远程攻击
            let enemy = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.owner.username)
                }
            })
            if (enemy[0]) this.rangedAttack(enemy[0])
            // 奶
            if (Game.creeps[this.memory.double]) {
                if (this.hits < this.hitsMax || Game.creeps[this.memory.double].hits < Game.creeps[this.memory.double].hitsMax) {
                    if (this.hits < Game.creeps[this.memory.double].hits) this.heal(this)
                    else {
                        if (this.pos.isNearTo(Game.creeps[this.memory.double])) this.heal(Game.creeps[this.memory.double])
                        else this.rangedHeal(Game.creeps[this.memory.double])
                    }
                    return
                }
            }
            // 默认治疗攻击爬，如果周围有友军，在自身血量满的情况下治疗友军
            let allys = this.pos.findInRange(FIND_CREEPS, 3, {
                filter: (creep) => {
                    return (creep.my || isInArray(Memory.whitesheet, creep.owner.username)) && creep.hitsMax - creep.hits > 350
                }
            })
            if (allys.length > 0) {
                // 寻找最近的爬
                let ally_ = allys[0]
                for (var i of allys) if (getDistance(this.pos, i.pos) < getDistance(ally_.pos, this.pos)) ally_ = i
                if (this.pos.isNearTo(ally_)) this.heal(ally_)
                else this.rangedHeal(ally_)
            }
            else {
                if (Game.creeps[this.memory.double]) this.heal(Game.creeps[this.memory.double])
                else this.heal(this)
            }
        }
        if (this.memory.role == 'saio') {
            if (this.room.name != roomName || Game.shard.name != data.shard) {
                this.heal(this)
                this.arriveTo(new RoomPosition(24, 24, roomName), 23, data.shard, data.shardData ? data.shardData : null)
            }
            else {
                // 寻找敌人 远程攻击
                let enemy = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username)
                    }
                })
                let disenemy = null
                for (var e of enemy) {
                    if (!e.pos.GetStructure('rampart')) disenemy = e
                }
                if (disenemy) {
                    if (this.pos.isNearTo(disenemy)) this.rangedMassAttack()
                    else if (this.pos.inRangeTo(disenemy, 3)) this.rangedAttack(disenemy)
                }
                // 治疗自己和周围友军
                if (this.hits < this.hitsMax) this.heal(this)
                else {
                    let allys = this.pos.findInRange(FIND_CREEPS, 3, {
                        filter: (creep) => {
                            return (creep.my || isInArray(Memory.whitesheet, creep.owner.username)) && creep.hitsMax - creep.hits > 350
                        }
                    })
                    if (allys.length > 0) {
                        // 寻找最近的爬
                        let ally_ = allys[0]
                        for (var i of allys) if (getDistance(this.pos, i.pos) < getDistance(ally_.pos, this.pos)) ally_ = i
                        if (this.pos.isNearTo(ally_)) this.heal(ally_)
                        else this.rangedHeal(ally_)
                    }
                    else this.heal(this)
                }
                // 移动旗
                let move_flag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('support_aio') == 0
                    }
                })
                if (move_flag) {
                    this.heal(this)
                    this.goTo(move_flag.pos, 1)
                    return
                }
                // 放风筝 计算自己奶量 敌对爬伤害
                if (enemy.length > 0 && !canSustain(enemy, this)) {
                    // 放风筝 寻找最近的有攻击性的爬 离他远点
                    let closestAttackCreep = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                        filter: (creep) => {
                            return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.getActiveBodyparts('attack') > 0 || creep.getActiveBodyparts('ranged_attack') > 0)
                        }
                    })
                    if (closestAttackCreep) this.Flee(closestAttackCreep.pos, 3)
                    return
                }
                // 寻找最近的敌人攻击
                let closestCreep = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username) && !creep.pos.GetStructure('rampart')
                    }
                })
                if (closestCreep && !this.pos.isNearTo(closestCreep)) {
                    this.goTo(closestCreep.pos, 3)
                }
            }
        }
    }

    // 双人小队 已测试 目前没有挂载战争信息模块和智能躲避
    public handle_double(): void {
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        var roomName = data.disRoom
        if (this.room.name == this.memory.belong) {
            if (this.memory.role == 'double-attack') {
                if (!this.BoostCheck(['move', 'attack', 'tough'])) return
            }
            else if (this.memory.role == 'double-heal') {
                if (!this.BoostCheck(['move', 'heal', 'ranged_attack', 'tough'])) return
            }
            else if (this.memory.role == 'double-dismantle') {
                if (!this.BoostCheck(['move', 'work', 'tough'])) return
            }
        }
        if (!this.memory.double) {
            if (this.memory.role == 'double-heal') {
                /* 由heal来进行组队 */
                if (Game.time % 7 == 0) {
                    if (data.teamType == 'attack')
                        var disCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                            filter: (creep) => {
                                return creep.memory.role == 'double-attack' && !creep.memory.double
                            }
                        })
                    else if (data.teamType == 'dismantle')
                        var disCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                            filter: (creep) => {
                                return creep.memory.role == 'double-dismantle' && !creep.memory.double
                            }
                        })
                    else return
                    if (disCreep) {
                        this.memory.double = disCreep.name
                        disCreep.memory.double = this.name
                        this.memory.captain = false
                        disCreep.memory.captain = true
                    }
                }
            }
            return
        }
        if (this.memory.role == 'double-attack') {
            if (!Game.creeps[this.memory.double]) return
            if (this.fatigue || Game.creeps[this.memory.double].fatigue) return
            if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double]) && (!isInArray([0, 49], this.pos.x) && !isInArray([0, 49], this.pos.y)))
                return
            if (this.room.name != roomName || Game.shard.name != data.shard) {
                this.arriveTo(new RoomPosition(24, 24, roomName), 23, data.shard, data.shardData ? data.shardData : null)
            }
            else {
                // 对方开安全模式情况下 删除任务
                if (this.room.controller && this.room.controller.safeMode) {
                    if (Game.shard.name == this.memory.shard) {
                        Game.rooms[this.memory.belong].DeleteMission(id)
                    }
                    return
                }
                warDataInit(Game.rooms[data.disRoom])

                // 没有发现敌人就攻击建筑物
                let attack_flag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('double_attack') == 0
                    }
                })
                if (!attack_flag) {
                    /* 攻击离四格内离自己最近的爬 */
                    var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                        filter: (creep) => {
                            return !isInArray(Memory.whitesheet, creep.owner.username) && !creep.pos.GetStructure('rampart') && (!isInArray([0, 49], creep.pos.x) && !isInArray([0, 49], creep.pos.y))
                        }
                    })
                    if (enemy && Math.max(Math.abs(this.pos.x - enemy.pos.x), Math.abs(this.pos.y - enemy.pos.y)) <= 4) {
                        this.goTo(enemy.pos, 1)
                        this.attack(enemy)
                        return
                    }
                }
                if (!attack_flag) {
                    var Attstructure = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (stru) => {
                            return isInArray(['nuker', 'spawn', 'terminal', 'extension', 'tower', 'link', 'observer', 'lab', 'powerspawn', 'factory'], stru.structureType) && !stru.pos.GetStructure('rampart')
                        }
                    })
                    if (Attstructure) {
                        let randomStr = Math.random().toString(36).substr(3)
                        if (!Game.flags[`double_attack_${randomStr}`])
                            Attstructure.pos.createFlag(`double_attack_${randomStr}`)
                    }
                }
                if (!attack_flag) {
                    // 还找不到就找重要的被ram覆盖的重要建筑攻击
                    var CoverStructure = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType == 'rampart' && stru.pos.GetStructureList(['spawn', 'tower', 'storage', 'terminal']).length > 0
                        }
                    })
                    if (CoverStructure) {
                        this.say("⚔️", true)
                        if (this.attack(CoverStructure) == ERR_NOT_IN_RANGE) this.goTo(CoverStructure.pos, 1)
                        return
                    }
                    // 还找不到就直接找最近的wall或者rampart攻击
                    var walls = this.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (stru) => {
                            return isInArray([STRUCTURE_RAMPART], stru.structureType)
                        }
                    })
                    if (walls) {
                        this.say("⚔️", true)
                        if (this.attack(walls) == ERR_NOT_IN_RANGE) this.goTo(walls.pos, 1)
                        return
                    }
                }
                else {
                    // 有旗子就攻击旗子下的建筑
                    let stru = attack_flag.pos.lookFor(LOOK_STRUCTURES)
                    if (stru.length > 0) {
                        if (this.attack(stru[0]) == ERR_NOT_IN_RANGE) this.goTo(stru[0].pos, 1)
                        return
                    }
                    attack_flag.remove()    // 没有建筑就删除旗帜
                }
            }
        }
        else if (this.memory.role == 'double-dismantle') {
            if (!Game.creeps[this.memory.double]) return
            if (this.fatigue || Game.creeps[this.memory.double].fatigue) return
            if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double]) && (!isInArray([0, 49], this.pos.x) && !isInArray([0, 49], this.pos.y)))
                return
            if (this.room.name != roomName || Game.shard.name != data.shard) {
                this.arriveTo(new RoomPosition(24, 24, roomName), 23, data.shard, data.shardData ? data.shardData : null)
            }
            else {
                // 对方开安全模式情况下 删除任务
                if (this.room.controller && this.room.controller.safeMode) {
                    if (Game.shard.name == this.memory.shard) {
                        Game.rooms[this.memory.belong].DeleteMission(id)
                    }
                    return
                }
                // 开始拆墙
                let attack_flag = this.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag) => {
                        return flag.name.indexOf('double_dismantle') == 0
                    }
                })
                if (!attack_flag) {
                    var Attstructure = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (stru) => {
                            return isInArray(['nuker', 'spawn', 'terminal', 'extension', 'tower', 'link', 'observer', 'lab', 'powerspawn', 'factory'], stru.structureType) && !stru.pos.GetStructure('rampart')
                        }
                    })
                    if (Attstructure) {
                        let randomStr = Math.random().toString(36).substr(3)
                        if (!Game.flags[`double_dismantle_${randomStr}`])
                            Attstructure.pos.createFlag(`double_dismantle_${randomStr}`)
                    }
                }
                if (!attack_flag) {
                    // 还找不到就找重要的被ram覆盖的重要建筑攻击
                    var CoverStructure = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (stru) => {
                            return stru.structureType == 'rampart' && stru.pos.GetStructureList(['spawn', 'tower', 'storage', 'terminal']).length > 0
                        }
                    })
                    if (CoverStructure) {
                        this.say("⚔️", true)
                        if (this.dismantle(CoverStructure) == ERR_NOT_IN_RANGE) this.goTo(CoverStructure.pos, 1)
                        return
                    }
                    // 还找不到就直接找最近的wall或者rampart攻击
                    var walls = this.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (stru) => {
                            return isInArray([STRUCTURE_WALL, STRUCTURE_RAMPART], stru.structureType)
                        }
                    })
                    if (walls) {
                        this.say("⚔️", true)
                        if (this.dismantle(walls) == ERR_NOT_IN_RANGE) this.goTo(walls.pos, 1)
                        return
                    }
                }
                else {
                    // 有旗子就攻击旗子下的建筑
                    let stru = attack_flag.pos.lookFor(LOOK_STRUCTURES)
                    if (stru.length > 0) {
                        if (this.dismantle(stru[0]) == ERR_NOT_IN_RANGE) this.goTo(stru[0].pos, 1)
                        return
                    }
                    attack_flag.remove()    // 没有建筑就删除旗帜
                }
            }
        }
        else {
            var disCreepName = this.memory.double
            var portal = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (stru) => {
                    return stru.structureType == 'portal'
                }
            })
            // 跨shard信息更新 可以防止一些可能出现的bug
            if (portal && data.shardData) {
                this.updateShardAffirm()
            }
            if (!Game.creeps[disCreepName] && portal) { this.arriveTo(new RoomPosition(25, 25, roomName), 20, data.shard, data.shardData ? data.shardData : null); return }
            if (Game.creeps[this.memory.double]) this.moveTo(Game.creeps[this.memory.double])
            // 寻找敌人 远程攻击
            let enemy = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.owner.username)
                }
            })
            if (enemy[0]) this.rangedAttack(enemy[0])
            // 奶
            if (Game.creeps[this.memory.double]) {
                if (this.hits < this.hitsMax || Game.creeps[this.memory.double].hits < Game.creeps[this.memory.double].hitsMax) {
                    if (this.hits < Game.creeps[this.memory.double].hits) this.heal(this)
                    else {
                        if (this.pos.isNearTo(Game.creeps[this.memory.double])) this.heal(Game.creeps[this.memory.double])
                        else this.rangedHeal(Game.creeps[this.memory.double])
                    }
                    return
                }
            }
            // 默认治疗攻击爬，如果周围有友军，在自身血量满的情况下治疗友军
            let allys = this.pos.findInRange(FIND_CREEPS, 3, {
                filter: (creep) => {
                    return (creep.my || isInArray(Memory.whitesheet, creep.owner.username)) && creep.hitsMax - creep.hits > 350
                }
            })
            if (allys.length > 0) {
                // 寻找最近的爬
                let ally_ = allys[0]
                for (var i of allys) if (getDistance(this.pos, i.pos) < getDistance(ally_.pos, this.pos)) ally_ = i
                if (this.pos.isNearTo(ally_)) this.heal(ally_)
                else this.rangedHeal(ally_)
            }
            else {
                if (Game.creeps[this.memory.double]) this.heal(Game.creeps[this.memory.double])
                else this.heal(this)
            }
        }
    }
}