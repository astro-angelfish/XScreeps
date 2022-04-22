import { unzipPosition, zipPosition } from '@/utils'

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissionActionExtension extends Creep {
  /**
   * 刷墙
   */
  public processRepairMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    if (!id)
      return

    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const mission = belongRoom.getMissionById(id)
    if (!mission)
      return

    const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null

    this.processBasicWorkState(RESOURCE_ENERGY)

    // boost 检查
    if (mission.labBind) {
      // 如果是 boost 的，没有仓库就不刷了
      if (!storage)
        return

      // 需要 boost 检查，必要情况下可以不检查
      if (!(Object.keys(mission.labBind).map(Game.getObjectById) as (StructureLab | null)[])
        .every(lab => !lab || !lab.mineralType || lab.store[lab.mineralType] < 500)) {
        if (!this.processBoost(['work']))
          return
      }
    }

    if (mission.data.RepairType === 'global') {
      if (this.memory.working) {
        if (this.memory.targetID) {
          this.say('🛠️')

          const target = Game.getObjectById(this.memory.targetID as Id<StructureRampart>)
          if (!target) {
            delete this.memory.targetID
            return
          }

          this.processBasicRepair(target)
        }

        else {
          const leastRam = this.room.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
          if (!leastRam)
            return

          this.memory.targetID = leastRam.id
        }

        delete this.memory.containerID
      }

      else {
        // 寻找 hits 最小的墙
        const leastRam = this.room.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
        if (!leastRam)
          return

        this.memory.targetID = leastRam.id

        if (!this.memory.containerID) {
          const tank = this.pos.findClosestByPath(
            this.room.getStructureWithTypes([STRUCTURE_STORAGE, STRUCTURE_LINK])
              .filter(struct => struct.structureType === STRUCTURE_STORAGE
               || (belongRoom.memory.structureIdData?.consumeLink?.includes(struct.id) && (struct.store.energy || 0) > this.store.getCapacity())))
          if (tank) {
            this.memory.containerID = tank.id
          }
          else {
            const closestStore = this.pos.findClosestByRange(
              this.room.getStructureWithTypes([STRUCTURE_CONTAINER, STRUCTURE_TOWER])
                .filter(struct => (struct.store.energy || 0) >= this.store.getFreeCapacity()))
            if (closestStore)
              this.processBasicWithdraw(closestStore, RESOURCE_ENERGY)

            return
          }
        }

        const tank = Game.getObjectById(this.memory.containerID)
        if (!tank) {
          delete this.memory.containerID
          return
        }
        this.processBasicWithdraw(tank, RESOURCE_ENERGY)
      }
    }

    else if (mission.data.RepairType === 'nuker') {
      // 没有仓库和终端就不防了
      const terminal = belongRoom.memory.structureIdData?.terminalID ? Game.getObjectById(belongRoom.memory.structureIdData.terminalID) : null
      if (!storage && !terminal)
        return
      const targetStorage = storage || terminal!

      // 核弹防御
      // 防核函数  测试成功！
      if (!belongRoom.memory.nukeData)
        return

      if (Object.keys(belongRoom.memory.nukeData.damage).length <= 0) {
        belongRoom.removeMission(id)
        return
      }

      // 优先修 spawn 和 terminal
      if (!this.memory.targetID) {
        for (const dmgPoint in belongRoom.memory.nukeData.damage) {
          if (belongRoom.memory.nukeData.damage[dmgPoint] <= 0)
            continue

          const pos = unzipPosition(dmgPoint)
          if (!pos)
            continue

          const ram = pos.getStructure('rampart')
          if (!ram) {
            pos.createConstructionSite('rampart')

            if (!this.memory.working)
              this.processBasicWithdraw(targetStorage, RESOURCE_ENERGY)
            else this.processBasicBuild(pos.lookFor(LOOK_CONSTRUCTION_SITES)[0])

            return
          }

          this.memory.targetID = ram.id
          return
        }

        if (!belongRoom.removeMission(id))
          this.memory.missionData = {}
      }

      else {
        if (!this.memory.working) {
          this.memory.standed = false
          this.processBasicWithdraw(targetStorage, RESOURCE_ENERGY)
        }

        else {
          this.memory.standed = false
          if ((this.memory.crossLevel || 0) > 10)
            this.memory.crossLevel = 10 - Math.ceil(Math.random() * 10)

          const ram = Game.getObjectById(this.memory.targetID as Id<StructureRampart>)
          if (!ram) {
            delete this.memory.targetID
            return
          }

          const strPos = zipPosition(ram.pos)
          if (ram.hits >= belongRoom.memory.nukeData.damage[strPos] + belongRoom.memory.nukeData.rampart[strPos] + 500000) {
            delete this.memory.targetID
            belongRoom.memory.nukeData.damage[strPos] = 0
            belongRoom.memory.nukeData.rampart[strPos] = 0
            return
          }

          if (this.repair(ram) === ERR_NOT_IN_RANGE)
            this.goTo(ram.pos, 3)
        }
      }
    }

    else if (mission.data.RepairType === 'special') {
      if (this.memory.working) {
        if (this.memory.targetID) {
          this.say('🛠️')

          const target = Game.getObjectById(this.memory.targetID as Id<StructureRampart>)
          if (!target) {
            delete this.memory.targetID
            return
          }

          this.processBasicRepair(target)
        }

        else {
          const leastRam = this.room.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
          if (!leastRam)
            return

          this.memory.targetID = leastRam.id
        }

        delete this.memory.containerID
      }

      else {
        // 寻找插了旗子的 hits 最小的墙
        const flags = this.room.find(FIND_FLAGS).filter(flag => flag.name.startsWith('repair'))
        if (flags.length <= 0)
          return

        let disWall = null
        for (const f of flags) {
          const wall = f.pos.getStructureList(['rampart', 'constructedWall'])[0]
          if (!wall) {
            f.remove()
          }
          else {
            if (!disWall || wall.hits < disWall.hits)
              disWall = wall
          }
        }
        // 没有旗子就删除任务
        if (!disWall) {
          belongRoom.removeMission(id)
          return
        }

        this.memory.targetID = disWall.id
        if (!this.memory.containerID) {
          const tank = this.pos.findClosestByPath(
            this.room.getStructureWithTypes([STRUCTURE_STORAGE, STRUCTURE_LINK])
              .filter(struct => struct.structureType === STRUCTURE_STORAGE
               || (belongRoom.memory.structureIdData?.consumeLink?.includes(struct.id) && (struct.store.energy || 0) > this.store.getCapacity())))
          if (tank) {
            this.memory.containerID = tank.id
          }
          else {
            const closestStore = this.pos.findClosestByRange(
              this.room.getStructureWithTypes([STRUCTURE_CONTAINER, STRUCTURE_TOWER])
                .filter(struct => (struct.store.energy || 0) >= this.store.getFreeCapacity()))
            if (closestStore)
              this.processBasicWithdraw(closestStore, RESOURCE_ENERGY)

            return
          }
        }

        const tank = Game.getObjectById(this.memory.containerID)
        if (!tank) {
          delete this.memory.containerID
          return
        }
        this.processBasicWithdraw(tank, RESOURCE_ENERGY)
      }
    }
  }

  /**
   * C计划
   */
  public processPlanCMission(): void {
    const mission = this.memory.missionData

    // if (Game.rooms[mission.Data.disRoom] && !Game.rooms[mission.Data.disRoom].controller.safeMode) Game.rooms[mission.Data.disRoom].controller.activateSafeMode()

    if (this.memory.role === 'cclaim') {
      if (this.room.name !== mission.Data.disRoom || Game.shard.name !== mission.Data.shard) {
        this.arriveTo(new RoomPosition(25, 25, mission.Data.disRoom), 20, mission.Data.shard)
      }
      else {
        if (!this.room.controller) {
          console.log(`C计划分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${mission.id}`)
          Game.notify(`C计划分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${mission.id}`)
          delete this.memory.missionData
          return
        }

        if (!this.pos.isNearTo(this.room.controller)) {
          this.goTo(this.room.controller.pos, 1)
        }
        else {
          if (!this.room.controller.owner)
            this.claimController(this.room.controller)
          this.signController(this.room.controller, 'better to rua BB cat at home!')
        }
      }
    }

    else {
      this.processBasicWorkState(RESOURCE_ENERGY)

      if (this.room.name === this.memory.belong && !this.memory.working) {
        const store = this.pos.findClosestByRange(
          this.room.getStructureWithTypes([STRUCTURE_CONTAINER, STRUCTURE_TOWER, STRUCTURE_STORAGE])
            .filter(struct => (struct.store.energy || 0) >= this.store.getFreeCapacity()))
        if (store)
          this.processBasicWithdraw(store, RESOURCE_ENERGY)

        return
      }

      const disRoom = Game.rooms[mission.Data.disRoom]

      if (!disRoom) {
        this.goTo(new RoomPosition(25, 25, mission.Data.disRoom), 20)
        return
      }

      if (!disRoom.controller) {
        console.log(`C计划分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${mission.id}`)
        Game.notify(`C计划分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${mission.id}`)
        delete this.memory.missionData
        return
      }

      if (disRoom.controller.level >= 2)
        global.SpecialBodyData[this.memory.belong].cupgrade = { work: 1, carry: 1, move: 1 }

      if (this.memory.working) {
        if (this.room.name !== mission.Data.disRoom) {
          this.goTo(disRoom.controller.pos, 1)
          return
        }

        const cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (cons) {
          this.processBasicBuild(cons)
        }
        else {
          this.processBasicUpgrade()
          this.say('cupgrade')
        }
      }

      else {
        const source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
        if (source)
          this.processBasicHarvest(source)
      }
    }
  }

  /**
   * 扩张援建
   */
  public processExpandMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id

    if (this.room.name !== missionData.Data.disRoom || Game.shard.name !== missionData.Data.shard) {
      this.arriveTo(new RoomPosition(24, 24, missionData.Data.disRoom), 20, missionData.Data.shard, missionData.Data.shardData)
      return
    }

    this.processBasicWorkState(RESOURCE_ENERGY)

    if (this.memory.role === 'claim') {
      const disRoom = Game.rooms[missionData.Data.disRoom]
      if (!disRoom.controller) {
        console.log(`扩张援建分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${missionData.id}`)
        Game.notify(`扩张援建分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${missionData.id}`)
        delete this.memory.missionData
        return
      }

      if (!this.pos.isNearTo(disRoom.controller)) {
        this.goTo(disRoom.controller.pos, 1)
      }
      else {
        this.claimController(disRoom.controller)
        this.say('claim')
      }

      if (missionData.Data.shard === this.memory.shard) {
        if (disRoom.controller.level && disRoom.controller.owner) {
          const belongRoom = Game.rooms[this.memory.belong]
          if (!belongRoom)
            return

          const mission = belongRoom.getMissionById(id)
          if (!mission?.creepBind)
            return
          mission.creepBind[this.memory.role].num = 0
        }
      }
    }

    else if (this.memory.role === 'Ebuild') {
      if (this.memory.working) {
        // 优先造建筑
        const cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (cons) {
          this.processBasicBuild(cons)
          return
        }

        const roads = this.pos.findClosestByRange(
          this.room.getStructureWithTypes([STRUCTURE_ROAD, STRUCTURE_CONTAINER])
            .filter(struct => struct.hits < struct.hitsMax))
        if (roads) {
          this.processBasicRepair(roads)
          return
        }

        const tower = this.pos.findClosestByPath(
          this.room.getStructureWithType(STRUCTURE_TOWER)
            .filter(tower => tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0))
        if (tower) {
          this.processBasicTransfer(tower, RESOURCE_ENERGY)
          return
        }

        const store = this.pos.getClosestStore()
        if (store) {
          this.processBasicTransfer(store, RESOURCE_ENERGY)
          return
        }

        this.processBasicUpgrade()
      }

      else {
        const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
        if (source)
          this.processBasicHarvest(source)

        if (this.ticksToLive! < 120 && (this.store.energy || 0) <= 20)
          this.suicide()
      }
    }

    else if (this.memory.role === 'Eupgrade') {
      if (this.memory.working) {
        this.say('upgrade')
        this.processBasicUpgrade()
      }

      else {
        const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
        if (source)
          this.processBasicHarvest(source)
        if (this.ticksToLive! < 120 && (this.store.energy || 0) <= 20)
          this.suicide()
      }
    }
  }

  /**
   * 急速冲级
   */
  public processQuickRushMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id

    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const mission = belongRoom.getMissionById(id)
    if (!mission)
      return

    // boost 检查
    if (mission.labBind && !this.processBoost(['work']))
      return

    this.processBasicWorkState(RESOURCE_ENERGY)

    const terminal = this.room.memory.structureIdData?.terminalID ? Game.getObjectById(this.room.memory.structureIdData.terminalID) : null
    if (!terminal) {
      this.say('NO-TERMINAL')
      return
    }

    if (this.memory.working) {
      this.processBasicUpgrade()
      if ((this.store.energy || 0) < 35 && terminal.pos.isNearTo(this))
        this.processBasicWithdraw(terminal, RESOURCE_ENERGY)
    }

    else {
      this.processBasicWithdraw(terminal, RESOURCE_ENERGY)
    }

    this.memory.standed = mission.data.standed
  }

  /**
   * 紧急援建
   */
  public processHelpBuildMission(): void {
    const missionData = this.memory.missionData
    const data = missionData.Data
    if (!missionData)
      return

    if (this.room.name === this.memory.belong && Game.shard.name === this.memory.shard) {
      if (!this.processBoost(['move', 'work', 'heal', 'tough', 'carry']))
        return

      if (this.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
        const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
        if (storage) {
          this.processBasicWithdraw(storage, RESOURCE_ENERGY)
          return
        }
      }
    }

    if ((this.room.name !== data.disRoom || Game.shard.name !== data.shard) && !this.memory.swith) {
      this.heal(this)
      this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData)
      return
    }

    this.memory.swith = true

    const runFlag = this.pos.findClosestByRange(
      this.room.find(FIND_FLAGS)
        .filter(flag => flag.color === COLOR_BLUE))
    if (runFlag) {
      this.goTo(runFlag.pos, 0)
      return
    }

    this.processBasicWorkState(RESOURCE_ENERGY)

    if (this.memory.working) {
      if (this.room.name !== data.disRoom) {
        this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard)
        return
      }

      if (this.hits < this.hitsMax)
        this.heal(this)

      if (this.room.name !== data.disRoom) {
        this.goTo(new RoomPosition(24, 24, data.disRoom), 23)
        return
      }

      const cons = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
      if (cons)
        this.processBasicBuild(cons)
    }

    else {
      // 以 withdraw 开头的旗帜  例如： withdraw_0
      const withdrawFlag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('withdraw')))
      if (withdrawFlag) {
        const tank = withdrawFlag.pos.getStructureList(['storage', 'terminal', 'container', 'tower'])
        if (tank.length > 0) {
          this.processBasicWithdraw(tank[0], RESOURCE_ENERGY)
          return
        }
      }

      const harvestFlag = Game.flags[`${this.memory.belong}/HB/harvest`]
      if (harvestFlag) {
        if (this.hits < this.hitsMax)
          this.heal(this)

        if (this.room.name !== harvestFlag.pos.roomName) {
          this.goTo(harvestFlag.pos, 1)
        }
        else {
          const source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
          if (source)
            this.processBasicHarvest(source)
        }

        return
      }

      const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
      if (source)
        this.processBasicHarvest(source)
    }
  }

  /**
   * 房间签名
   */
  public processSignMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data
    if (!missionData)
      return

    if (this.room.name !== data.disRoom || Game.shard.name !== data.shard) {
      this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData)
      return
    }

    const controller = this.room.controller
    if (!controller)
      return

    if (!this.pos.isNearTo(controller)) {
      this.goTo(controller.pos, 1)
      return
    }

    this.signController(controller, data.str)

    if (controller.sign === data.str) {
      const belongRoom = Game.rooms[this.memory.belong]
      if (belongRoom)
        belongRoom.removeMission(id)
    }
  }

  /**
   * 原矿开采任务处理
   */
  public processMineralMission(): void {
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const extractor = belongRoom.memory.structureIdData?.extractorID ? Game.getObjectById(belongRoom.memory.structureIdData.extractorID) : null
    if (!extractor)
      return

    if (!this.memory.containerID) {
      const con = extractor.pos.findInRange(extractor.room.getStructureWithType(STRUCTURE_CONTAINER), 1)
      if (con.length > 0)
        this.memory.containerID = con[0].id
      else return
    }

    const container = Game.getObjectById(this.memory.containerID as Id<StructureContainer>)
    if (!container)
      return

    // container 杂质清理
    if (container.store.getUsedCapacity() > 0 && this.pos.isEqualTo(container))
      this.processBasicWithdraw(container, Object.keys(container.store)[0] as ResourceConstant)

    if (!this.memory.working)
      this.memory.working = false
    if (this.memory.working && this.store.getFreeCapacity() === this.store.getCapacity())
      this.memory.working = false
    if (!this.memory.working && this.store.getFreeCapacity() === 0)
      this.memory.working = true

    if (this.memory.working) {
      const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
      if (!storage)
        return

      if (!this.pos.isNearTo(storage)) {
        this.goTo(storage.pos, 1)
        return
      }

      this.processBasicTransfer(storage, Object.keys(this.store)[0] as ResourceConstant)
    }

    else {
      if (!this.pos.isEqualTo(container.pos)) {
        this.goTo(container.pos, 0)
        return
      }

      if (this.ticksToLive! < 15)
        this.suicide()

      const mineral = belongRoom.memory.structureIdData?.mineralID ? Game.getObjectById(belongRoom.memory.structureIdData.mineralID) : null
      if (!mineral?.mineralAmount) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.suicide()
        return
      }

      if (!extractor.cooldown)
        this.harvest(mineral)
    }
  }
}
