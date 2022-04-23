/* 四人小队框架控制 */

import { squadMove, squadNear } from './move/move'
import { SquadAttackOrient, SquadNameFlagPath, Squadaction, getClosestSquadColorFlagByRange, initSquad, steadySquad } from './work/action'
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
    /* 优先调整坐标 */
    if (!data.init) {
      data.init = true
      initSquad(data.presentRoom, data.disRoom, squadData)
      return
    }
    squadMove(squadData, new RoomPosition(25, 25, data.disRoom), 10)
    return
  }
  /* 小队行为 攻击周围的敌人和建筑 */
  Squadaction(squadData)
  const attack_flag = SquadNameFlagPath(squadData, 'squad_attack')
  if (attack_flag) {
    if (attack_flag.pos.lookFor(LOOK_STRUCTURES).length <= 0) { attack_flag.remove() }
    else {
      const Attackdirection = getSquadAttackDirection(data.creepData)
      if (getSquadPosDirection(squadData, attack_flag.pos) != null && Attackdirection != getSquadPosDirection(squadData, attack_flag.pos)) {
        if (!isInArray(['↙', '↗', '↘', '↖'], getSquadPosDirection(squadData, attack_flag.pos))) {
          SquadAttackOrient(Attackdirection, getSquadPosDirection(squadData, attack_flag.pos), squadData)
          return
        }
      }
      if (!squadNear(squadData, attack_flag.pos))
        squadMove(squadData, attack_flag.pos, 1)
    }
  }
  else {
    const standCreep = getSquadStandCreep(squadData)
    if (!standCreep)
      return
    const clostStructure = standCreep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
      filter: (struc) => {
        return !isInArray([STRUCTURE_CONTROLLER, STRUCTURE_STORAGE], struc.structureType)
      },
    })
    if (clostStructure) {
      clostStructure.pos.createFlag(`squad_attack_${generateID()}`, COLOR_WHITE)
      return
    }
    else { return }
  }
  if (!attack_flag)
    return
  /* retreat_xx 是紧急撤退标志 */
  const retreatFlag = SquadNameFlagPath(squadData, 'retreat')
  if (retreatFlag) {
    squadMove(squadData, blueFlag.pos, 0)
    if (squadNear(squadData, blueFlag.pos))
      retreatFlag.remove()
  }
}
