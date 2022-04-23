/* 四人小队状态判断函数 */
import { SquadPos } from './constant'

/* 判断四人小队是否具备活性 如果编队里有爬死了就不具备活性 */
export function isSquadActive(SquadData: Squad): boolean {
  for (const i in SquadData) {
    if (!Game.creeps[i])
      return false
  }
  return true
}

/* 小队中寻路的角色是左上角的爬，这个函数用来获取左上角的爬 */
export function getSquadStandCreep(Squad: Squad): Creep | undefined {
  for (const i in Squad) {
    const thisCreep = Game.creeps[i]
    if (!thisCreep)
      continue
    if (Squad[i].position === '↖')
      return thisCreep
  }
}

/* 获取小队阵型的左上角位置 (在小队成员不完整的情况下，依然能获取坐标) */
export function getSquadStandPos(squadData: Squad): RoomPosition | undefined {
  for (const i in squadData) {
    if (Game.creeps[i]) {
      if (squadData[i].position === '↖')
        return Game.creeps[i].pos
    }
  }
  for (const i in squadData) {
    if (Game.creeps[i]) {
      if (squadData[i].position === '↖') {
        return Game.creeps[i].pos
      }
      else if (squadData[i].position === '↗') {
        const thisPos = Game.creeps[i].pos
        if (thisPos.x === 0)
          continue // 不由该爬虫获取

        return new RoomPosition(thisPos.x - 1, thisPos.y, thisPos.roomName)
      }
      else if (squadData[i].position === '↘') {
        const thisPos = Game.creeps[i].pos
        if (thisPos.y === 0 || thisPos.x === 0)
          continue // 不由该爬虫获取

        return new RoomPosition(thisPos.x - 1, thisPos.y - 1, thisPos.roomName)
      }
      else if (squadData[i].position === '↙') {
        const thisPos = Game.creeps[i].pos
        if (thisPos.y === 0)
          continue // 不由该爬虫获取

        return new RoomPosition(thisPos.x, thisPos.y - 1, thisPos.roomName)
      }
    }
  }
}

/* 获取四人小队中指定位置爬的坐标 需要爬在2-48坐标范围内，太靠近边界无法使用 ====即将废弃==== */
export function getSquadCreepPosion(disCreep: Creep, pos: '↖' | '↗' | '↙' | '↘'): RoomPosition | undefined {
  if (disCreep.pos.x <= 48 && disCreep.pos.y <= 48)
    return new RoomPosition(disCreep.pos.x + SquadPos[pos][0], disCreep.pos.y + SquadPos[pos][1], disCreep.pos.roomName)
}

/* 获取四人小队中指定位置爬的坐标 需要爬在2-48坐标范围内，太靠近边界无法使用 */
export function getSquadRoomPosition(Squad: Squad, pos: '↖' | '↗' | '↙' | '↘'): RoomPosition | undefined {
  const standPos = getSquadStandPos(Squad)
  if (!standPos)
    return
  if (standPos.x > 48 || standPos.y > 48)
    return
  return new RoomPosition(standPos.x + SquadPos[pos][0], standPos.y + SquadPos[pos][1], standPos.roomName)
}

/* 获取小队中指定位置的爬 */
export function getSquadCreepAtPos(SquadData: Squad, pos: '↖' | '↗' | '↙' | '↘'): Creep | undefined {
  for (const i in SquadData) {
    if (!Game.creeps[i]) { continue }
    else {
      if (SquadData[i].position === pos)
        return Game.creeps[i]
    }
  }
}

/* 判断小队是否已经集结到位  true 到位 false 未到位 */
export function isSquadReady(SquadData: Squad): boolean {
  const standPos = getSquadStandPos(SquadData)
  if (!standPos)
    return true // 如果集结爬死了，说明小队不需要再集结了，返回true方便其他爬执行其他事情
  const thisRoom: string = standPos.roomName
  for (const cName in SquadData) {
    const disPos = getSquadRoomPosition(SquadData, SquadData[cName].position)
    if (!Game.creeps[cName])
      continue
    if ((Game.creeps[cName].room.name === thisRoom && disPos && !Game.creeps[cName].pos.isEqualTo(disPos)))
      return false
  }
  return true
}

/* 判断小队所有爬虫是否已经到了目标房间 */
export function isSquadArrivedRoom(SquadData: Squad, disRoom: string): boolean {
  for (const cName in SquadData) {
    if (!Game.creeps[cName])
      continue
    if (Game.creeps[cName].room.name !== disRoom)
      return false
  }
  return true
}

