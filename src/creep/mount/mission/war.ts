import { findFollowQuarter, findNextQuarter, havePart, identifyGarrison, isRoomInRange, isRoomNextTo } from '@/utils'
import { canSustain, findClosestCreepByRange, findClosestFlagByPath, findClosestStructureByPath, findCreepsInRange, initWarData } from '@/creep/war/war'

// TODO 重写，重复太多

export default class CreepMissionWarExtension extends Creep {
  /**
   * 黄球拆迁
   */
  public processDismantleMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data

    if (data.boost) {
      if (!this.processBoost(['move', 'work']))
        return
    }

    if (this.room.name !== data.disRoom || data.shard !== Game.shard.name) {
      this.arriveTo(new RoomPosition(25, 25, data.disRoom), 20, data.shard, data.shardData)
      return
    }

    this.memory.standed = true

    // 对方开安全模式情况下 删除任务
    if (this.room.controller?.safeMode) {
      if (Game.shard.name === this.memory.shard)
        Game.rooms[this.memory.belong]?.removeMission(id)
      return
    }

    // dismantle_0
    const disFlag = this.pos.findClosestByPath(
      this.room.find(FIND_FLAGS)
        .filter(flag => flag.name.startsWith('dismantle')))
    if (!disFlag) {
      const clostStruct = this.pos.findClosestByRange(
        this.room.find(FIND_HOSTILE_STRUCTURES)
          .filter(struct => struct.structureType !== STRUCTURE_CONTROLLER))
      if (clostStruct) {
        const randomStr = Math.random().toString(36).slice(3)
        clostStruct.pos.createFlag(`dismantle_${randomStr}`, COLOR_WHITE)
        return
      }

      return
    }

