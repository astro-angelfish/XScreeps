/* 四人小队框架控制 */

import { squadMove, squadNear } from './move/move'
import { getClosestSquadColorFlagByRange, initSquad, squadAction, squadAttackOrient, squadNameFlagPath, steadySquad } from './work/action'
import { getSquadAttackDirection, getSquadPosDirection, getSquadStandCreep, isSquadArrivedRoom, isSquadReady } from './work/state'
import { generateID } from '@/utils'

// 主程序执行
export function processSquads(): void {
  if (!Memory.squadMemory)
    Memory.squadMemory = {}

  for (const squadID in Memory.squadMemory) {
    // 先检查该任务的爬是否已经死光，如果死光了就清除数据
    const del = Object.keys(Memory.squadMemory[squadID].creepData)
      .map(Game.getObjectById)
      .every(creep => !creep)
    if (del) {
      delete Memory.squadMemory[squadID]
      continue
    }

    // 删除无用数据
    if (Game.time % 50 === 0) {
      for (const i in Memory.roomControlData) {
        const room = Game.rooms[i]
        if (!room)
          continue
        if (room.controller && room.controller.level >= 8) {
          if (room.countMissionByName('Creep', '四人小队') <= 0) {
            room.memory.squadData = {}
          }
          else {
            if (room.memory.squadData[squadID])
              delete room.memory.squadData[squadID]
          }
        }
      }
    }

    // 运行框架
    processSquad(squadID)
  }
}

// 小队通用执行框架
export function processSquad(squardID: string): void {
  const data = Memory.squadMemory[squardID]
  if (!data)
    return

  // 小队 Memory 中的爬虫数据
  const squadData = data.creepData
  // 如果小队没有组队或者脱离组队，要进行的操作
  if (!data.ready) {
    if (!isSquadReady(squadData))
      steadySquad(squadData)
    else
      data.ready = true
    return
  }
  // 如果小队因为某些原因脱离了组队，需要赶紧组队
  if (!isSquadReady(squadData)) {
    steadySquad(squadData)
    data.ready = false
    return
  }

  // 如果小队还没有到目标房间
  if (!isSquadArrivedRoom(squadData, data.disRoom)) {
    // 如果有蓝色旗帜，优先去蓝色旗帜那里集结  [集结]
    const blueFlag = getClosestSquadColorFlagByRange(squadData, COLOR_BLUE)
    if (!data.gather && blueFlag) {
      squadMove(squadData, blueFlag.pos, 0)
      if (squadNear(squadData, blueFlag.pos))
        data.gather = true
      return
    }

    // 优先调整坐标
    if (!data.init) {
      data.init = true
      initSquad(data.presentRoom!, data.disRoom, squadData)
      return
    }

    squadMove(squadData, new RoomPosition(25, 25, data.disRoom), 10)

    return
  }

  // 小队行为 攻击周围的敌人和建筑
  squadAction(squadData)

  const attackFlag = squadNameFlagPath(squadData, 'squad_attack')
  if (attackFlag) {
    if (attackFlag.pos.lookFor(LOOK_STRUCTURES).length <= 0) {
      attackFlag.remove()
    }
    else {
      const attackDirection = getSquadAttackDirection(data.creepData)
      const flagDirection = getSquadPosDirection(squadData, attackFlag.pos)
      if (attackDirection && flagDirection && attackDirection !== flagDirection) {
        if (!['↙', '↗', '↘', '↖'].includes(flagDirection)) {
          squadAttackOrient(attackDirection, flagDirection, squadData)
          return
        }
      }
      if (!squadNear(squadData, attackFlag.pos))
        squadMove(squadData, attackFlag.pos, 1)
    }
  }
  else {
    const standCreep = getSquadStandCreep(squadData)
    if (!standCreep)
      return
    const clostStructure = standCreep.pos.findClosestByPath(
      standCreep.room.find(FIND_HOSTILE_STRUCTURES)
        .filter(struct => struct.structureType !== STRUCTURE_CONTROLLER && struct.structureType !== STRUCTURE_STORAGE))
    if (clostStructure) {
      clostStructure.pos.createFlag(`squad_attack_${generateID()}`, COLOR_WHITE)
      return
    }
    else { return }
  }

  // retreat_xx 是紧急撤退标志
  const retreatFlag = squadNameFlagPath(squadData, 'retreat')
  if (retreatFlag) {
    squadMove(squadData, retreatFlag.pos, 0)
    if (squadNear(squadData, retreatFlag.pos))
      retreatFlag.remove()
  }
}
