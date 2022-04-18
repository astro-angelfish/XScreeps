import { filter } from 'lodash'
import structure from '@/mount/structure'
import { GenerateAbility, filter_structure, generateID, isInArray, unzipPosition, zipPosition } from '@/utils'

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissionActionExtension extends Creep {
  // 刷墙
  public handle_repair(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const mission = Game.rooms[this.memory.belong].getMissionById(id)
    if (!id)
      return
    let storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.storageID) as StructureStorage
    this.workstate('energy')
    /* boost检查 */
    if (mission.labBind) {
      if (!storage_)
        return // 如果是boost的，没有仓库就不刷了
      // 需要boost检查，必要情况下可以不检查
      let boo = false
      for (const ids in mission.labBind) {
        const lab_ = Game.getObjectById(ids) as StructureLab
        if (!lab_ || !lab_.mineralType || lab_.store.getUsedCapacity(lab_.mineralType) < 500)
          boo = true
      }
      if (!boo) {
        if (!this.BoostCheck(['work']))
          return
      }
    }
    if (mission.data.RepairType == 'global') {
      if (this.memory.working) {
        if (this.memory.targetID) {
          this.say('🛠️')
          var target_ = Game.getObjectById(this.memory.targetID) as StructureRampart
          if (!target_) { delete this.memory.targetID; return }
          this.repair_(target_)
        }
        else {
          var leastRam = this.room.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
          if (!leastRam)
            return
          this.memory.targetID = leastRam.id
        }
        delete this.memory.containerID
      }
      else {
        /* 寻找hits最小的墙 */
        var leastRam = this.room.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
        if (!leastRam)
          return
        this.memory.targetID = leastRam.id
        if (!this.memory.containerID) {
          var tank = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (stru) => {
              return stru.structureType == 'storage'
                        || (stru.structureType == 'link' && isInArray(Game.rooms[this.memory.belong].memory.structureIdData.consumeLink, stru.id) && stru.store.getUsedCapacity('energy') > this.store.getCapacity())
            },
          })
          if (tank) { this.memory.containerID = tank.id }
          else {
            const closestStore = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: (stru) => { return (stru.structureType == 'container' || stru.structureType == 'tower') && stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity() } })
            if (closestStore)
              this.withdraw_(closestStore, 'energy')
            return
          }
        }
        const tank_ = Game.getObjectById(this.memory.containerID) as StructureStorage
        this.withdraw_(tank_, 'energy')
      }
    }
    else if (mission.data.RepairType == 'nuker') {
      // 没有仓库和终端就不防了
      if (!storage_) {
        delete Game.rooms[this.memory.belong].memory.structureIdData.storageID
        storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.terminalID) as StructureStorage
        return
      }
      if (!storage_)
        return
      // 核弹防御
      /* 防核函数  测试成功！ */
      if (!Game.rooms[this.memory.belong].memory.nukeData)
        return
      if (Object.keys(Game.rooms[this.memory.belong].memory.nukeData.damage).length <= 0) {
        Game.rooms[this.memory.belong].removeMission(id)
        return
      }
      /* 优先修spawn和terminal */
      if (!this.memory.targetID) {
        for (const dmgPoint in Game.rooms[this.memory.belong].memory.nukeData.damage) {
          if (Game.rooms[this.memory.belong].memory.nukeData.damage[dmgPoint] <= 0)
            continue
          const position_ = unzipPosition(dmgPoint)
          if (!position_.GetStructure('rampart')) {
            position_.createConstructionSite('rampart')
            if (!this.memory.working)
              this.withdraw_(storage_, 'energy')
            else this.build_(position_.lookFor(LOOK_CONSTRUCTION_SITES)[0])
            return
          }
          this.memory.targetID = position_.GetStructure('rampart').id
          return
        }
        if (!Game.rooms[this.memory.belong].removeMission(id))
          this.memory.missionData = {}
      }
      else {
        if (!this.memory.working) {
          this.memory.standed = false
          this.withdraw_(storage_, 'energy')
        }
        else {
          this.memory.standed = false
          if (this.memory.crossLevel > 10)
            this.memory.crossLevel = 10 - Math.ceil(Math.random() * 10)
          const wall_ = Game.getObjectById(this.memory.targetID) as StructureRampart
          const strPos = zipPosition(wall_.pos)
          if (!wall_ || wall_.hits >= Game.rooms[this.memory.belong].memory.nukeData.damage[strPos] + Game.rooms[this.memory.belong].memory.nukeData.rampart[strPos] + 500000) {
            delete this.memory.targetID
            Game.rooms[this.memory.belong].memory.nukeData.damage[strPos] = 0
            Game.rooms[this.memory.belong].memory.nukeData.rampart[strPos] = 0
            return
          }
          if (this.repair(wall_) == ERR_NOT_IN_RANGE)
            this.goTo(wall_.pos, 3)
        }
      }
    }
    else if (mission.data.RepairType == 'special') {
      if (this.memory.working) {
        if (this.memory.targetID) {
          this.say('🛠️')
          var target_ = Game.getObjectById(this.memory.targetID) as StructureRampart
          if (!target_) { delete this.memory.targetID; return }
          this.repair_(target_)
        }
        else {
          var leastRam = this.room.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
          if (!leastRam)
            return
          this.memory.targetID = leastRam.id
        }
        delete this.memory.containerID
      }
      else {
        /* 寻找插了旗子的hits最小的墙 */
        const flags = this.room.find(FIND_FLAGS, {
          filter: (flag) => {
            return flag.name.indexOf('repair') == 0
          },
        })
        if (flags.length <= 0)
          return
        let disWall = null
        for (const f of flags) {
          const fwall = f.pos.getStructureList(['rampart', 'constructedWall'])[0]
          if (!fwall) { f.remove() }
          else {
            if (!disWall || fwall.hits < disWall.hits)
              disWall = fwall
          }
        }
        if (!disWall) {
          // 没有旗子就删除任务
          Game.rooms[this.memory.belong].removeMission(id)
          return
        }
        this.memory.targetID = disWall.id
        if (!this.memory.containerID) {
          var tank = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (stru) => {
              return stru.structureType == 'storage'
                        || (stru.structureType == 'link' && isInArray(Game.rooms[this.memory.belong].memory.structureIdData.consumeLink, stru.id) && stru.store.getUsedCapacity('energy') > this.store.getCapacity())
            },
          })
          if (tank) { this.memory.containerID = tank.id }
          else {
            const closestStore = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: (stru) => { return (stru.structureType == 'container' || stru.structureType == 'tower') && stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity() } })
            if (closestStore)
              this.withdraw_(closestStore, 'energy')
            return
          }
        }
        const tank_ = Game.getObjectById(this.memory.containerID) as StructureStorage
        this.withdraw_(tank_, 'energy')
      }
    }
  }

  // C计划
  public handle_planC(): void {
    const mission = this.memory.missionData
    // if (Game.rooms[mission.Data.disRoom] && !Game.rooms[mission.Data.disRoom].controller.safeMode) Game.rooms[mission.Data.disRoom].controller.activateSafeMode()
    if (this.memory.role == 'cclaim') {
      if (this.room.name != mission.Data.disRoom || Game.shard.name != mission.Data.shard) {
        this.arriveTo(new RoomPosition(25, 25, mission.Data.disRoom), 20, mission.Data.shard)
      }
      else {
        if (!this.pos.isNearTo(this.room.controller)) { this.goTo(this.room.controller.pos, 1) }
        else {
          if (!this.room.controller.owner)
            this.claimController(this.room.controller)
          this.signController(this.room.controller, 'better to rua BB cat at home!')
        }
      }
    }
    else {
      this.workstate('energy')
      if (this.room.name == this.memory.belong && !this.memory.working) {
        const store = this.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (stru) => {
            return (stru.structureType == 'container'
                    || stru.structureType == 'tower'
                    || stru.structureType == 'storage') && stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity()
          },
        })
        if (store)
          this.withdraw_(store, 'energy')

        return
      }
      if (!Game.rooms[mission.Data.disRoom]) {
        this.goTo(new RoomPosition(25, 25, mission.Data.disRoom), 20)
        return
      }
      if (Game.rooms[mission.Data.disRoom].controller.level >= 2)
        global.SpecialBodyData[this.memory.belong].cupgrade = GenerateAbility(1, 1, 1, 0, 0, 0, 0, 0)

      if (this.memory.working) {
        if (this.room.name != mission.Data.disRoom) {
          this.goTo(Game.rooms[mission.Data.disRoom].controller.pos, 1)
          return
        }
        const cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (cons) { this.build_(cons) }
        else { this.upgrade_(); this.say('cupgrade') }
      }
      else {
        const source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
        if (source)
          this.harvest_(source)
      }
    }
  }

  // 扩张援建
  public handle_expand(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    if (this.room.name != missionData.Data.disRoom || Game.shard.name != missionData.Data.shard) {
      this.arriveTo(new RoomPosition(24, 24, missionData.Data.disRoom), 20, missionData.Data.shard, missionData.Data.shardData ? missionData.Data.shardData : null)
      return
    }
    this.workstate('energy')
    if (this.memory.role == 'claim') {
      if (!this.pos.isNearTo(Game.rooms[missionData.Data.disRoom].controller)) { this.goTo(Game.rooms[missionData.Data.disRoom].controller.pos, 1) }
      else {
        this.claimController(Game.rooms[missionData.Data.disRoom].controller)
        this.say('claim')
      }
      if (missionData.Data.shard == this.memory.shard) {
        if (Game.rooms[missionData.Data.disRoom].controller.level && Game.rooms[missionData.Data.disRoom].controller.owner) {
          const mission = Game.rooms[this.memory.belong].getMissionById(id)
          if (!mission)
            return
          mission.creepBind[this.memory.role].num = 0
        }
      }
    }
    else if (this.memory.role == 'Ebuild') {
      if (this.memory.working) {
        /* 优先遭建筑 */
        const cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (cons) {
          this.build_(cons)
          return
        }
        const roads = this.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (stru) => {
            return (stru.structureType == 'road' || stru.structureType == 'container') && stru.hits < stru.hitsMax
          },
        })
        if (roads) {
          this.repair_(roads)
          return
        }
        const tower = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (stru) => {
            return stru.structureType == 'tower' && stru.store.getFreeCapacity('energy') > 0
          },
        })
        if (tower) {
          this.transfer_(tower, 'energy')
          return
        }
        const store = this.pos.getClosestStore()
        if (store) {
          this.transfer_(store, 'energy')
          return
        }
        this.upgrade_()
      }
      else {
        const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
        if (source)
          this.harvest_(source)
        if (this.ticksToLive < 120 && this.store.getUsedCapacity('energy') <= 20)
          this.suicide()
      }
    }
    else if (this.memory.role == 'Eupgrade') {
      if (this.memory.working) {
        this.say('upgrade')
        this.upgrade_()
      }
      else {
        const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
        if (source)
          this.harvest_(source)
        if (this.ticksToLive < 120 && this.store.getUsedCapacity('energy') <= 20)
          this.suicide()
      }
    }
  }

  // 急速冲级
  public handle_quickRush(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const mission = Game.rooms[this.memory.belong].getMissionById(id)
    if (!mission)
      return
    // boost检查
    if (mission.labBind && !this.BoostCheck(['work']))
      return
    this.workstate('energy')
    const terminal_ = global.structureCache[this.memory.belong].terminal as StructureTerminal
    if (!terminal_) { this.say('找不到terminal!'); return }
    if (this.memory.working) {
      this.upgrade_()
      if (this.store.getUsedCapacity('energy') < 35 && terminal_.pos.isNearTo(this))
        this.withdraw_(terminal_, 'energy')
    }
    else {
      this.withdraw_(terminal_, 'energy')
    }
    this.memory.standed = mission.data.standed
  }

  // 紧急援建
  public handle_helpBuild(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data
    if (!missionData)
      return
    if (this.room.name == this.memory.belong && Game.shard.name == this.memory.shard) {
      if (!this.BoostCheck(['move', 'work', 'heal', 'tough', 'carry']))
        return
      if (this.store.getUsedCapacity('energy') <= 0) {
        const stroge_ = global.structureCache[this.memory.belong].storage as StructureStorage
        if (stroge_) {
          this.withdraw_(stroge_, 'energy')
          return
        }
      }
    }
    if ((this.room.name != data.disRoom || Game.shard.name != data.shard) && !this.memory.swith) {
      this.heal(this)
      this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
    }
    else {
      this.memory.swith = true
      const runFlag = this.pos.findClosestByRange(FIND_FLAGS, {
        filter: (flag) => {
          return flag.color == COLOR_BLUE
        },
      })
      if (runFlag) {
        this.goTo(runFlag.pos, 0)
        return
      }
      this.workstate('energy')
      if (this.memory.working) {
        if (this.room.name != data.disRoom) { this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard); return }
        if (this.hits < this.hitsMax)
          this.heal(this)

        if (this.room.name != data.disRoom) { this.goTo(new RoomPosition(24, 24, data.disRoom), 23); return }
        const cons = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
        if (cons)
          this.build_(cons)
      }
      else {
        // 以withdraw开头的旗帜  例如： withdraw_0
        const withdrawFlag = this.pos.findClosestByPath(FIND_FLAGS, {
          filter: (flag) => {
            return flag.name.indexOf('withdraw') == 0
          },
        })
        if (withdrawFlag) {
          const tank_ = withdrawFlag.pos.getStructureList(['storage', 'terminal', 'container', 'tower'])
          if (tank_.length > 0) { this.withdraw_(tank_[0], 'energy'); return }
        }
        const harvestFlag = Game.flags[`${this.memory.belong}/HB/harvest`]
        if (harvestFlag) {
          if (this.hits < this.hitsMax)
            this.heal(this)

          if (this.room.name != harvestFlag.pos.roomName) {
            this.goTo(harvestFlag.pos, 1)
          }
          else {
            const source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
            if (source)
              this.harvest_(source)
          }
          return
        }
        const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
        if (source)
          this.harvest_(source)
      }
    }
  }

  // 房间签名
  public handle_sign(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data
    if (!missionData)
      return
    if (this.room.name != data.disRoom || Game.shard.name != data.shard) {
      this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData ? data.shardData : null)
    }
    else {
      const control = this.room.controller
      if (control) {
        if (!this.pos.isNearTo(control))
          this.goTo(control.pos, 1)
        else this.signController(control, data.str)
        if (control.sign == data.str)
          Game.rooms[this.memory.belong].removeMission(id)
      }
    }
  }

  /* 原矿开采任务处理 */
  public handle_mineral(): void {
    const extractor = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.extractorID) as StructureExtractor
    if (!extractor)
      return
    let container: StructureContainer
    if (!this.memory.containerID) {
      const con = extractor.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (stru) => {
          return stru.structureType == 'container'
        },
      }) as StructureContainer[]
      if (con.length > 0)
        this.memory.containerID = con[0].id
    }
    else {
      container = Game.getObjectById(this.memory.containerID) as StructureContainer
      if (!container)
        return
      /* container杂志清理 */
      if (container.store && container.store.getUsedCapacity() > 0 && this.pos.isEqualTo(container)) {
        for (var i in container.store)
          this.withdraw(container, i as ResourceConstant)
      }
      if (!this.memory.working)
        this.memory.working = false
      if (this.memory.working && this.store.getFreeCapacity() == this.store.getCapacity())
        this.memory.working = false
      if (!this.memory.working && this.store.getFreeCapacity() == 0)
        this.memory.working = true
      if (this.memory.working) {
        const storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.storageID) as StructureStorage
        if (!storage_)
          return
        if (!this.pos.isNearTo(storage_)) { this.goTo(storage_.pos, 1) }
        else {
          for (var i in this.store) {
            this.transfer(storage_, i as ResourceConstant)
            return
          }
        }
      }
      else {
        if (!this.pos.isEqualTo(container.pos)) { this.goTo(container.pos, 0) }
        else {
          if (this.ticksToLive < 15)
            this.suicide()
          const mineral = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.mineralID) as Mineral
          if (!mineral.mineralAmount) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            this.suicide()
            return
          }
          if (!extractor.cooldown)
            this.harvest(mineral)
        }
      }
    }
  }
}
