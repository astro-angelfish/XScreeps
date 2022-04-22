import { isInArray, unzipPosition, zipPosition } from '@/utils'

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissionMineExtension extends Creep {
  /* 外矿开采处理 */
  public handle_outmine(): void {
    const creepMission = this.memory.missionData.Data
    const globalMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)
    if (!globalMission) { this.say('找不到全局任务了！'); this.memory.missionData = {}; return }
    if (this.hits < this.hitsMax && globalMission.data.state == 2) {
      var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
        filter: (creep) => {
          return !isInArray(Memory.whitelist, creep.owner.username)
        },
      })
      if (enemy)
        globalMission.data.state = 3
    }
    if (this.memory.role == 'out-claim') {
      if (this.room.name != creepMission.disRoom && !this.memory.disPos) {
        this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)
        if (this.room.name != this.memory.belong) {
          /* 如果是别人的房间就不考虑 */
          if (this.room.controller && this.room.controller.owner && this.room.controller.owner.username != this.owner.username)
            return
          if (Memory.outMineData && Memory.outMineData[this.room.name]) {
            for (var i of Memory.outMineData[this.room.name].road) {
              var thisPos = unzipPosition(i)
              if (thisPos.roomName == this.name && !thisPos.GetStructure('road'))
                thisPos.createConstructionSite('road')
            }
          }
        }
      }
      if (!this.memory.disPos && this.room.name == creepMission.disRoom) {
        var controllerPos = this.room.controller.pos
        this.memory.disPos = zipPosition(controllerPos)
      }
      if (this.memory.disPos) {
        if (!this.memory.num)
          this.memory.num = 5000
        if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd && this.room.controller.reservation.username == this.owner.username && this.room.controller.reservation.ticksToEnd <= this.memory.num) {
          const Cores = this.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType == STRUCTURE_INVADER_CORE
            },
          })
          if (Cores.length > 0)
            globalMission.data.state = 3
        }
        if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd && this.room.controller.reservation.username != this.owner.username)
          globalMission.data.state = 3

        if (!this.pos.isNearTo(this.room.controller)) {
          var controllerPos = unzipPosition(this.memory.disPos)
          this.goTo(controllerPos, 1)
        }
        else {
          if (this.room.controller && (!this.room.controller.sign || (Game.time - this.room.controller.sign.time) > 100000)) {
            if (!['superbitch', 'ExtraDim'].includes(this.owner.username))
              this.signController(this.room.controller, `${this.owner.username}'s 🌾 room!  Auto clean, Please keep distance!`)

            else
              this.signController(this.room.controller, '躬耕陇亩')
          }
          /* somygame 改 */
          let _reserve_state = 0
          if (this.room.controller.reservation) {
            if (this.room.controller.reservation.username == 'Invader' && this.room.controller.reservation.ticksToEnd > 0) {
              this.attackController(this.room.controller)
              _reserve_state = 1
            }
          }
          if (_reserve_state < 1)
            this.reserveController(this.room.controller)

          /* 终 */
          if (Game.time % 91 == 0) {
            if (Memory.outMineData && Memory.outMineData[this.room.name]) {
              for (var i of Memory.outMineData[this.room.name].road) {
                var thisPos = unzipPosition(i) as RoomPosition

                if (thisPos.roomName == this.room.name && !thisPos.GetStructure('road'))
                  thisPos.createConstructionSite('road')
              }
            }
          }
        }
        if (this.room.controller.reservation)
          this.memory.num = this.room.controller.reservation.ticksToEnd
      }
    }
    else if (this.memory.role == 'out-harvest') {
      if (!Memory.outMineData[creepMission.disRoom] || Memory.outMineData[creepMission.disRoom].minepoint.length <= 0)
        return
      for (var point of Memory.outMineData[creepMission.disRoom].minepoint) {
        if (!point.bind)
          point.bind = {}
        if (!point.bind.harvest && !this.memory.bindpoint) {
          point.bind.harvest = this.name
          this.memory.bindpoint = point.pos
        }
      }
      if (!this.memory.bindpoint)
        return
      var disPos = unzipPosition(this.memory.bindpoint)
      const source = disPos.lookFor(LOOK_SOURCES)[0]
      if (!source)
        return
      this.processBasicWorkState('energy')
      if (this.memory.working) {
        var container_ = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (stru) => { return stru.structureType == 'container' } }) as StructureContainer[]
        if (container_[0]) {
          if (!this.pos.isEqualTo(container_[0].pos)) { this.goTo(container_[0].pos, 0) }
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
          const constainer_constru = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, { filter: (stru) => { return stru.structureType == 'container' } })
          if (constainer_constru[0])
            this.build(constainer_constru[0])

          else
            this.pos.createConstructionSite('container')
        }
      }
      else {
        if (!this.pos.isNearTo(disPos))
          this.goTo(disPos, 1)
        else this.harvest(source)
      }
    }
    else if (this.memory.role == 'out-car') {
      this.processBasicWorkState('energy')
      if (!Memory.outMineData[creepMission.disRoom] || Memory.outMineData[creepMission.disRoom].minepoint.length <= 0)
        return
      for (var point of Memory.outMineData[creepMission.disRoom].minepoint) {
        if (!point.bind.car && !this.memory.bindpoint) {
          point.bind.car = this.name
          this.memory.bindpoint = point.pos
        }
      }
      if (!this.memory.bindpoint)
        return
      var disPos = unzipPosition(this.memory.bindpoint)
      if (this.memory.working) {
        const stroage_ = global.structureCache[this.memory.belong].storage as StructureStorage
        if (!stroage_)
          return
        if (!this.pos.isNearTo(stroage_)) {
          const construsions = this.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
            filter: (constr) => {
              return constr.structureType == 'road'
            },
          })
          if (construsions) {
            this.processBasicBuild(construsions)
            return
          }
          const road_ = this.pos.getStructure('road')
          if (road_ && road_.hits < road_.hitsMax) {
            this.repair(road_)
            return
          }
          this.goTo(stroage_.pos, 1)
        }
        else {
          this.transfer(stroage_, 'energy')
          if (this.ticksToLive < 100)
            this.suicide()
        }
      }
      else {
        if (!Game.rooms[disPos.roomName]) {
          this.goTo(disPos, 1)
          return
        }
        this.say('🚗', true)
        var container_ = disPos.findInRange(FIND_STRUCTURES, 3, {
          filter: (stru) => {
            return stru.structureType == 'container'
          },
        }) as StructureContainer[]
        if (container_[0] && container_[0].store.getUsedCapacity('energy') >= this.store.getCapacity()) {
          if (this.withdraw(container_[0], 'energy') == ERR_NOT_IN_RANGE) {
            this.goTo(container_[0].pos, 1)
            return
          }
          this.processBasicWithdraw(container_[0], 'energy')
        }
        else if (container_[0] && container_[0].store.getUsedCapacity('energy') < this.store.getCapacity()) {
          this.goTo(container_[0].pos, 1)
        }
        else if (!container_[0]) {
          this.goTo(disPos, 1)
        }
      }
    }
    else {
      if (this.hits < this.hitsMax)
        this.heal(this)
      if (this.room.name != creepMission.disRoom) {
        this.goTo(new RoomPosition(25, 25, creepMission.disRoom), 20)
      }
      else {
        if (globalMission.data.state == 2) {
          const wounded = this.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => {
              return creep.hits < creep.hitsMax && creep != this
            },
          })
          if (wounded) {
            if (!this.pos.isNearTo(wounded))
              this.goTo(wounded.pos, 1)
            this.heal(wounded)
          }
          return
        }
        var enemy = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
          filter: (creep) => {
            return !isInArray(Memory.whitelist, creep.owner.username)
          },
        })
        if (enemy) {
          if (this.rangedAttack(enemy) == ERR_NOT_IN_RANGE)
            this.goTo(enemy.pos, 3)

          return
        }
        const InvaderCore = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
          filter: (stru) => {
            return stru.structureType != 'rampart'
          },
        })
        if (InvaderCore) {
          this.memory.standed = true
          if (!this.pos.isNearTo(InvaderCore))
            this.goTo(InvaderCore.pos, 1)
          else this.rangedMassAttack()
        }
      }
    }
  }

  /* power采集 */
  public handle_power(): void {
    this.notifyWhenAttacked(false)
    const creepMission = this.memory.missionData.Data
    const globalMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)
    if (!globalMission) { this.say('找不到全局任务了！'); this.memory.missionData = {}; return }
    const role = this.memory.role
    const missionPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
    if (!missionPostion) { this.say('找不到目标地点！'); return }
    if (role == 'power-attack') {
      this.memory.standed = true
      if (globalMission.data.state == 1) {
        /* 先组队 */
        if (!this.memory.double) {
          if (Game.time % 7 == 0) {
            if (globalMission.creepBind['power-heal'].bind.length > 0) {
              for (const c of globalMission.creepBind['power-heal'].bind) {
                if (Game.creeps[c] && Game.creeps[c].pos.roomName == this.room.name && !Game.creeps[c].memory.double) {
                  const disCreep = Game.creeps[c]
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
        /* 先寻找powerbank周围的空点，并寻找空点上有没有人 */
        if (!this.pos.isNearTo(missionPostion)) {
          if (!Game.rooms[missionPostion.roomName]) {
            this.goTo(missionPostion, 1)
            return
          }
          const harvest_void: RoomPosition[] = missionPostion.getSourceVoid()
          const active_void: RoomPosition[] = []
          for (const v of harvest_void) {
            const creep_ = v.lookFor(LOOK_CREEPS)
            if (creep_.length <= 0)
              active_void.push(v)
          }
          if (active_void.length > 0) {
            this.goTo(missionPostion, 1)
          }
          else {
            if (!missionPostion.inRangeTo(this.pos.x, this.pos.y, 3)) { this.goTo(missionPostion, 3) }
            else {
              if (Game.time % 10 == 0) {
                var powerbank_ = missionPostion.getStructure('powerBank')
                if (powerbank_) {
                  var enemy_creep = powerbank_.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
                  if (enemy_creep.length > 0 && powerbank_ && powerbank_.hits < 600000)
                    globalMission.data.state = 2
                }
              }
            }
          }
        }
        else {
          /* 这是被攻击了 */
          if (this.hits < 1500) {
            /* 被攻击停止所有爬虫生产 */
            globalMission.creepBind['power-attack'].num = 0
            globalMission.creepBind['power-heal'].num = 0
            const hostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
            Game.notify(`[warning] 采集爬虫小队${this.name}遭受${hostileCreep ? hostileCreep.owner.username : '不明'}攻击，地点在${this.room.name}！已经停止该power爬虫孵化！`)
            return
          }
          if (!this.memory.tick)
            this.memory.tick = this.ticksToLive
          var powerbank_ = missionPostion.getStructure('powerBank')
          if (powerbank_) {
            this.attack(powerbank_)
            if ((powerbank_.hits / 600) + 30 > this.ticksToLive) // 快没有生命了就增加爬虫数量，以方便继续采集
            {
              /* 填充完毕就这么干 */

              if (globalMission.creepBind['power-attack'].num == 2 && globalMission.creepBind['power-attack'].num == globalMission.creepBind['power-attack'].bind.length && globalMission.creepBind['power-heal'].num == globalMission.creepBind['power-heal'].bind.length) {
                globalMission.creepBind['power-attack'].num = 1
                globalMission.creepBind['power-heal'].num = 1
                if (globalMission.creepBind['power-attack'].bind.length < 2)
                  return
              }
              else {
                if (this.ticksToLive < (1500 - this.memory.tick + 200)) {
                  globalMission.creepBind['power-attack'].num = 2
                  globalMission.creepBind['power-heal'].num = 2
                }
              }
              /* 新增一层逻辑判断 */
              if (this.ticksToLive < 40) {
                globalMission.creepBind['power-attack'].num = 1
                globalMission.creepBind['power-heal'].num = 1
              }
            }
            var enemy_creep = powerbank_.pos.findInRange(FIND_HOSTILE_CREEPS, 2)
            if (enemy_creep.length == 0 && powerbank_.hits < 280000)
              globalMission.data.state = 2

            else if (enemy_creep.length > 0 && powerbank_.hits < 550000)
              globalMission.data.state = 2
          }
          else {
            /* 说明过期了，删除任务，自杀 */
            for (const ii in globalMission.creepBind) {
              for (const jj of globalMission.creepBind[ii].bind)
                Game.creeps[jj].suicide()
            }
            Game.rooms[this.memory.belong].removeMission(globalMission.id)
          }
        }
      }
      else {
        if (!this.pos.isNearTo(missionPostion)) {
          this.goTo(missionPostion, 1)
          return
        }
        /* 没有powerbank说明已经打掉了 */
        var powerbank_ = missionPostion.getStructure('powerBank')
        if (!powerbank_)
          this.suicide()
        else this.attack(powerbank_)
      }
    }
    else if (role == 'power-heal') {
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
          if (this.room.name == this.memory.belong)
            this.moveTo(Game.creeps[this.memory.double].pos)
          else
            this.moveTo(Game.creeps[this.memory.double].pos)
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
    else if (role == 'power-carry') {
      this.processBasicWorkState('power')
      if (!this.memory.working) {
        if (!this.pos.inRangeTo(missionPostion, 5)) {
          this.goTo(missionPostion, 5)
        }
        else {
          /* 寻找powerbank */
          var powerbank_ = missionPostion.getStructure('powerBank')
          if (powerbank_) {
            this.goTo(missionPostion, 4)
            if (!this.memory.standed)
              this.memory.standed = true
          }
          else {
            /* 寻找掉落资源 */
            /* 优先寻找ruin */
            const ruins = missionPostion.lookFor(LOOK_RUINS)
            if (ruins.length > 0 && ruins[0].store.getUsedCapacity('power') > 0) {
              if (this.memory.standed)
                this.memory.standed = false
              if (!this.pos.isNearTo(ruins[0]))
                this.goTo(ruins[0].pos, 1)
              else this.withdraw(ruins[0], 'power')
              return
            }
            const drop_power = missionPostion.lookFor(LOOK_RESOURCES)
            if (drop_power.length > 0) {
              for (const i of drop_power) {
                if (i.resourceType == 'power') {
                  if (this.memory.standed)
                    this.memory.standed = true
                  if (!this.pos.isNearTo(i))
                    this.goTo(i.pos, 1)
                  else this.pickup(i)
                  return
                }
              }
            }
            /* 说明没有资源了 */
            if (this.store.getUsedCapacity('power') > 0)
              this.memory.working = true
            if (ruins.length <= 0 && drop_power.length <= 0 && this.store.getUsedCapacity('power') <= 0)
              this.suicide()
          }
        }
      }
      else {
        const storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.storageID) as StructureStorage
        if (!storage_)
          return
        if (!this.pos.isNearTo(storage_)) { this.goTo(storage_.pos, 1) }
        else {
          this.transfer(storage_, 'power')
          this.suicide()
        }
      }
    }
  }

  /* deposit采集任务处理 */
  public handle_deposit(): void {
    this.notifyWhenAttacked(false)
    const creepMission = this.memory.missionData.Data
    if (!Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)) { this.memory.missionData = {}; return }
    if (!creepMission)
      return
    /* 判断是否正在遭受攻击 */
    if (this.hits < this.hitsMax / 2) {
      const hcreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
      Game.notify(`来自${this.memory.belong}的商品爬虫在房间${this.room.name}遭受攻击,攻击者疑似为${hcreep ? hcreep.owner.username : '不明生物'}`)
    }
    this.processBasicWorkState(creepMission.rType)
    if (this.memory.working) {
      const storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.storageID) as StructureStorage
      if (!storage_)
        return
      if (!this.pos.isNearTo(storage_)) { this.goTo(storage_.pos, 1) }
      else {
        this.transfer(storage_, creepMission.rType)
        Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
        this.suicide()
      }
    }
    else {
      const missionPostion = new RoomPosition(creepMission.x, creepMission.y, creepMission.room)
      if (!missionPostion) { this.say('找不到目标地点！'); return }
      if (!this.pos.isNearTo(missionPostion)) {
        if (!Game.rooms[missionPostion.roomName]) {
          this.goTo(missionPostion, 1)
          return
        }
        const harvest_void: RoomPosition[] = missionPostion.getSourceVoid()
        const active_void: RoomPosition[] = []
        for (const v of harvest_void) {
          const creep_ = v.lookFor(LOOK_CREEPS)
          if (creep_.length <= 0)
            active_void.push(v)
        }
        if (active_void.length > 0) {
          this.goTo(missionPostion, 1)
        }
        else {
          if (!missionPostion.inRangeTo(this.pos.x, this.pos.y, 3))
            this.goTo(missionPostion, 3)
        }
      }
      else {
        if (!this.memory.tick)
          this.memory.tick = this.ticksToLive
        if (this.ticksToLive < (1500 - (this.memory.tick ? this.memory.tick : 1000) + 70) && this.store.getUsedCapacity(creepMission.rType) > 0)
          this.memory.working = true

        /* 开始采集 */
        const deposit_ = missionPostion.lookFor(LOOK_DEPOSITS)[0] as Deposit
        if (deposit_) {
          if (!deposit_.cooldown)
            this.harvest(deposit_)
        }
        else {
          Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
        }
      }
    }
  }
}
