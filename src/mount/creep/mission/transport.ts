/* 爬虫原型拓展   --任务  --搬运工任务 */

export default class CreepMissionTransportExtension extends Creep {
  public handle_feed(): void {
    if (!this.room.memory.structureIdData.storageID)
      return
    const storage_ = Game.getObjectById(this.room.memory.structureIdData.storageID as string) as StructureStorage
    if (!storage_)
      return
    this.workstate('energy')
    for (const r in this.store) {
      if (r != 'energy') {
        this.say('🚽')
        /* 如果是自己的房间，则优先扔到最近的storage去 */
        if (this.room.name == this.memory.belong) {
          if (!this.room.memory.structureIdData.storageID)
            return
          const storage = Game.getObjectById(this.room.memory.structureIdData.storageID) as StructureStorage
          if (!storage)
            return
          if (storage.store.getUsedCapacity() > this.store.getUsedCapacity())
            this.transfer_(storage, r as ResourceConstant)

          else return
        }
        return
      }
    }
    if (this.memory.working) {
      this.say('🍉')
      const extensions = this.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == 'spawn' || structure.structureType == 'extension') && structure.store.getFreeCapacity('energy') > 0
        },
      })
      if (extensions) {
        if (this.transfer(extensions, 'energy') == ERR_NOT_IN_RANGE)
          this.goTo(extensions.pos, 1)
      }
      else {
        /* 完成就删除任务和自己的记忆 */
        Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
    }
    else {
      // 优先提取storage里的能量 不够提取terminal里的
      if (storage_.store.energy >= this.store.getCapacity()) { this.withdraw_(storage_, 'energy') }
      else {
        const terminal_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.terminalID) as StructureTerminal
        if (terminal_ && terminal_.store.getUsedCapacity('energy') >= this.store.getCapacity())
          this.withdraw_(terminal_, 'energy')
      }
    }
  }

  /* 物资运输任务  已测试 */
  public handle_carry(): void {
    const Data = this.memory.missionData.Data
    /* 数据不全拒绝执行任务 */
    if (!Data || Object.keys(Data).length < 7) {
      Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
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
          this.say('🚽')
          /* 如果是自己的房间，则优先扔到最近的storage去 */
          if (this.room.name == this.memory.belong) {
            if (!this.room.memory.structureIdData.storageID)
              return
            var storage = Game.getObjectById(this.room.memory.structureIdData.storageID) as StructureStorage
            if (!storage)
              return
            if (storage.store.getFreeCapacity() > this.store.getUsedCapacity(r as ResourceConstant))
              this.transfer_(storage, r as ResourceConstant)

            else return
          }
          return
        }
      }
      if (Data.num) {
        /* 如果指定了num-- 任务结束条件：[搬运了指定num] */
        if (this.memory.working) {
          var thisPos = new RoomPosition(Data.targetPosX, Data.targetPosY, Data.targetRoom)
          if (!thisPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }
          if (!this.pos.isNearTo(thisPos)) { this.goTo(thisPos, 1) }
          else {
            /* 寻找 */
            var targets = thisPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              var target = targets[0]
              var capacity = this.store[Data.rType]
              /* 如果送货正确，就减少房间主任务中的num，num低于0代表任务完成 */
              if (this.transfer(target, Data.rType) == OK) {
                var thisMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)
                if (thisMission) {
                  thisMission.data.num -= capacity
                  if (thisMission.data.num <= 0)
                    Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                }
              }
              else {
                /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
              }
            }
            else {
              Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
          }
        }
        else {
          /*  */
          var disPos = new RoomPosition(Data.sourcePosX, Data.sourcePosY, Data.sourceRoom)
          if (!disPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }
          if (!this.pos.isNearTo(disPos)) { this.goTo(disPos, 1) }
          else {
            var targets = disPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              var target = targets[0] as StructureStorage
              if ((!target.store || target.store[Data.rType] == 0) && this.store.getUsedCapacity(Data.rType) <= 0) {
                /* 如果发现没资源了，就取消搬运任务 */
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                return
              }
              /* 如果已经没资源了 */
              var thisMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)
              if (thisMission.data.num < this.store.getCapacity() && target.store[Data.rType] && target.store[Data.rType] >= thisMission.data.num) {
                this.withdraw(target, Data.rType, thisMission.data.num)
                this.memory.working = true
                return
              }
              if (target.store.getUsedCapacity(Data.rType) < this.store.getUsedCapacity()) {
                this.withdraw(target, Data.rType)
                this.memory.working = true
                return
              }
              if (this.withdraw(target, Data.rType) == ERR_NOT_ENOUGH_RESOURCES)
                this.memory.working = true
            }
          }
        }
      }
      else {
        /* 未指定数目-- 任务结束条件：[source 空了 或 target 满了] */
        if (this.memory.working) {
          var thisPos = new RoomPosition(Data.targetPosX, Data.targetPosY, Data.targetRoom)
          if (!thisPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }
          if (!this.pos.isNearTo(thisPos)) { this.goTo(thisPos, 1) }
          else {
            /* 寻找 */
            var targets = thisPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              var target = targets[0]
              var capacity = this.store[Data.rType]
              if (this.transfer(target, Data.rType) != OK) {
                /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                return
              }
              // 对于类似于防御塔正在使用能量的任务
              if (target.store.getFreeCapacity() < 50)
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
            else {
              Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
          }
        }
        else {
          /* 清除杂质 */
          for (var r in this.store) {
            if (r != Data.rType) {
              this.say('🚽')
              /* 如果是自己的房间，则优先扔到最近的storage去 */
              if (this.room.name == this.memory.belong) {
                if (!this.room.memory.structureIdData.storageID)
                  return
                var storage = Game.getObjectById(this.room.memory.structureIdData.storageID) as StructureStorage
                if (!storage)
                  return
                if (storage.store.getUsedCapacity() > this.store.getUsedCapacity())
                  this.transfer_(storage, r as ResourceConstant)

                else return
              }
              return
            }
          }
          /*  */
          var disPos = new RoomPosition(Data.sourcePosX, Data.sourcePosY, Data.sourceRoom)
          if (!disPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }
          if (!this.pos.isNearTo(disPos)) { this.goTo(disPos, 1) }
          else {
            var targets = disPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              var target = targets[0]

              if ((!target.store || target.store[Data.rType] == 0) && this.store.getUsedCapacity(Data.rType) == 0) {
                /* 如果发现没资源了，就取消搬运任务 */
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
              }
              else {
                this.withdraw(target, Data.rType)
                this.memory.working = true
              }
            }
          }
        }
      }
    }
    else {
      this.say('📦')
      /* 未指定资源类型 */
      /* working状态转换条件 */
      if (!this.memory.working)
        this.memory.working = false
      if (this.memory.working) {
        if (!this.store || Object.keys(this.store).length <= 0)
          this.memory.working = false
      }
      else {
        if (this.store.getFreeCapacity() == 0)
          this.memory.working = true
      }
      if (Data.num) {
        /* 不考虑这种类型的任务 */
        Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
      }
      else {
        /* 只考虑这种任务 */
        if (this.memory.working) {
          var thisPos = new RoomPosition(Data.targetPosX, Data.targetPosY, Data.targetRoom)
          if (!thisPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }
          if (!this.pos.isNearTo(thisPos)) { this.goTo(thisPos, 1) }
          else {
            /* 寻找 */
            var targets = thisPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              var target = targets[0]
              var capacity = this.store[Data.rType]
              /* 如果送货正确，就减少房间主任务中的num，num低于0代表任务完成 */
              for (const i in this.store) {
                if (this.transfer(target, i as ResourceConstant) != OK) {
                  /* 目标满了、不是正确目标、目标消失了也代表任务完成 */
                  Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                  return
                }
              }
            }
            else {
              Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
          }
        }
        else {
          var disPos = new RoomPosition(Data.sourcePosX, Data.sourcePosY, Data.sourceRoom)
          if (!disPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }
          if (!this.pos.isNearTo(disPos)) { this.goTo(disPos, 1) }
          else {
            var targets = disPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            const ruin = disPos.getRuin()
            if (targets.length > 0 || ruin) {
              var target = targets[0] as StructureStorage
              const targetR = ruin as Ruin
              if (target) {
                if (!target.store || target.store.getUsedCapacity() == 0) {
                  /* 如果发现没资源了，就取消搬运任务 */
                  Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                  return
                }
                for (var t in target.store)
                  this.withdraw(target, t as ResourceConstant)

                return
              }
              if (targetR) {
                if (!targetR.store || targetR.store.getUsedCapacity() == 0) {
                  /* 如果发现没资源了，就取消搬运任务 */
                  Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                  return
                }
                for (var t in targetR.store)
                  this.withdraw(targetR, t as ResourceConstant)
              }
            }
          }
        }
      }
    }
  }
}
