/* 爬虫原型拓展   --任务  --搬运工任务 */

export default class CreepMissionTransportExtension extends Creep {
  public processFeedMission(): void {
    if (!this.room.memory.structureIdData?.storageID)
      return
    const storage = Game.getObjectById(this.room.memory.structureIdData.storageID)
    if (!storage)
      return

    this.processBasicWorkState('energy')

    for (const r in this.store) {
      if (r !== 'energy') {
        this.say('🚽')

        // 如果是自己的房间，则优先扔到最近的 storage 去
        if (this.room.name === this.memory.belong) {
          if (storage && storage.store.getUsedCapacity() > this.store.getUsedCapacity())
            this.processBasicTransfer(storage, r as ResourceConstant)
        }

        return
      }
    }

    if (this.memory.working) {
      this.say('🍉')

      const extension = this.pos.findClosestByRange(
        this.room.getStructureWithTypes([STRUCTURE_SPAWN, STRUCTURE_EXTENSION])
          .filter(struct => struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0))
      if (extension) {
        this.processBasicTransfer(extension, RESOURCE_ENERGY)
      }
      else {
        // 完成就删除任务和自己的记忆
        Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
    }

    else {
      // 优先提取 storage 里的能量 不够提取 terminal 里的
      if (storage.store.energy >= this.store.getCapacity()) {
        this.processBasicWithdraw(storage, RESOURCE_ENERGY)
      }
      else {
        const terminal = this.room.memory.structureIdData.terminalID ? Game.getObjectById(this.room.memory.structureIdData.terminalID) : null
        if (terminal && terminal.store.getUsedCapacity(RESOURCE_ENERGY) >= this.store.getCapacity())
          this.processBasicWithdraw(terminal, RESOURCE_ENERGY)
      }
    }
  }

  /**
   * 物资运输任务  已测试
   */
  public processCarryMission(): void {
    const data = this.memory.missionData.Data

    // 数据不全拒绝执行任务
    if (!data || data.num <= 0) {
      Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
      return
    }

    const rType = data.rType as ResourceConstant
    if (rType) {
      this.say(`📦${rType}`)

      // 指定了资源类型
      this.processBasicWorkState(rType)

      // 清除杂质
      for (const r in this.store) {
        if (r !== rType) {
          this.say('🚽')

          // 如果是自己的房间，则优先扔到最近的 storage 去
          if (this.room.name === this.memory.belong) {
            const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
            if (storage && storage.store.getUsedCapacity() > this.store.getUsedCapacity())
              this.processBasicTransfer(storage, r as ResourceConstant)
          }

          return
        }
      }

      // 如果指定了num-- 任务结束条件：[搬运了指定num]
      if (data.num) {
        if (this.memory.working) {
          const targetPos = new RoomPosition(data.targetPosX, data.targetPosY, data.targetRoom)
          if (!targetPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }

          if (!this.pos.isNearTo(targetPos)) {
            this.goTo(targetPos, 1)
          }
          else {
            // 寻找
            const targets = targetPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])

            if (targets.length > 0) {
              const target = targets[0]
              const capacity = this.store[rType as ResourceConstant]

              // 如果送货正确，就减少房间主任务中的 num，num 低于 0 代表任务完成
              if (this.transfer(target, rType) === OK) {
                const thisMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)
                if (thisMission) {
                  thisMission.data.num -= capacity
                  if (thisMission.data.num <= 0)
                    Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                }
              }

              // 目标满了、不是正确目标、目标消失了也代表任务完成
              else {
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
              }
            }

            else {
              Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
          }
        }

        else {
          const sourcePos = new RoomPosition(data.sourcePosX, data.sourcePosY, data.sourceRoom)
          if (!sourcePos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }

          if (!this.pos.isNearTo(sourcePos)) {
            this.goTo(sourcePos, 1)
          }
          else {
            const targets = sourcePos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              const target = targets[0]

              // 如果发现没资源了，就取消搬运任务
              if (target.store[rType] === 0 && (this.store[rType] || 0) <= 0) {
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                return
              }

              // 如果已经没资源了
              const thisMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)!
              if (thisMission.data.num < this.store.getCapacity() && target.store[rType] && target.store[rType] >= thisMission.data.num) {
                this.withdraw(target, rType, thisMission.data.num)
                this.memory.working = true
                return
              }

              if ((target.store[rType] || 0) < this.store.getUsedCapacity()) {
                this.withdraw(target, rType)
                this.memory.working = true
                return
              }

              if (this.withdraw(target, rType) === ERR_NOT_ENOUGH_RESOURCES)
                this.memory.working = true
            }
          }
        }
      }

      else {
        // 未指定数目-- 任务结束条件：[source 空了 或 target 满了]
        if (this.memory.working) {
          const targetPos = new RoomPosition(data.targetPosX, data.targetPosY, data.targetRoom)
          if (!targetPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }

          if (!this.pos.isNearTo(targetPos)) {
            this.goTo(targetPos, 1)
          }
          else {
            /* 寻找 */
            const targets = targetPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              const target = targets[0]
              // const capacity = this.store[rType]
              if (this.transfer(target, rType) !== OK) {
                // 目标满了、不是正确目标、目标消失了也代表任务完成
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                return
              }
              // 对于类似于防御塔正在使用能量的任务
              if ((target.store.getFreeCapacity() || Infinity) < 50)
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
            else {
              Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            }
          }
        }

        else {
          // 清除杂质
          for (const r in this.store) {
            if (r !== rType) {
              this.say('🚽')

              // 如果是自己的房间，则优先扔到最近的 storage 去
              if (this.room.name === this.memory.belong) {
                const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
                if (storage && storage.store.getUsedCapacity() > this.store.getUsedCapacity())
                  this.processBasicTransfer(storage, r as ResourceConstant)
              }

              return
            }
          }

          const disPos = new RoomPosition(data.sourcePosX, data.sourcePosY, data.sourceRoom)
          if (!disPos) {
            Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
            return
          }

          if (!this.pos.isNearTo(disPos)) {
            this.goTo(disPos, 1)
          }
          else {
            const targets = disPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
            if (targets.length > 0) {
              const target = targets[0]

              // 如果发现没资源了，就取消搬运任务
              if ((target.store[rType] || 0) === 0 && this.store.getUsedCapacity(rType) === 0) {
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
              }
              else {
                this.withdraw(target, rType)
                this.memory.working = true
              }
            }
          }
        }
      }
    }

    else {
      this.say('📦')
      // 未指定资源类型

      // working 状态转换条件
      if (!this.memory.working)
        this.memory.working = false
      if (this.memory.working) {
        if (!this.store || Object.keys(this.store).length <= 0)
          this.memory.working = false
      }
      else {
        if (this.store.getFreeCapacity() === 0)
          this.memory.working = true
      }

      // 不考虑这种类型的任务
      if (data.num) {
        Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
        return
      }

      if (this.memory.working) {
        const thisPos = new RoomPosition(data.targetPosX, data.targetPosY, data.targetRoom)
        if (!thisPos) {
          Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
          return
        }

        if (!this.pos.isNearTo(thisPos)) {
          this.goTo(thisPos, 1)
        }
        else {
          // 寻找
          const targets = thisPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
          if (targets.length > 0) {
            const target = targets[0]
            for (const i in this.store) {
              if (this.transfer(target, i as ResourceConstant) !== OK) {
                // 目标满了、不是正确目标、目标消失了也代表任务完成
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
        const disPos = new RoomPosition(data.sourcePosX, data.sourcePosY, data.sourceRoom)
        if (!disPos) {
          Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
          return
        }

        if (!this.pos.isNearTo(disPos)) {
          this.goTo(disPos, 1)
        }
        else {
          const targets = disPos.getStructureList(['terminal', 'storage', 'tower', 'powerSpawn', 'container', 'factory', 'nuker', 'lab', 'link'])
          const ruin = disPos.getRuin()
          if (targets.length > 0 || ruin) {
            const target = targets[0]
            const targetR = ruin
            if (target) {
              // 如果发现没资源了，就取消搬运任务
              if (target.store.getUsedCapacity() === 0) {
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                return
              }

              for (const t in target.store)
                this.withdraw(target, t as ResourceConstant)

              return
            }
            if (targetR) {
              // 如果发现没资源了，就取消搬运任务
              if (targetR.store.getUsedCapacity() === 0) {
                Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
                return
              }

              for (const t in targetR.store)
                this.withdraw(targetR, t as ResourceConstant)
            }
          }
        }
      }
    }
  }
}