    const struct = disFlag.pos.lookFor(LOOK_STRUCTURES)[0]
    if (struct) {
      if (this.dismantle(struct) === ERR_NOT_IN_RANGE)
        this.goTo(struct.pos, 1)
    }
    else {
      disFlag.remove()
    }
  }

  /**
   * 控制攻击
   */
  public processControlMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data

    if (this.room.name !== data.disRoom || Game.shard.name !== data.shard) {
      this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData)
      return
    }

    // 对方开安全模式情况下 删除任务
    if (this.room.controller?.safeMode) {
      if (Game.shard.name === this.memory.shard)
        Game.rooms[this.memory.belong]?.removeMission(id)
      return
    }

    const controller = this.room.controller
    if (!controller)
      return

    if (!this.pos.isNearTo(controller)) {
      this.goTo(controller.pos, 1)
      return
    }

    if (controller.owner)
      this.attackController(controller)
    else this.reserveController(controller)
  }

  /**
   * 红球防御
   */
  public processDefendAttackMission(): void {
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    if (!this.processBoost(['move', 'attack']))
      return

    this.memory.standed = true

    if (this.hitsMax - this.hits > 200)
      this.optTower('heal', this)

    this.memory.crossLevel = 16

    // 如果周围1格发现敌人，爬虫联合防御塔攻击
    const nearCreep = this.pos.findInRange(
      this.room.find(FIND_HOSTILE_CREEPS)
        .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 1)
    if (nearCreep.length > 0) {
      this.attack(nearCreep[0])
      this.optTower('attack', nearCreep[0])
    }

    // 寻路去距离敌对爬虫最近的 rampart
    const hostileCreep = belongRoom.find(FIND_HOSTILE_CREEPS)
      .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
    if (hostileCreep.length > 0) {
      for (const c of hostileCreep) {
        // 如果发现Hits/hitsMax低于百分之80的爬虫，直接防御塔攻击
        if (c.hits / c.hitsMax <= 0.8)
          this.optTower('attack', c)
      }
    }
    else {
      return
    }

    // 以 gather_attack 开头的旗帜  例如： defend_attack_0 优先前往该旗帜附近
    const gatherFlag = this.pos.findClosestByPath(
      this.room.find(FIND_FLAGS)
        .filter(flag => flag.name.startsWith('defend_attack')))
    if (gatherFlag) {
      this.goTo(gatherFlag.pos, 0)
      return
    }

    if (!belongRoom.memory.enemy)
      belongRoom.memory.enemy = {}
    if (!belongRoom.memory.enemy[this.name])
      belongRoom.memory.enemy[this.name] = []

    if (belongRoom.memory.enemy[this.name].length <= 0) {
      // 领取敌对爬虫
      // 判断一下该爬虫的id是否存在于其他爬虫的分配里了
      const creeps = hostileCreep.filter(creep => !this.isInDefend(creep))
      if (creeps.length > 0) {
        const highestAim = creeps.find(creep => havePart(creep, 'attack') || havePart(creep, 'work')) || creeps[0]
        belongRoom.memory.enemy[this.name].push(highestAim.id)

        // 方便识别小队，把周围的爬也放进去 【如果本来不是小队但暂时在周围的，后续爬虫会自动更新】
        const nearHCreep = highestAim.pos.findInRange(
          this.room.find(FIND_HOSTILE_CREEPS)
            .filter(creep => !Memory.whitelist?.includes(creep.owner.username) && !this.isInDefend(creep)), 1)
        if (nearHCreep.length > 0) {
          for (const n of nearHCreep)
            belongRoom.memory.enemy[this.name].push(n.id)
        }
      }
    }

    else {
      const en = Game.getObjectById(belongRoom.memory.enemy[this.name][0])
      if (!en) {
        belongRoom.memory.enemy[this.name].splice(0, 1)
        return
      }

      let nstC = en
      // 查找是否是小队爬, 发现不是小队爬就删除
      if (belongRoom.memory.enemy[this.name].length > 1) {
        for (const id of belongRoom.memory.enemy[this.name]) {
          const idCreep = Game.getObjectById(id)
          if (!idCreep)
            continue

          // 防止敌方爬虫 bug
          if (Game.time % 10 === 0) {
            if (Math.abs(idCreep.pos.x - en.pos.x) >= 2 || Math.abs(idCreep.pos.y - en.pos.y) >= 2) {
              const index = belongRoom.memory.enemy[this.name].indexOf(id)
              belongRoom.memory.enemy[this.name].splice(index, 1)
              continue
            }
          }

          if (this.pos.getStraightDistanceTo(idCreep.pos) < this.pos.getStraightDistanceTo(nstC.pos))
            nstC = idCreep
        }
      }
      if (nstC) {
        // 寻找最近的爬距离最近的 rampart，去那里呆着
        const nearstRam = nstC.pos.findClosestByRange(
          this.room.getStructureWithType(STRUCTURE_RAMPART)
            .filter(ram => ram.pos.getStructureWithTypes(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0
             && (ram.pos.lookFor(LOOK_CREEPS).length <= 0 || ram.pos.lookFor(LOOK_CREEPS)[0] === this)))
        if (nearstRam)
          this.goToWhenDefend(nearstRam.pos, 0)
        else this.moveTo(nstC.pos)
      }
    }

    // 仍然没有说明主动防御已经饱和
    if (belongRoom.memory.enemy[this.name].length <= 0) {
      this.say('🔍')

      const closestCreep = this.pos.findClosestByRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)))
      if (closestCreep && !this.pos.inRangeTo(closestCreep.pos, 3)) {
        // 找离虫子最近的 rampart
        const nearstRam = closestCreep.pos.findClosestByRange(
          this.room.getStructureWithType(STRUCTURE_RAMPART)
            .filter(ram => ram.pos.getStructureWithTypes(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0
             && (ram.pos.lookFor(LOOK_CREEPS).length <= 0 || ram.pos.lookFor(LOOK_CREEPS)[0] === this)))

        if (nearstRam)
          this.goToWhenDefend(nearstRam.pos, 0)
        else this.moveTo(closestCreep.pos)
      }
    }

    if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1)
      this.moveTo(new RoomPosition(Memory.roomControlData[this.memory.belong].center[0], Memory.roomControlData[this.memory.belong].center[1], this.memory.belong))
  }

  // 蓝球防御
  public processDefendRangeMission(): void {
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    if (!this.processBoost(['move', 'ranged_attack']))
      return

    this.memory.crossLevel = 15

    if (this.hitsMax - this.hits > 200)
      this.optTower('heal', this)

    // 如果周围1格发现敌人，爬虫联合防御塔攻击
    const nearCreeps = this.pos.findInRange(
      this.room.find(FIND_HOSTILE_CREEPS)
        .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 3)
    if (nearCreeps.length > 0) {
      const nearstCreeps = this.pos.findInRange(nearCreeps, 1)

      if (nearstCreeps.length > 0)
        this.rangedMassAttack()
      else this.rangedAttack(nearCreeps[0])

      if (Game.time % 4 === 0)
        this.optTower('attack', nearCreeps[0])
    }

    // 寻路去距离敌对爬虫最近的 rampart
    const hostileCreeps = belongRoom.find(FIND_HOSTILE_CREEPS)
      .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
    if (hostileCreeps.length > 0) {
      for (const c of hostileCreeps) {
        // 如果发现Hits/hitsMax低于百分之80的爬虫，直接防御塔攻击
        if (c.hits / c.hitsMax <= 0.8)
          this.optTower('attack', c)
      }
    }

    // 以gather_attack开头的旗帜  例如： defend_range_0 优先前往该旗帜附近
    const gatherFlag = this.pos.findClosestByPath(
      this.room.find(FIND_FLAGS)
        .filter(flag => flag.name.startsWith('defend_range')))
    if (gatherFlag) {
      this.goTo(gatherFlag.pos, 0)
      return
    }

    if (!belongRoom.memory.enemy)
      belongRoom.memory.enemy = {}
    if (!belongRoom.memory.enemy[this.name])
      belongRoom.memory.enemy[this.name] = []

    if (belongRoom.memory.enemy[this.name].length <= 0) {
      // 领取敌对爬虫
      // 判断一下该爬虫的id是否存在于其他爬虫的分配里了
      const creeps = hostileCreeps.filter(creep => !this.isInDefend(creep))
      if (creeps.length > 0) {
        const highestAim = creeps.find(creep => havePart(creep, 'ranged_attack')) || creeps[0]
        belongRoom.memory.enemy[this.name].push(highestAim.id)

        // 方便识别小队，把周围的爬也放进去 【如果本来不是小队但暂时在周围的，后续爬虫会自动更新】
        const nearHCreep = this.pos.findInRange(
          this.room.find(FIND_HOSTILE_CREEPS)
            .filter(creep => !Memory.whitelist?.includes(creep.owner.username) && !this.isInDefend(creep)), 1)
        if (nearHCreep.length > 0) {
          for (const n of nearHCreep)
            belongRoom.memory.enemy[this.name].push(n.id)
        }
      }
    }

    else {
      const en = Game.getObjectById(belongRoom.memory.enemy[this.name][0])
      if (!en) {
        belongRoom.memory.enemy[this.name].splice(0, 1)
        return
      }

      let nstC = en
      // 查找是否是小队爬, 发现不是小队爬就删除
      if (belongRoom.memory.enemy[this.name].length > 1) {
        for (const id of belongRoom.memory.enemy[this.name]) {
          const idCreep = Game.getObjectById(id)
          if (!idCreep)
            continue

          if (Game.time % 10 === 0) {
            if (Math.abs(idCreep.pos.x - en.pos.x) >= 2 || Math.abs(idCreep.pos.y - en.pos.y) >= 2) {
              const index = belongRoom.memory.enemy[this.name].indexOf(id)
              belongRoom.memory.enemy[this.name].splice(index, 1)
              continue
            }
          }

          if (this.pos.getStraightDistanceTo(idCreep.pos) < this.pos.getStraightDistanceTo(nstC.pos))
            nstC = idCreep
        }
      }
      if (nstC) {
        // 寻找最近的爬距离最近的 rampart，去那里呆着
        const nearstRam = nstC.pos.findClosestByRange(
          this.room.getStructureWithType(STRUCTURE_RAMPART)
            .filter(ram => ram.pos.getStructureWithTypes(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0
             && (ram.pos.lookFor(LOOK_CREEPS).length <= 0 || ram.pos.lookFor(LOOK_CREEPS)[0] === this)))
        if (nearstRam)
          this.goToWhenDefend(nearstRam.pos, 0)
        else this.moveTo(nstC.pos)
      }
    }

    // 仍然没有说明主动防御已经饱和
    if (belongRoom.memory.enemy[this.name].length <= 0) {
      this.say('🔍')

      const closestCreep = this.pos.findClosestByRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)))
      if (closestCreep && !this.pos.inRangeTo(closestCreep.pos, 3)) {
        // 找离虫子最近的 rampart
        const nearstRam = closestCreep.pos.findClosestByRange(
          this.room.getStructureWithType(STRUCTURE_RAMPART)
            .filter(ram => ram.pos.getStructureWithTypes(['extension', 'link', 'observer', 'tower', 'controller', 'extractor']).length <= 0
             && (ram.pos.lookFor(LOOK_CREEPS).length <= 0 || ram.pos.lookFor(LOOK_CREEPS)[0] === this)))

        if (nearstRam)
          this.goToWhenDefend(nearstRam.pos, 0)
        else this.moveTo(closestCreep.pos)
      }
    }

    if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1)
      this.moveTo(new RoomPosition(Memory.roomControlData[this.memory.belong].center[0], Memory.roomControlData[this.memory.belong].center[1], this.memory.belong))
  }

  // 双人防御
  public processDefendDoubleMission(): void {
    if (this.memory.role === 'defend-douAttack') {
      if (!this.processBoost(['move', 'attack', 'tough']))
        return
    }
    else {
      if (!this.processBoost(['move', 'heal', 'tough']))
        return
    }

    if (!this.memory.double) {
      if (this.memory.role === 'defend-douHeal') {
        // 由 heal 来进行组队
        if (Game.time % 7 === 0) {
          const disCreep = this.pos.findClosestByRange(
            this.room.find(FIND_MY_CREEPS)
              .filter(creep => creep.memory.role === 'defend-douAttack' && !creep.memory.double))
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

    if (this.memory.role === 'defend-douAttack') {
      if (this.hitsMax - this.hits > 1200)
        this.optTower('heal', this)

      if (!Game.creeps[this.memory.double])
        return

      if (this.fatigue || Game.creeps[this.memory.double].fatigue)
        return

      if (Game.creeps[this.memory.double] && !this.pos.isNearTo(Game.creeps[this.memory.double])
       && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49)
        return

      // 确保在自己房间
      if (this.room.name !== this.memory.belong) {
        this.goTo(new RoomPosition(24, 24, this.memory.belong), 23)
        return
      }

      const flag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('defend_double')))
      if (flag) {
        const creeps = this.pos.findInRange(
          this.room.find(FIND_HOSTILE_CREEPS)
            .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 1)

        if (creeps[0])
          this.attack(creeps[0])

        this.goTo(flag.pos, 0)
        return
      }

      const creeps = this.pos.findClosestByRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)))
      if (creeps && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49) {
        if (this.attack(creeps) === ERR_NOT_IN_RANGE)
          this.goTo(creeps.pos, 1)
      }

      if (this.pos.x >= 48 || this.pos.x <= 1 || this.pos.y >= 48 || this.pos.y <= 1)
        this.moveTo(new RoomPosition(Memory.roomControlData[this.memory.belong].center[0], Memory.roomControlData[this.memory.belong].center[1], this.memory.belong))
    }

    else {
      if (this.hitsMax - this.hits > 600)
        this.optTower('heal', this)

      this.moveTo(Game.creeps[this.memory.double])

      if (Game.creeps[this.memory.double])
        this.heal(Game.creeps[this.memory.double])
      else this.heal(this)

      if (!Game.creeps[this.memory.double]) {
        this.suicide()
        return
      }

      if (this.pos.isNearTo(Game.creeps[this.memory.double])) {
        const captionHp = Game.creeps[this.memory.double].hits
        const thisHp = this.hits
        if (thisHp === this.hitsMax && captionHp === Game.creeps[this.memory.double].hitsMax)
          this.heal(Game.creeps[this.memory.double])
        if (captionHp < thisHp)
          this.heal(Game.creeps[this.memory.double])
        else
          this.heal(this)

        const otherCreeps = this.pos.findInRange(this.room.find(FIND_MY_CREEPS).filter(creep => creep.hits < creep.hitsMax - 300), 3)
        if (otherCreeps[0] && this.hits === this.hitsMax && Game.creeps[this.memory.double].hits === Game.creeps[this.memory.double].hitsMax) {
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

  /**
   * 攻防一体 已经做一定测试 目前未发现bug
   */
  public processAioMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data
    if (!missionData)
      return

    if (this.room.name === this.memory.belong && Game.shard.name === this.memory.shard) {
      if (data.boost && !this.processBoost(['move', 'heal', 'tough', 'ranged_attack']))
        return
    }

    if ((this.room.name !== data.disRoom || Game.shard.name !== data.shard)) {
      this.heal(this)
      this.arriveTo(new RoomPosition(24, 24, data.disRoom), 23, data.shard, data.shardData)
      return
    }

    // 对方开安全模式情况下 删除任务
    if (this.room.controller && this.room.controller.safeMode) {
      if (Game.shard.name === this.memory.shard) {
        const belongRoom = Game.rooms[this.memory.belong]
        belongRoom?.removeMission(id)
      }

      return
    }

    initWarData(Game.rooms[data.disRoom])

    const creeps = global.warData.enemy[data.disRoom].data
    const flags = global.warData.flag[data.disRoom].data
    // 没有目标旗帜 Memory 的情况下，先查找有没有最近的周围没有攻击爬的旗帜
    if (!this.memory.targetFlag) {
      this.heal(this)

      // 最近的攻击旗帜
      const flagAttack = findClosestFlagByPath(this.pos, flags, 'aio', true, 4)
      if (flagAttack) {
        this.memory.targetFlag = flagAttack.name
      }
      else {
        // 没有旗帜，就寻找一个最近的非危险建筑【优先没有rampart的】
        const structure = findClosestStructureByPath(this.pos, true, true, true, 4)
         // 还没有就寻找ram
         || findClosestStructureByPath(this.pos, true, false, true, 4)
         || findClosestStructureByPath(this.pos, false, false, true, 2)
        if (structure) {
          const randomStr = Math.random().toString(36).slice(3)
          if (!Game.flags[`aio_${randomStr}`])
            structure.pos.createFlag(`aio_${randomStr}`)
          this.memory.targetFlag = `aio_${randomStr}`
        }
      }

      // 遇到不能承受的爬就规避
      // 三格内的攻击性爬虫
      const ranged3Attack = findCreepsInRange(this.pos, creeps, 3, true)
      if (ranged3Attack.length > 0) {
        // 防御塔伤害数据
        const towerData = global.warData.tower[this.room.name].data
        const posStr = `${this.pos.x}/${this.pos.y}`
        const towerHurt = towerData[posStr] ? towerData[posStr].attack : 0

        if (!canSustain(ranged3Attack, this, towerHurt)) {
          this.say('危')

          const closestHurtCreep = findClosestCreepByRange(this.pos, ranged3Attack, true)
          if (closestHurtCreep)
            this.fleeFrom(closestHurtCreep.pos, 3)
        }
      }
    }

    else {
      if (!Game.flags[this.memory.targetFlag]) {
        delete this.memory.targetFlag
      }
      else {
        const pos = Game.flags[this.memory.targetFlag].pos
        if (pos.roomName !== this.room.name) {
          delete this.memory.targetFlag
          return
        }

        const stru = pos.lookFor(LOOK_STRUCTURES)
        if (stru.length <= 0 || ((stru[0].structureType === 'road' || stru[0].structureType === 'container') && stru.length === 1)) {
          this.heal(this)

          Game.flags[this.memory.targetFlag].remove()
          delete this.memory.targetFlag

          // 尝试看一下有没有建筑 对墙就不做尝试了
          const safeStructure = findClosestStructureByPath(this.pos, true, true, true, 4)
          if (safeStructure) {
            const randomStr = Math.random().toString(36).slice(3)
            if (!Game.flags[`aio_${randomStr}`]) {
              safeStructure.pos.createFlag(`aio_${randomStr}`)
              this.memory.targetFlag = `aio_${randomStr}`
            }
            return
          }
        }
        else {
          // 自动规避
          // 三格内的攻击性爬虫
          const ranged3Attack = findCreepsInRange(this.pos, creeps, 3, true)
          if (ranged3Attack.length > 0) {
            // 防御塔伤害数据
            const towerData = global.warData.tower[this.room.name].data
            const posStr = `${this.pos.x}/${this.pos.y}`
            const towerHurt = towerData[posStr] ? towerData[posStr].attack : 0
            if (!canSustain(ranged3Attack, this, towerHurt)) {
              this.say('危')

              // 删除记忆
              if (!this.pos.isNearTo(Game.flags[this.memory.targetFlag]))
                delete this.memory.targetFlag

              this.heal(this)

              const closestHurtCreep = findClosestCreepByRange(this.pos, ranged3Attack, true)
              if (closestHurtCreep)
                this.fleeFrom(closestHurtCreep.pos, 4)
            }
            else {
              if (!this.pos.isNearTo(pos))
                this.goToWhenAio(pos, 1)
            }
          }
          else {
            if (!this.pos.isNearTo(pos))
              this.goToWhenAio(pos, 1)
          }
          // 根据建筑类型判断攻击方式
          if (stru[0].structureType === STRUCTURE_WALL || stru[0].structureType === STRUCTURE_ROAD || stru[0].structureType === STRUCTURE_CONTAINER) {
            this.rangedAttack(stru[0])
          }
          else {
            if (stru[0].pos.isNearTo(this))
              this.rangedMassAttack()

            else
              this.rangedAttack(stru[0])
          }
        }
      }
    }

    const ranged3ramcreep = findCreepsInRange(this.pos, creeps, 3, false, true)
    // 自动攻击爬虫
    if (ranged3ramcreep.length > 0) {
      if (this.pos.isNearTo(ranged3ramcreep[0]))
        this.rangedMassAttack()
      else
        this.rangedAttack(ranged3ramcreep[0])
    }

    // 治疗自己和周围友军
    if (this.hits < this.hitsMax) {
      this.heal(this)
    }
    else {
      const allys = this.pos.findInRange(this.room.find(FIND_CREEPS)
        .filter(creep => (creep.my || Memory.whitelist?.includes(creep.owner.username)) && creep.hitsMax - creep.hits > 350), 3)
      if (allys.length > 0) {
        // 寻找最近的爬
        const ally = allys.reduce((a, b) => this.pos.getStraightDistanceTo(a.pos) < this.pos.getStraightDistanceTo(b.pos) ? a : b)
        if (this.pos.isNearTo(ally))
          this.heal(ally)
        else this.rangedHeal(ally)
      }
      else {
        this.heal(this)
      }
    }
  }

  /**
   * 四人小队 已经测试 多次跨shard未测试
   */
  public processSquadMission(): void {
    const data = this.memory.missionData.Data
    const shard = data.shard // 目标shard
    const roomName = data.disRoom // 目标房间名
    const squadID = data.squadID // 四人小队id

    // controlledBySquadFrame 为 true 代表不再受任务控制，改为战斗模块控制
    if (this.memory.controlledBySquardFrame) {
      // 说明到达指定房间，并到达合适位置了
      // 添加战争框架控制信息
      if (!Memory.squadMemory)
        Memory.squadMemory = {}
      if (!squadID || !this.memory.squad || !this.memory.targetShard) {
        this.say('找不到squard!')
        return
      }
      if (!Memory.squadMemory[squadID]) {
        Memory.squadMemory[squadID] = {
          creepIds: Object.keys(this.memory.squad) as SquadGroupIds,
          creepData: this.memory.squad,
          sourceRoom: this.memory.belong,
          presentRoom: this.room.name,
          disRoom: data.disRoom,
          ready: false,
          array: 'free',
          sourceShard: this.memory.shard,
          disShard: this.memory.targetShard,
          squardType: data.flag,
        }
      }
      return
    }

    // 任务开始前准备
    if (this.room.name === this.memory.belong && this.memory.shard === Game.shard.name) {
      const belongRoom = Game.rooms[this.memory.belong]
      if (!belongRoom)
        return

      // boost 检查
      if (this.getActiveBodyparts('move') > 0) {
        if (!this.processBoost(['move']))
          return
      }
      if (this.getActiveBodyparts('heal') > 0) {
        if (!this.processBoost(['heal']))
          return
      }
      if (this.getActiveBodyparts('work') > 0) {
        if (!this.processBoost(['work']))
          return
      }
      if (this.getActiveBodyparts('attack') > 0) {
        if (!this.processBoost(['attack']))
          return
      }
      if (this.getActiveBodyparts('ranged_attack') > 0) {
        if (!this.processBoost(['ranged_attack']))
          return
      }
      if (this.getActiveBodyparts('tough') > 0) {
        if (!this.processBoost(['tough']))
          return
      }

      // 组队检查
      if (!squadID)
        return
      if (!this.memory.missionData.id)
        return
      if (!belongRoom.memory.squadData)
        belongRoom.memory.squadData = {}

      if (!belongRoom.memory.squadData[squadID])
        belongRoom.memory.squadData[squadID] = {}
      const missionSquardData = belongRoom.memory.squadData[squadID]

      // 编队信息初始化
      if (this.memory.creepType === 'heal' && !this.memory.squad) {
        if (this.memory.role === 'x-aio') {
          if (Object.keys(missionSquardData).length <= 0)
            missionSquardData[this.name] = { position: '↙', index: 1, role: this.memory.role, creepType: this.memory.creepType }
          if (Object.keys(missionSquardData).length === 1 && !Object.keys(missionSquardData).includes(this.name))
            missionSquardData[this.name] = { position: '↖', index: 0, role: this.memory.role, creepType: this.memory.creepType }
          if (Object.keys(missionSquardData).length === 2 && !Object.keys(missionSquardData).includes(this.name))
            missionSquardData[this.name] = { position: '↘', index: 3, role: this.memory.role, creepType: this.memory.creepType }
          if (Object.keys(missionSquardData).length === 3 && !Object.keys(missionSquardData).includes(this.name))
            missionSquardData[this.name] = { position: '↗', index: 2, role: this.memory.role, creepType: this.memory.creepType }
        }
        else {
          if (Object.keys(missionSquardData).length <= 0)
            missionSquardData[this.name] = { position: '↙', index: 1, role: this.memory.role, creepType: this.memory.creepType }
          if (Object.keys(missionSquardData).length === 2 && !Object.keys(missionSquardData).includes(this.name))
            missionSquardData[this.name] = { position: '↘', index: 3, role: this.memory.role, creepType: this.memory.creepType }
        }
      }
      else if (this.memory.creepType === 'attack' && !this.memory.squad) {
        if (Object.keys(missionSquardData).length === 1 && !Object.keys(missionSquardData).includes(this.name))
          missionSquardData[this.name] = { position: '↖', index: 0, role: this.memory.role, creepType: this.memory.creepType }
        if (Object.keys(missionSquardData).length === 3 && !Object.keys(missionSquardData).includes(this.name))
          missionSquardData[this.name] = { position: '↗', index: 2, role: this.memory.role, creepType: this.memory.creepType }
      }

      if (Object.keys(belongRoom.memory.squadData[squadID]).length === 4 && !this.memory.squad) {
        console.log(`[squad] 房间 ${this.memory.belong} ID为: ${squadID} 的四人小队数量已经到位!将从房间分发组队数据!`)
        this.memory.squad = belongRoom.memory.squadData[squadID]
        return
      }

      // 检查是否所有爬虫都赋予记忆了
      if (!this.memory.squad)
        return
      for (const mem in this.memory.squad) {
        if (!Game.creeps[mem])
          return
        if (!Game.creeps[mem].memory.squad)
          return
      }

      // 爬虫都被赋予了组队数据了，就删除房间内的原始数据
      if (belongRoom.memory.squadData[squadID])
        delete belongRoom.memory.squadData[squadID]
    }

    // 在到达任务房间的隔壁房间前，默认攻击附近爬虫
    if (this.getActiveBodyparts('ranged_attack')) {
      const enemy = this.pos.findInRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 3)
      if (enemy.length > 0) {
        if (enemy.some(creep => this.pos.isNearTo(creep)))
          this.rangedMassAttack()
        else
          this.rangedAttack(enemy[0])
      }
    }

    // 在到达任务房间的隔壁房间前，默认治疗附近爬虫
    if (this.getActiveBodyparts('heal')) {
      const target = (Object.keys(this.memory.squad!).map(Game.getObjectById) as (Creep | null)[])
        .find(creep => creep && creep.hits < creep.hitsMax && this.pos.isNearTo(creep)) || this
      this.heal(target)
    }

    // 线性队列行走规则: 有成员疲劳就停止行走
    for (const cc in this.memory.squad) {
      if (Game.creeps[cc]?.fatigue)
        return
    }

    // 编号为 0 1 2 的爬需要遵守的规则
    if (this.memory.squad![this.name].index !== 3 && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49) {
      const followCreepName = findNextQuarter(this)
      if (followCreepName == null)
        return

      const portal = this.pos.findClosestByRange(this.room.getStructureWithType(STRUCTURE_PORTAL))
      const followCreep = Game.creeps[followCreepName]
      if (!followCreep && portal)
        return

      if (followCreep) {
        // 跟随爬不靠在一起就等一等
        if (!this.pos.isNearTo(followCreep))
          return
      }
    }

    // 编号为 1 2 3 的爬需要遵守的规则
    if (this.memory.squad![this.name].index !== 0) {
      const disCreepName = findFollowQuarter(this)
      const portal = this.pos.findClosestByRange(this.room.getStructureWithType(STRUCTURE_PORTAL))

      // 跨shard信息更新 可以防止一些可能出现的bug
      if (portal && data.shardData)
        this.updateShardAffirm()

      if (disCreepName == null || (!Game.creeps[disCreepName] && !portal))
        return

      if (!Game.creeps[disCreepName] && portal) {
        this.arriveTo(new RoomPosition(24, 24, roomName), 20, shard, data.shardData)
        return
      }

      if (Game.shard.name === shard && !Game.creeps[disCreepName])
        return

      const disCreep = Game.creeps[disCreepName]
      if (this.room.name === this.memory.belong)
        this.goTo(disCreep.pos, 0)
      else this.moveTo(disCreep)

      return
    }

    // 接下来在门口自动组队
    if (this.memory.squad![this.name].index === 0) {
      // 判断在不在目标房间入口房间
      if (Game.flags[`squad_unit_${this.memory.missionData.id}`]) {
        // 有集结旗帜的情况下，优先前往目标房间
        if (this.room.name !== Game.flags[`squad_unit_${this.memory.missionData.id}`].pos.roomName || Game.shard.name !== data.shard) {
          if (this.memory.squad![this.name].index === 0)
            this.arriveTo(new RoomPosition(24, 24, roomName), 18, shard, data.shardData)
          return
        }
      }
      else {
        // 没有集结旗帜的情况下，自动判断
        if (isRoomNextTo(this.room.name, roomName) === false || Game.shard.name !== data.shard) {
          this.say('🔪')
          if (this.memory.squad![this.name].index === 0)
            this.arriveTo(new RoomPosition(24, 24, roomName), 18, shard, data.shardData)
          return
        }
      }

      this.say('⚔️', true)

      if (!this.memory.arrived) {
        // 有旗帜的情况下，如果到达旗帜附近，就判定 arrived 为 true
        if (Game.flags[`squad_unit_${this.memory.missionData.id}`]) {
          if (!this.pos.isEqualTo(Game.flags[`squad_unit_${this.memory.missionData.id}`]))
            this.goTo(Game.flags[`squad_unit_${this.memory.missionData.id}`].pos, 0)
          else
            this.memory.arrived = true
        }
        // 没有旗帜的情况下，到入口前5格组队
        else {
          if (isRoomInRange(this.pos, roomName, 5))
            this.memory.arrived = true
          else
            this.arriveTo(new RoomPosition(24, 24, roomName), 24, shard, data.shardData)
        }
      }
      else {
        // 能组队就组队 否则就继续走
        if (identifyGarrison(this)) {
          for (const crp in this.memory.squad) {
            if (Game.creeps[crp])
              Game.creeps[crp].memory.controlledBySquardFrame = true
          }
        }
        else {
          this.arriveTo(new RoomPosition(24, 24, roomName), 24, shard, data.shardData)
        }
      }
    }
  }

  /**
   * 紧急支援 已经修改，但未作充分测试 可能有bug
   */
  public handleSupportMission(): void {
    const missionData = this.memory.missionData
    // const id = missionData.id
    const data = missionData.Data
    if (!missionData)
      return

    const disRoomName = data.disRoom
    if (this.room.name === this.memory.belong && data.boost) {
      if (this.memory.role === 'double-attack') {
        if (!this.processBoost(['move', 'attack', 'tough']))
          return
      }
      else if (this.memory.role === 'double-heal') {
        if (!this.processBoost(['move', 'heal', 'ranged_attack', 'tough']))
          return
      }
      else if (this.memory.role === 'aio') {
        if (!this.processBoost(['move', 'heal', 'ranged_attack', 'tough']))
          return
      }
    }

    if (this.memory.role !== 'aio' && !this.memory.double) {
      if (this.memory.role === 'double-heal') {
        // 由 heal 来进行组队
        if (Game.time % 7 === 0) {
          const disCreep = this.pos.findClosestByRange(
            this.room.find(FIND_MY_CREEPS)
              .filter(creep => creep.memory.role === 'double-attack' && !creep.memory.double))
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

    if (this.memory.role === 'double-attack' && this.memory.double) {
      if (!Game.creeps[this.memory.double])
        return

      if (this.fatigue || Game.creeps[this.memory.double].fatigue)
        return

      if (!this.pos.isNearTo(Game.creeps[this.memory.double]) && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49)
        return

      // 去目标房间
      if (this.room.name !== disRoomName || Game.shard.name !== data.shard) {
        this.arriveTo(new RoomPosition(24, 24, disRoomName), 23, data.shard, data.shardData)
        return
      }

      const creep = this.pos.findClosestByRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)))
      if (creep) {
        if (this.attack(creep) === ERR_NOT_IN_RANGE)
          this.goTo(creep.pos, 1)
      }
      else {
        this.goTo(new RoomPosition(24, 24, data.disRoom), 10)
      }

      // 支援旗帜 support_double
      const flag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('support_double')))
      if (flag) {
        const creeps = this.pos.findInRange(
          this.room.find(FIND_HOSTILE_CREEPS)
            .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 1)
        if (creeps[0])
          this.attack(creeps[0])

        this.goTo(flag.pos, 0)
        return
      }

      // 攻击建筑
      const attackFlag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('support_structure')))
      if (attackFlag) {
        const structure = attackFlag.pos.lookFor(LOOK_STRUCTURES)[0]
        if (structure) {
          if (this.attack(structure) === ERR_NOT_IN_RANGE)
            this.goTo(attackFlag.pos, 1)
        }
        else {
          attackFlag.remove()
        }
      }
    }

    else if (this.memory.role === 'double-heal' && this.memory.double) {
      const disCreepName = this.memory.double
      const portal = this.pos.findClosestByRange(this.room.getStructureWithType(STRUCTURE_PORTAL))

      // 跨 shard 信息更新 可以防止一些可能出现的 bug
      if (portal && data.shardData)
        this.updateShardAffirm()

      if (!Game.creeps[disCreepName] && portal) {
        this.arriveTo(new RoomPosition(25, 25, disRoomName), 20, data.shard, data.shardData)
        return
      }

      if (Game.creeps[this.memory.double])
        this.moveTo(Game.creeps[this.memory.double])

      // 寻找敌人 远程攻击
      const enemy = this.pos.findInRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 3)
      if (enemy[0])
        this.rangedAttack(enemy[0])

      // 奶
      if (Game.creeps[this.memory.double]) {
        if (this.hits < this.hitsMax
         || Game.creeps[this.memory.double].hits < Game.creeps[this.memory.double].hitsMax) {
          if (this.hits < Game.creeps[this.memory.double].hits) {
            this.heal(this)
          }
          else {
            if (this.pos.isNearTo(Game.creeps[this.memory.double]))
              this.heal(Game.creeps[this.memory.double])
            else this.rangedHeal(Game.creeps[this.memory.double])
          }
          return
        }
      }

      // 默认治疗攻击爬，如果周围有友军，在自身血量满的情况下治疗友军
      const allys = this.pos.findInRange(this.room.find(FIND_CREEPS)
        .filter(creep => (creep.my || Memory.whitelist?.includes(creep.owner.username)) && creep.hitsMax - creep.hits > 350), 3)
      if (allys.length > 0) {
        // 寻找最近的爬
        const ally = allys.reduce((a, b) => this.pos.getStraightDistanceTo(a.pos) < this.pos.getStraightDistanceTo(b.pos) ? a : b)
        if (this.pos.isNearTo(ally))
          this.heal(ally)
        else this.rangedHeal(ally)
      }
      else {
        if (Game.creeps[this.memory.double])
          this.heal(Game.creeps[this.memory.double])
        else this.heal(this)
      }
    }

    else if (this.memory.role === 'saio') {
      if (this.room.name !== disRoomName || Game.shard.name !== data.shard) {
        this.heal(this)
        this.arriveTo(new RoomPosition(24, 24, disRoomName), 23, data.shard, data.shardData)
        return
      }

      // 寻找敌人 远程攻击
      const enemy = this.pos.findInRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 3)
      const disenemy = enemy.find(creep => !creep.pos.getStructureWithType(STRUCTURE_RAMPART))
      if (disenemy) {
        if (this.pos.isNearTo(disenemy))
          this.rangedMassAttack()
        else if (this.pos.inRangeTo(disenemy, 3))
          this.rangedAttack(disenemy)
      }

      // 治疗自己和周围友军
      if (this.hits < this.hitsMax) {
        this.heal(this)
      }
      else {
        const allys = this.pos.findInRange(this.room.find(FIND_CREEPS)
          .filter(creep => (creep.my || Memory.whitelist?.includes(creep.owner.username)) && creep.hitsMax - creep.hits > 350), 3)
        if (allys.length > 0) {
          // 寻找最近的爬
          const ally = allys.reduce((a, b) => this.pos.getStraightDistanceTo(a.pos) < this.pos.getStraightDistanceTo(b.pos) ? a : b)
          if (this.pos.isNearTo(ally))
            this.heal(ally)
          else this.rangedHeal(ally)
        }
        else {
          this.heal(this)
        }
      }

      // 移动旗
      const moveFlag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('support_aio')))
      if (moveFlag) {
        this.heal(this)
        this.goTo(moveFlag.pos, 1)
        return
      }

      // 放风筝 计算自己奶量 敌对爬伤害
      if (enemy.length > 0 && !canSustain(enemy, this)) {
        // 放风筝 寻找最近的有攻击性的爬 离他远点
        const closestAttackCreep = this.pos.findClosestByPath(this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)
           && (creep.getActiveBodyparts('attack') > 0 || creep.getActiveBodyparts('ranged_attack') > 0)))
        if (closestAttackCreep)
          this.fleeFrom(closestAttackCreep.pos, 3)
        return
      }

      // 寻找最近的敌人攻击
      const closestCreep = this.pos.findClosestByPath(this.room.find(FIND_HOSTILE_CREEPS)
        .filter(creep => !Memory.whitelist?.includes(creep.owner.username) && !creep.pos.getStructureWithType(STRUCTURE_RAMPART)))
      if (closestCreep && !this.pos.isNearTo(closestCreep))
        this.goTo(closestCreep.pos, 3)
    }
  }

  /**
   * 双人小队 已测试 目前没有挂载战争信息模块和智能躲避
   */
  public handleDoubleMission(): void {
    const missionData = this.memory.missionData
    const id = missionData.id
    const data = missionData.Data
    if (!missionData)
      return

    const disRoomName = data.disRoom
    if (this.room.name === this.memory.belong) {
      if (this.memory.role === 'double-attack') {
        if (!this.processBoost(['move', 'attack', 'tough']))
          return
      }
      else if (this.memory.role === 'double-heal') {
        if (!this.processBoost(['move', 'heal', 'ranged_attack', 'tough']))
          return
      }
      else if (this.memory.role === 'double-dismantle') {
        if (!this.processBoost(['move', 'work', 'tough']))
          return
      }
    }

    if (!this.memory.double) {
      if (this.memory.role === 'double-heal') {
        // 由 heal 来进行组队
        if (Game.time % 7 === 0) {
          if (data.teamType !== 'attack' && data.teamType !== 'dismantle')
            return

          const disCreep = this.pos.findClosestByRange(
            this.room.find(FIND_MY_CREEPS)
              .filter(creep => creep.memory.role === (data.teamType === 'attack' ? 'double-attack' : 'double-dismantle') && !creep.memory.double))
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

    if (this.memory.role === 'double-attack') {
      if (!Game.creeps[this.memory.double])
        return

      if (this.fatigue || Game.creeps[this.memory.double].fatigue)
        return

      if (!this.pos.isNearTo(Game.creeps[this.memory.double]) && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49)
        return

      if (this.room.name !== disRoomName || Game.shard.name !== data.shard) {
        this.arriveTo(new RoomPosition(24, 24, disRoomName), 23, data.shard, data.shardData)
        return
      }

      // 对方开安全模式情况下 删除任务
      if (this.room.controller && this.room.controller.safeMode) {
        if (Game.shard.name === this.memory.shard) {
          const belongRoom = Game.rooms[this.memory.belong]
          belongRoom?.removeMission(id)
        }

        return
      }

      // 攻击离四格内离自己最近的爬
      const enemy = this.pos.findClosestByPath(
        this.pos.findInRange(this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username) && !creep.pos.getStructureWithType(STRUCTURE_RAMPART)), 4))
      if (enemy) {
        this.goTo(enemy.pos, 1)
        this.attack(enemy)
        return
      }

      // 没有发现敌人就攻击建筑物
      let attackFlag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('double_attack')))
      if (!attackFlag) {
        const structure = this.pos.findClosestByPath(this.room.find(FIND_HOSTILE_STRUCTURES)
          .filter(struct => !struct.pos.getStructureWithType(STRUCTURE_RAMPART)
           && ['nuker', 'spawn', 'terminal', 'extension', 'tower', 'link', 'observer', 'lab', 'powerspawn', 'factory'].includes(struct.structureType)))
        if (structure) {
          const randomStr = Math.random().toString(36).slice(3)
          if (!Game.flags[`double_attack_${randomStr}`]) {
            const flagName = structure.pos.createFlag(`double_attack_${randomStr}`)
            if (typeof flagName === 'string')
              attackFlag = Game.flags[flagName]
          }
        }
      }

      if (attackFlag) {
        // 有旗子就攻击旗子下的建筑
        const struct = attackFlag.pos.lookFor(LOOK_STRUCTURES)[0]
        // 没有建筑就删除旗帜
        if (!struct) {
          attackFlag.remove()
          return
        }

        if (this.attack(struct) === ERR_NOT_IN_RANGE)
          this.goTo(struct.pos, 1)

        return
      }

      // 还找不到就找重要的被 ram 覆盖的重要建筑攻击
      const coveredStruct = this.pos.findClosestByPath(
        this.room.getStructureWithType(STRUCTURE_RAMPART)
          .filter(struct => !struct.my && struct.pos.getStructureWithTypes(['spawn', 'tower', 'storage', 'terminal']).length > 0))
      if (coveredStruct) {
        this.say('⚔️', true)

        if (this.attack(coveredStruct) === ERR_NOT_IN_RANGE)
          this.goTo(coveredStruct.pos, 1)

        return
      }

      // 还找不到就直接找最近的 wall 或者 rampart 攻击
      const walls = this.pos.findClosestByPath(
        this.room.getStructureWithTypes([STRUCTURE_WALL, STRUCTURE_RAMPART])
          .filter(struct => !('my' in struct) || !struct.my))
      if (walls) {
        this.say('⚔️', true)

        if (this.attack(walls) === ERR_NOT_IN_RANGE)
          this.goTo(walls.pos, 1)
      }
    }

    else if (this.memory.role === 'double-dismantle') {
      if (!Game.creeps[this.memory.double])
        return

      if (this.fatigue || Game.creeps[this.memory.double].fatigue)
        return

      if (!this.pos.isNearTo(Game.creeps[this.memory.double]) && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49)
        return

      if (this.room.name !== disRoomName || Game.shard.name !== data.shard) {
        this.arriveTo(new RoomPosition(24, 24, disRoomName), 23, data.shard, data.shardData)
        return
      }

      // 对方开安全模式情况下 删除任务
      if (this.room.controller && this.room.controller.safeMode) {
        if (Game.shard.name === this.memory.shard) {
          const belongRoom = Game.rooms[this.memory.belong]
          belongRoom?.removeMission(id)
        }

        return
      }

      // 开始拆墙
      let attackFlag = this.pos.findClosestByPath(
        this.room.find(FIND_FLAGS)
          .filter(flag => flag.name.startsWith('double_dismantle')))
      if (!attackFlag) {
        const structure = this.pos.findClosestByPath(this.room.find(FIND_HOSTILE_STRUCTURES)
          .filter(struct => !struct.pos.getStructureWithType(STRUCTURE_RAMPART)
               && ['nuker', 'spawn', 'terminal', 'extension', 'tower', 'link', 'observer', 'lab', 'powerspawn', 'factory'].includes(struct.structureType)))
        if (structure) {
          const randomStr = Math.random().toString(36).slice(3)
          if (!Game.flags[`double_dismantle_${randomStr}`]) {
            const flagName = structure.pos.createFlag(`double_dismantle_${randomStr}`)
            if (typeof flagName === 'string')
              attackFlag = Game.flags[flagName]
          }
        }
      }

      if (attackFlag) {
        // 有旗子就攻击旗子下的建筑
        const struct = attackFlag.pos.lookFor(LOOK_STRUCTURES)[0]
        // 没有建筑就删除旗帜
        if (!struct) {
          attackFlag.remove()
          return
        }

        if (this.dismantle(struct) === ERR_NOT_IN_RANGE)
          this.goTo(struct.pos, 1)

        return
      }

      // 还找不到就找重要的被 ram 覆盖的重要建筑攻击
      const coveredStruct = this.pos.findClosestByPath(
        this.room.getStructureWithType(STRUCTURE_RAMPART)
          .filter(struct => !struct.my && struct.pos.getStructureWithTypes(['spawn', 'tower', 'storage', 'terminal']).length > 0))
      if (coveredStruct) {
        this.say('⚔️', true)

        if (this.dismantle(coveredStruct) === ERR_NOT_IN_RANGE)
          this.goTo(coveredStruct.pos, 1)

        return
      }

      // 还找不到就直接找最近的 wall 或者 rampart 攻击
      const walls = this.pos.findClosestByPath(
        this.room.getStructureWithTypes([STRUCTURE_WALL, STRUCTURE_RAMPART])
          .filter(struct => !('my' in struct) || !struct.my))
      if (walls) {
        this.say('⚔️', true)

        if (this.dismantle(walls) === ERR_NOT_IN_RANGE)
          this.goTo(walls.pos, 1)
      }
    }

    else {
      const disCreepName = this.memory.double
      const portal = this.pos.findClosestByRange(this.room.getStructureWithType(STRUCTURE_PORTAL))

      // 跨 shard 信息更新 可以防止一些可能出现的bug
      if (portal && data.shardData)
        this.updateShardAffirm()

      if (!Game.creeps[disCreepName] && portal) {
        this.arriveTo(new RoomPosition(25, 25, disRoomName), 20, data.shard, data.shardData)
        return
      }

      if (Game.creeps[this.memory.double])
        this.moveTo(Game.creeps[this.memory.double])

      // 寻找敌人 远程攻击
      const enemy = this.pos.findInRange(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)), 3)[0]
      if (enemy)
        this.rangedAttack(enemy)

      // 奶
      if (Game.creeps[this.memory.double]) {
        if (this.hits < this.hitsMax
         || Game.creeps[this.memory.double].hits < Game.creeps[this.memory.double].hitsMax) {
          if (this.hits < Game.creeps[this.memory.double].hits) {
            this.heal(this)
          }
          else {
            if (this.pos.isNearTo(Game.creeps[this.memory.double]))
              this.heal(Game.creeps[this.memory.double])
            else this.rangedHeal(Game.creeps[this.memory.double])
          }
          return
        }
      }

      // 默认治疗攻击爬，如果周围有友军，在自身血量满的情况下治疗友军
      const allys = this.pos.findInRange(this.room.find(FIND_CREEPS)
        .filter(creep => (creep.my || Memory.whitelist?.includes(creep.owner.username)) && creep.hitsMax - creep.hits > 350), 3)
      if (allys.length > 0) {
        // 寻找最近的爬
        const ally = allys.reduce((a, b) => this.pos.getStraightDistanceTo(a.pos) < this.pos.getStraightDistanceTo(b.pos) ? a : b)
        if (this.pos.isNearTo(ally))
          this.heal(ally)
        else this.rangedHeal(ally)
      }
      else {
        if (Game.creeps[this.memory.double])
          this.heal(Game.creeps[this.memory.double])
        else this.heal(this)
      }
    }
  }
}