/* 获取小队治疗爬朝向 */
export function getSquadHealDirection(SquadData: Squad): '↑' | '↓' | '←' | '→' | null {
  const directionList = []
  for (const cName in SquadData) {
    if (!Game.creeps[cName])
      return null
    if (Game.creeps[cName].memory.creepType === 'heal')
      directionList.push(SquadData[cName].position)
  }
  if (directionList.includes('↖') && directionList.includes('↗'))
    return '↑'
  else if (directionList.includes('↘') && directionList.includes('↗'))
    return '→'
  else if (directionList.includes('↘') && directionList.includes('↙'))
    return '↓'
  else if (directionList.includes('↖') && directionList.includes('↙'))
    return '←'
  return null
}

/* 获取小队攻击爬朝向 */
export function getSquadAttackDirection(SquadData: Squad): '↑' | '↓' | '←' | '→' | null {
  const directionList = []
  for (const cName in SquadData) {
    if (!Game.creeps[cName])
      return null
    if (Game.creeps[cName].memory.creepType === 'attack')
      directionList.push(SquadData[cName].position)
  }
  if (directionList.includes('↖') && directionList.includes('↗'))
    return '↑'
  else if (directionList.includes('↘') && directionList.includes('↗'))
    return '→'
  else if (directionList.includes('↘') && directionList.includes('↙'))
    return '↓'
  else if (directionList.includes('↖') && directionList.includes('↙'))
    return '←'
  return null
}

/* 返回目标相对小队的大致方向 */
export function getSquadPosDirection(SquadData: Squad, pos: RoomPosition): string | undefined {
  /* 计算位置和小队的距离 */
  const standPos = getSquadStandPos(SquadData)
  if (!standPos)
    return

  let direction: string | undefined
  const Xdistance = standPos.x - pos.x // >0代表目标X方向在小队左边 <=-2代表目标X方向在小队右边  0 -1 代表目标X方向与小队有耦合
  const Ydistance = standPos.y - pos.y // >0代表目标Y方向在小队上面 <=-2代表目标Y方向在小队下面  0 -1 代表目标Y方向与小队有耦合
  const absXdistance = Math.abs(Xdistance) // X方向距离差的绝对值
  const absYdistance = Math.abs(Ydistance) // Y方向距离差的绝对值
  // 目标X方向整体在小队左边
  if (Xdistance > 0) {
    // 目标Y方向整体在小队上面
    if (Ydistance > 0) {
      if (absXdistance < absYdistance) // 左上偏上

        direction = '↑'

      else if (absXdistance === absYdistance) // 正左上 返回null 不必要替换方向

        direction = '↖'

      else if (absXdistance > absYdistance) // 左上偏左

        direction = '←'
    }
    // 目标Y方向整体在小队左边Y方向的耦合区域
    else if (Ydistance <= 0 && Ydistance > -2) {
      direction = '←'
    }
    // 目标Y方向整体在小队下面
    else if (Ydistance <= -2) {
      if (absXdistance < (absYdistance - 1)) // 左下偏下   -1是因为小队是四人小队，我们需要以↙位置的爬为参照

        direction = '↓'

      else if (absXdistance === (absYdistance - 1)) // 正左下

        direction = '↙'

      else if (absXdistance > (absYdistance - 1)) // 左下偏左

        direction = '←'
    }
  }
  // 目标与小队处于X方向上的耦合区域
  else if (Xdistance <= 0 && Xdistance > -2) {
    if (Ydistance > 0) // 目标的Y方向在小队上面

      direction = '↑'

    else if (Ydistance <= 0 && Ydistance > -2) // 不会存在的情况，除非目标在小队内

      direction = undefined

    else if (Ydistance <= -2) // 目标的Y方向在小队下面

      direction = '↓'
  }
  // 目标X方向在小队右边
  else if (Xdistance <= -2) {
    // 目标Y方向在小队上面
    if (Ydistance > 0) {
      if (absXdistance - 1 < absYdistance) // 右上偏上

        direction = '↑'

      else if (absXdistance - 1 === absYdistance) // 正右上

        direction = '↗'

      else if (absXdistance - 1 > absYdistance) // 右上偏下

        direction = '→'
    }
    // 目标Y方向处于耦合区域
    else if (Ydistance <= 0 && Ydistance > -2) {
      direction = '→'
    }
    // 目标Y方向处于小队下方
    else if (Ydistance <= -2) {
      if (absXdistance < absYdistance) // 右下偏下

        direction = '↓'

      else if (absXdistance === absYdistance) // 正右下

        direction = '↘'

      else if (absXdistance > absYdistance) // 右下偏右

        direction = '→'
    }
  }

  return direction
}
