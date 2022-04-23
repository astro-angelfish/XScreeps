import { unzipPosition, zipPosition } from '@/utils'

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissionMineExtension extends Creep {
  /**
   * 外矿开采处理
   */
  public processOutineMission(): void {
    const creepMission = this.memory.missionData.Data

    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return
    const globalMission = belongRoom.getMissionById(this.memory.missionData.id)
    if (!globalMission) {
      this.say('找不到全局任务了！')
      this.memory.missionData = {}
      return
    }

    if (this.hits < this.hitsMax && globalMission.data.state === 2) {
      const enemy = this.room.find(FIND_HOSTILE_CREEPS)
        .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
      if (enemy.length > 0)
        globalMission.data.state = 3
    }

    if (this.memory.role === 'out-claim') {
      if (this.room.name !== creepMission.disRoom && !this.memory.disPos) {
        this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)

        if (this.room.name !== this.memory.belong) {
          // 如果是别人的房间就不考虑
          if (this.room.controller && this.room.controller.owner && this.room.controller.owner.username !== this.owner.username)
            return

          if (Memory.outMineData && Memory.outMineData[this.room.name]) {
            for (const i of Memory.outMineData[this.room.name].road) {
              const thisPos = unzipPosition(i)
              if (thisPos && thisPos.roomName === this.name && !thisPos.getStructure('road'))
                thisPos.createConstructionSite('road')
            }
          }
        }
      }

      if (!this.memory.disPos && this.room.name === creepMission.disRoom) {
        const controllerPos = this.room.controller?.pos
        if (!controllerPos) {
          console.log(`外矿分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${creepMission.id}`)
          Game.notify(`外矿分配到了一个没有控制器的房间，请检查！creep: ${this.name}, room: ${this.room.name}, missionId: ${creepMission.id}`)
          return
        }
        this.memory.disPos = zipPosition(controllerPos)
      }

      if (this.memory.disPos) {
        if (!this.memory.num)
          this.memory.num = 5000

        if (this.room.controller!.reservation?.ticksToEnd
         && this.room.controller!.reservation.username === this.owner.username
         && this.room.controller!.reservation.ticksToEnd <= this.memory.num) {
          const cores = this.room.getStructureWithType(STRUCTURE_INVADER_CORE)
          if (cores.length > 0)
            globalMission.data.state = 3
        }

        if (this.room.controller!.reservation?.ticksToEnd
         && this.room.controller!.reservation.username !== this.owner.username)
          globalMission.data.state = 3

        if (!this.pos.isNearTo(this.room.controller!)) {
          const controllerPos = unzipPosition(this.memory.disPos)!
          this.goTo(controllerPos, 1)
        }
        else {
          if (this.room.controller && (!this.room.controller.sign || (Game.time - this.room.controller.sign.time) > 100000)) {
            if (!['superbitch', 'ExtraDim'].includes(this.owner.username))
              this.signController(this.room.controller, `${this.owner.username}'s 🌾 room!  Auto clean, Please keep distance!`)
            else
              this.signController(this.room.controller, '躬耕陇亩')
          }

          // somygame 改
          if (this.room.controller!.reservation?.username === 'Invader' && this.room.controller!.reservation.ticksToEnd > 0)
            this.attackController(this.room.controller!)
          else
            this.reserveController(this.room.controller!)

          // 终
          if (Game.time % 91 === 0) {
            if (Memory.outMineData && Memory.outMineData[this.room.name]) {
              for (const i of Memory.outMineData[this.room.name].road) {
                const thisPos = unzipPosition(i) as RoomPosition

                if (thisPos.roomName === this.room.name && !thisPos.getStructure('road'))
                  thisPos.createConstructionSite('road')
              }
            }
          }
        }

        if (this.room.controller!.reservation)
          this.memory.num = this.room.controller!.reservation.ticksToEnd
      }
    }

    else if (this.memory.role === 'out-harvest') {
      if (!Game.rooms[creepMission.disRoom])
        return

      if (!Memory.outMineData[creepMission.disRoom] || Memory.outMineData[creepMission.disRoom].minepoint.length <= 0)
        return

      for (const point of Memory.outMineData[creepMission.disRoom].minepoint) {
        if (!point.bind)
          point.bind = {}
        if (!point.bind.harvest && !this.memory.bindpoint) {
          point.bind.harvest = this.name
          this.memory.bindpoint = point.pos
        }
      }
      if (!this.memory.bindpoint)
        return

      const disPos = unzipPosition(this.memory.bindpoint)
      if (!disPos)
        return
      const source = disPos.lookFor(LOOK_SOURCES)[0]
      if (!source)
        return

      this.processBasicWorkState('energy')

      if (this.memory.working) {
        const container = source.pos.findInRange(this.room.getStructureWithType(STRUCTURE_CONTAINER), 1)[0]
        if (container) {
          if (!this.pos.isEqualTo(container.pos)) {
            this.goTo(container.pos, 0)
          }
          else {
            if (container.hits < container.hitsMax) {
              this.repair(container)
              return
            }

            this.transfer(container, 'energy')
          }
          Memory.outMineData[creepMission.disRoom].car = true
        }
        else {
          Memory.outMineData[creepMission.disRoom].car = false

          const constainerSite = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1)
            .filter(site => site.structureType === STRUCTURE_CONTAINER)[0]
          if (constainerSite)
            this.build(constainerSite)
          else
            this.pos.createConstructionSite('container')
        }
      }

      else {
        if (!this.pos.isNearTo(disPos)) {
          this.goTo(disPos, 1)
          return
        }

        this.harvest(source)
      }
    }

    else if (this.memory.role === 'out-car') {
      if (!Game.rooms[creepMission.disRoom])
        return

      this.processBasicWorkState('energy')

      if (!Memory.outMineData[creepMission.disRoom] || Memory.outMineData[creepMission.disRoom].minepoint.length <= 0)
        return

      for (const point of Memory.outMineData[creepMission.disRoom].minepoint) {
        if (!point.bind.car && !this.memory.bindpoint) {
          point.bind.car = this.name
          this.memory.bindpoint = point.pos
        }
      }
      if (!this.memory.bindpoint)
        return

      const disPos = unzipPosition(this.memory.bindpoint)
      if (!disPos)
        return

      if (this.memory.working) {
        const stroage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
        if (!stroage)
          return

        if (!this.pos.isNearTo(stroage)) {
          const construsions = this.pos.findClosestByPath(
            this.room.find(FIND_MY_CONSTRUCTION_SITES)
              .filter(site => site.structureType === STRUCTURE_ROAD))
          if (construsions) {
            this.processBasicBuild(construsions)
            return
          }

          const road = this.pos.getStructure('road')
          if (road && road.hits < road.hitsMax) {
            this.repair(road)
            return
          }

          this.goTo(stroage.pos, 1)
        }

        else {
          this.transfer(stroage, 'energy')

          if (this.ticksToLive! < 100)
            this.suicide()
        }
      }

      else {
        const disRoom = Game.rooms[disPos.roomName]
        if (!disRoom) {
          this.goTo(disPos, 1)
          return
        }

        this.say('🚗', true)

        const container = disPos.findInRange(disRoom.getStructureWithType(STRUCTURE_CONTAINER), 3)[0]
        if (!container) {
          this.goTo(disPos, 1)
          return
        }

        if ((container.store.energy || 0) >= this.store.getCapacity()) {
          if (this.withdraw(container, 'energy') === ERR_NOT_IN_RANGE) {
            this.goTo(container.pos, 1)
            return
          }

          this.processBasicWithdraw(container, 'energy')
        }
        else {
          this.goTo(container.pos, 1)
        }
      }
    }

    else {
      if (this.hits < this.hitsMax)
        this.heal(this)

      if (this.room.name !== creepMission.disRoom) {
        this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)
        return
      }

      if (globalMission.data.state === 2) {
        const wounded = this.pos.findClosestByRange(
          this.room.find(FIND_MY_CREEPS)
            .filter(creep => creep.hits < creep.hitsMax && creep !== this))
        if (wounded) {
          if (!this.pos.isNearTo(wounded)) {
            this.goTo(wounded.pos, 1)
            return
          }

          this.heal(wounded)
        }
        return
      }

      const enemy = this.pos.findClosestByPath(
        this.room.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username)))
      if (enemy) {
        if (this.rangedAttack(enemy) === ERR_NOT_IN_RANGE)
          this.goTo(enemy.pos, 3)

        return
      }

      const invaderCore = this.pos.findClosestByPath(
        this.room.find(FIND_HOSTILE_STRUCTURES)
          .filter(struct => struct.structureType !== STRUCTURE_RAMPART))
      if (invaderCore) {
        this.memory.standed = true

        if (!this.pos.isNearTo(invaderCore)) {
          this.goTo(invaderCore.pos, 1)
          return
        }

        this.rangedMassAttack()
      }
    }
  }

  /**
   * power 采集
   */
  public processPowerMission(): void {
    this.notifyWhenAttacked(false)

    const creepMission = this.memory.missionData.Data

    const belongRoom = Game.rooms[creepMission.belongRoom]
    if (!belongRoom)
      return
    const globalMission = belongRoom.getMissionById(this.memory.missionData.id)
    if (!globalMission?.creepBind) {
      this.say('找不到全局任务了！')
      this.memory.missionData = {}
      return
    }

    const role = this.memory.role

    const missionPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
    if (!missionPostion) {
      this.say('找不到目标地点！')
      return
    }

    if (role === 'power-attack') {
      this.memory.standed = true

      if (globalMission.data.state === 1) {
        // 先组队
        if (!this.memory.double) {
          if (Game.time % 7 === 0) {
            if (globalMission.creepBind['power-heal'].bind.length > 0) {
              for (const c of globalMission.creepBind['power-heal'].bind) {
                if (Game.creeps[c]?.pos.roomName === this.room.name && !Game.creeps[c].memory.double) {
                  const disCreep = Game.creeps[c]
                  disCreep.memory.double = this.name
                  this.memory.double = disCreep.name
                }
              }
            }
          }

          return
        }

        // 附件没有治疗虫就等
        if (!Game.creeps[this.memory.double]) {
          this.suicide()
          return
        }

        if (!this.pos.isNearTo(Game.creeps[this.memory.double])
         && this.pos.x !== 0 && this.pos.x !== 49 && this.pos.y !== 0 && this.pos.y !== 49)
          return

        if (this.fatigue || Game.creeps[this.memory.double].fatigue)
          return

        // 先寻找 powerbank 周围的空点，并寻找空点上有没有人
        if (!this.pos.isNearTo(missionPostion)) {
          if (!Game.rooms[missionPostion.roomName]) {
            this.goTo(missionPostion, 1)
            return
          }

          const harvestVoid = missionPostion.getSourceVoid().filter(pos => !pos.lookFor(LOOK_CREEPS).length)
          if (harvestVoid.length > 0) {
            this.goTo(missionPostion, 1)
          }
          else {
            if (!missionPostion.inRangeTo(this.pos.x, this.pos.y, 3)) {
              this.goTo(missionPostion, 3)
            }
            else {
              if (Game.time % 10 === 0) {
                const powerbank = missionPostion.getStructure('powerBank')
                if (powerbank) {
                  const enemyCreeps = powerbank.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
                  if (enemyCreeps.length > 0 && powerbank && powerbank.hits < 600000)
                    globalMission.data.state = 2
                }
              }
            }
          }
        }

        else {
          // 这是被攻击了
          if (this.hits < 1500) {
            // 被攻击停止所有爬虫生产
            globalMission.creepBind['power-attack'].num = 0
            globalMission.creepBind['power-heal'].num = 0
            const hostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
            Game.notify(`[warning] 采集爬虫小队 ${this.name} 遭受 ${hostileCreep ? hostileCreep.owner.username : '不明'} 攻击，地点在 ${this.room.name}！已经停止该 power 爬虫孵化！`)
            return
          }

          if (!this.memory.tick)
            this.memory.tick = this.ticksToLive!

          const powerbank = missionPostion.getStructure('powerBank')
          if (powerbank) {
            this.attack(powerbank)

            // 快没有生命了就增加爬虫数量，以方便继续采集
            if ((powerbank.hits / 600) + 30 > this.ticksToLive!) {
              // 填充完毕就这么干
              if (globalMission.creepBind['power-attack'].num === 2
               && globalMission.creepBind['power-attack'].num === globalMission.creepBind['power-attack'].bind.length
               && globalMission.creepBind['power-heal'].num === globalMission.creepBind['power-heal'].bind.length) {
                globalMission.creepBind['power-attack'].num = 1
                globalMission.creepBind['power-heal'].num = 1
                if (globalMission.creepBind['power-attack'].bind.length < 2)
                  return
              }
              else {
                if (this.ticksToLive! < (1500 - this.memory.tick + 200)) {
                  globalMission.creepBind['power-attack'].num = 2
                  globalMission.creepBind['power-heal'].num = 2
                }
              }

              // 新增一层逻辑判断
              if (this.ticksToLive! < 40) {
                globalMission.creepBind['power-attack'].num = 1
                globalMission.creepBind['power-heal'].num = 1
              }
            }

            const enemyCreeps = powerbank.pos.findInRange(FIND_HOSTILE_CREEPS, 2)
            if (enemyCreeps.length === 0 && powerbank.hits < 280000)
              globalMission.data.state = 2
            else if (enemyCreeps.length > 0 && powerbank.hits < 550000)
              globalMission.data.state = 2
          }
          // 说明过期了，删除任务，自杀
          else {
            for (const ii in globalMission.creepBind) {
              for (const jj of globalMission.creepBind[ii].bind)
                Game.creeps[jj].suicide()
            }
            belongRoom.removeMission(globalMission.id)
          }
        }
      }

      else {
        if (!this.pos.isNearTo(missionPostion)) {
          this.goTo(missionPostion, 1)
          return
        }

        // 没有 powerbank 说明已经打掉了
        const powerbank = missionPostion.getStructure('powerBank')
        if (!powerbank) {
          this.suicide()
          return
        }

        this.attack(powerbank)
      }
    }

    else if (role === 'power-heal') {
      if (!this.memory.double)
        return

      if (Game.creeps[this.memory.double]) {
        if (this.hits < this.hitsMax) {
          this.heal(this)
          return
        }

        if (Game.creeps[this.memory.double].hits < Game.creeps[this.memory.double].hitsMax)
          this.heal(Game.creeps[this.memory.double])

        if (!this.pos.inRangeTo(missionPostion, 3)) {
          this.memory.standed = false

          this.goTo(Game.creeps[this.memory.double].pos, 1)
        }
        else {
          this.memory.standed = true

          if (!this.pos.isNearTo(Game.creeps[this.memory.double]))
            this.goTo(Game.creeps[this.memory.double].pos, 1)
        }
      }
      else {
        this.suicide()
      }
    }

    else if (role === 'power-carry') {
      this.processBasicWorkState('power')

      if (!this.memory.working) {
        if (!this.pos.inRangeTo(missionPostion, 5)) {
          this.goTo(missionPostion, 5)
          return
        }

        // 寻找 powerbank
        const powerbank = missionPostion.getStructure('powerBank')
        if (powerbank) {
          this.goTo(missionPostion, 4)
          if (!this.memory.standed)
            this.memory.standed = true
          return
        }

        // 寻找掉落资源
        // 优先寻找 ruin
        const ruin = missionPostion.lookFor(LOOK_RUINS)[0]
        if ((ruin.store.power || 0) > 0) {
          if (this.memory.standed)
            this.memory.standed = false

          if (!this.pos.isNearTo(ruin)) {
            this.goTo(ruin.pos, 1)
            return
          }

          this.withdraw(ruin, 'power')
          return
        }

        const dropPower = missionPostion.lookFor(LOOK_RESOURCES).filter(r => r.resourceType === 'power')[0]
        if (dropPower) {
          if (this.memory.standed)
            this.memory.standed = true

          if (!this.pos.isNearTo(dropPower)) {
            this.goTo(dropPower.pos, 1)
            return
          }

          this.pickup(dropPower)
          return
        }

        // 说明没有资源了
        if ((this.store.power || 0) > 0)
          this.memory.working = true

        if (!ruin && !dropPower && (this.store.power || 0) <= 0)
          this.suicide()
      }

      else {
        const belongRoom = Game.rooms[this.memory.belong]
        if (!belongRoom)
          return

        const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
        if (!storage)
          return

        if (!this.pos.isNearTo(storage)) {
          this.goTo(storage.pos, 1)
          return
        }

        this.transfer(storage, 'power')
        this.suicide()
      }
    }
  }

  /**
   * deposit 采集任务处理
   */
  public processDepositMission(): void {
    this.notifyWhenAttacked(false)

    const creepMission = this.memory.missionData.Data

    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    if (!belongRoom.getMissionById(this.memory.missionData.id)) {
      this.memory.missionData = {}
      return
    }

    if (!creepMission)
      return

    // 判断是否正在遭受攻击
    if (this.hits < this.hitsMax / 2) {
      const hcreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
      Game.notify(`来自 ${this.memory.belong} 的商品爬虫在房间 ${this.room.name} 遭受攻击，攻击者疑似为 ${hcreep?.owner.username || '不明生物'}`)
    }

    this.processBasicWorkState(creepMission.rType)

    if (this.memory.working) {
      const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
      if (!storage)
        return

      if (!this.pos.isNearTo(storage)) {
        this.goTo(storage.pos, 1)
        return
      }

      this.transfer(storage, creepMission.rType)
      belongRoom.removeMission(this.memory.missionData.id)
      this.suicide()
    }

    else {
      const missionPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
      if (!missionPostion) {
        this.say('找不到目标地点！')
        return
      }

      if (!this.pos.isNearTo(missionPostion)) {
        if (!Game.rooms[missionPostion.roomName]) {
          this.goTo(missionPostion, 1)
          return
        }

        const harvestVoid: RoomPosition[] = missionPostion.getSourceVoid().filter(p => !p.lookFor(LOOK_CREEPS).length)
        if (harvestVoid.length > 0) {
          this.goTo(missionPostion, 1)
          return
        }

        if (!missionPostion.inRangeTo(this.pos.x, this.pos.y, 3))
          this.goTo(missionPostion, 3)
      }

      else {
        if (!this.memory.tick)
          this.memory.tick = this.ticksToLive!

        if (this.ticksToLive! < (1500 - this.memory.tick + 70) && (this.store[creepMission.rType as ResourceConstant] || 0) > 0)
          this.memory.working = true

        // 开始采集
        const deposit = missionPostion.lookFor(LOOK_DEPOSITS)[0]
        if (deposit) {
          if (!deposit.cooldown)
            this.harvest(deposit)
        }
        else {
          belongRoom.removeMission(this.memory.missionData.id)
        }
      }
    }
  }
}
