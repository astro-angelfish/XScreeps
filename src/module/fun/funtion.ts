import { ResourceMapData } from '@/constant/ResourceConstant'

/* 杂物堆 */

/**
 * 计算平均价格
 */
export function getAveragePrice(res: ResourceConstant, day: number): number {
  if (day > 14)
    return 0 // 0

  const history = Game.market.getHistory(res)

  let allprice = 0
  for (let ii = 14 - day; ii < 14; ii++)
    allprice += history[ii].avgPrice

  const avePrice = allprice / day // 平均能量价格
  return avePrice
}

/**
 * 判断是否已经有相应 order 了
 */
export function haveMarketOrder(roomName: string, res: ResourceConstant, mtype: 'sell' | 'buy', nowPrice?: number, range = 0): boolean {
  //  不考虑价格
  if (!nowPrice) {
    for (const i in Game.market.orders) {
      const order = Game.market.getOrderById(i)
      if (!order)
        continue

      if (order.remainingAmount <= 0) {
        Game.market.cancelOrder(i)
        continue
      }
      if (order.roomName === roomName && order.resourceType === res && order.type === mtype)
        return true
    }
    return false
  }
  // 考虑价格区间
  else {
    for (const i in Game.market.orders) {
      const order = Game.market.getOrderById(i)
      if (!order)
        continue
      if (order.amount <= 0 || !order.active) {
        Game.market.cancelOrder(i)
        continue
      }
      if (order.roomName === roomName && order.resourceType === res && order.type === mtype && order.price >= (nowPrice + range))
        return true
    }
    return false
  }
}

/**
 * 计算一定范围内的最高价格
 */
export function getHighestPrice(res: ResourceConstant, type: 'sell' | 'buy', maxPrice?: number): number {
  const allOrders = Game.market.getAllOrders({ type, resourceType: res })

  let highestPrice = 0
  for (const i of allOrders) {
    if (i.price > highestPrice) {
      if (maxPrice) {
        if (i.price <= maxPrice)
          highestPrice = i.price
      }
      else {
        highestPrice = i.price
      }
    }
  }

  if (maxPrice && highestPrice === 0)
    highestPrice = maxPrice

  return highestPrice
}

// 识别lab 合成 or 底物  [轮子]
export function groupLabsInRoom(roomName: string): {
  raw1: Id<StructureLab>
  raw2: Id<StructureLab>
  com: Id<StructureLab>[]
} | null {
  const room = Game.rooms[roomName]
  if (!room)
    return null

  // 寻找所有 lab
  const labs = room.find(FIND_STRUCTURES)
    .filter(i => i.structureType === STRUCTURE_LAB) as StructureLab[]

  if (labs.length < 3)
    return null

  let centerLabs: [StructureLab, StructureLab] | undefined
  let otherLabs: StructureLab[] = []
  for (let i = 0; i < labs.length; i++) {
    const labA = labs[i]
    for (let j = i + 1; j < labs.length; j++) {
      const labB = labs[j]

      if (!labA.pos.inRangeTo(labB, 5))
        continue

      // 获取所有能接触到的 lab
      const other = labs.filter(i => i !== labA && i !== labB
        && labA.pos.inRangeTo(i, 2) && labB.pos.inRangeTo(i, 2))

      // 找一个能接触到个数最大的
      if (other.length > otherLabs.length) {
        centerLabs = [labA, labB]
        otherLabs = other
      }
    }
  }

  if (!centerLabs || centerLabs.length < 2 || otherLabs.length < 1)
    return null

  return {
    raw1: centerLabs[0].id,
    raw2: centerLabs[1].id,
    com: otherLabs.map(v => v.id),
  }
}

/**
 * 判断是否存在该房间相关资源的调用信息
 * @returns true 存在 false 不存在
 */
export function checkDispatch(roomName: string, resource: ResourceConstant): boolean {
  for (const i of Memory.resourceDispatchData) {
    if (i.sourceRoom === roomName && i.rType === resource)
      return true
  }
  return false
}

/**
 * 获取该房间资源调度数量
 */
export function getRoomDispatchNum(roomName: string): number {
  return Memory.resourceDispatchData
    .reduce((pv, cv) => cv.sourceRoom === roomName ? pv + 1 : pv, 0)
}

/**
 * 判断其他房间是否存在往该房间的资源调度
 */
export function checkSendMission(roomName: string, resource: ResourceConstant): boolean {
  for (const i in Memory.roomControlData) {
    if (!Game.rooms[i]?.memory.mission?.Structure)
      continue
    for (const t of Game.rooms[i].memory.mission.Structure) {
      if (t.name === '资源传送' && t.data.rType === resource && t.data.disRoom === roomName)
        return true
    }
  }
  return false
}

/**
 * 判断自己房间是否有资源购买任务
 */
export function checkBuyMission(roomName: string, resource: ResourceConstant): boolean {
  for (const t of Game.rooms[roomName].memory.mission.Structure) {
    if (t.name === '资源购买' && t.data.rType === resource)
      return true
  }
  return false
}

/**
 * 判断是否有实验室绑定该种类型资源
 */
export function checkLabBindResource(roomName: string, resource: ResourceConstant): boolean {
  const room = Game.rooms[roomName]
  if (!room)
    return false

  for (const i in room.memory.roomLabBind) {
    if (room.memory.roomLabBind[i].rType === resource)
      return true
  }
  return false
}

/**
 * 判断目标资源的上级资源是否已经达到要求
 */
export function resourceMap(rType: ResourceConstant, disType: ResourceConstant): ResourceConstant[] {
  if (['XGH2O', 'XGHO2', 'XLH2O', 'XLHO2', 'XUH2O', 'XUHO2', 'XKH2O', 'XKHO2', 'XZH2O', 'XZHO2'].includes(rType)) {
    console.log(`是 ${rType} 返回空列表`)
    return []
  }

  for (const i of ResourceMapData) {
    if (i.source === rType && i.dis === disType)
      return i.map
  }

  console.log('resourceMap 返回了空列表')
  return []
}

/**
 * 判断爬虫是否是值得防御的目标
 */
export function deserveDefend(creep: Creep): boolean {
  for (const b of creep.body) {
    if (typeof b.boost === 'string' && ['XGHO2', 'XKHO2', 'XUHO2', 'XZH2O'].includes(b.boost))
      return true
  }
  return false
}

/**
 * 判断爬虫是否有某类型部件
 */
export function havePart(creep: Creep, type: BodyPartConstant): boolean {
  for (const b of creep.body) {
    if (b.type === type)
      return true
  }
  return false
}

/**
 * 爬虫攻击部件数据
 */
export function calcCreepAttackDamage(creep: Creep): Record<string, number> {
  const result = { attack: 0, ranged_attack: 0 }

  for (const i of creep.body) {
    if (i.type === 'attack') {
      if (!i.boost)
        result.attack += 30
      else if (i.boost === 'UH')
        result.attack += 60
      else if (i.boost === 'UH2O')
        result.attack += 90
      else if (i.boost === 'XUH2O')
        result.attack += 120
    }

    else if (i.type === 'ranged_attack') {
      if (!i.boost)
        result.ranged_attack += 10
      else if (i.boost === 'KO')
        result.ranged_attack += 20
      else if (i.boost === 'KHO2')
        result.ranged_attack += 30
      else if (i.boost === 'XKHO2')
        result.ranged_attack += 40
    }
  }

  return result
}

/**
 * 爬虫攻击数据
 */
export function calcCreepWarStat(creep: Creep): Record<string, number> {
  // 其中 tough 是抵抗的伤害值
  const result = { attack: 0, ranged_attack: 0, heal: 0, tough: 0 }

  for (const i of creep.body) {
    if (i.type === 'heal') {
      if (!i.boost)
        result.heal += 12
      else if (i.boost === 'LO')
        result.heal += 24
      else if (i.boost === 'LHO2')
        result.heal += 36
      else if (i.boost === 'XLHO2')
        result.heal += 48
    }

    if (i.type === 'attack') {
      if (!i.boost)
        result.attack += 30
      else if (i.boost === 'UH')
        result.attack += 60
      else if (i.boost === 'UH2O')
        result.attack += 90
      else if (i.boost === 'XUH2O')
        result.attack += 120
    }

    else if (i.type === 'ranged_attack') {
      if (!i.boost)
        result.ranged_attack += 10
      else if (i.boost === 'KO')
        result.ranged_attack += 20
      else if (i.boost === 'KHO2')
        result.ranged_attack += 30
      else if (i.boost === 'XKHO2')
        result.ranged_attack += 40
    }

    else if (i.type === 'tough') {
      if (!i.boost)
        result.tough += 100
      else if (i.boost === 'GO')
        result.tough += 200
      else if (i.boost === 'GHO2')
        result.tough += 300
      else if (i.boost === 'XGHO2')
        result.tough += 400
    }
  }

  return result
}

/**
 * 寻找后一级的爬
 */
export function findNextQuarter(creep: Creep): string | undefined {
  if (!creep.memory.squad)
    return

  for (const i in creep.memory.squad) {
    if (creep.memory.squad[i].index - creep.memory.squad[creep.name].index === 1)
      return i
  }
}

/**
 * 判断房间 thisRoom 是否可以直接通过出口到达房间 disRoom
 * @param thisRoom 当前房间
 * @param disRoom 目标房价
 * @returns boolean
 * 方向常量 ↑:1 →:3 ↓:5 ←:7
 */
export function isRoomNextTo(thisRoom: string, disRoom: string): boolean {
  const thisRoomData = regularRoom(thisRoom)
  const disRoomData = regularRoom(disRoom)

  if (thisRoomData.coor[0] === disRoomData.coor[0] && thisRoomData.coor[1] === disRoomData.coor[1]) {
    const xDist = Math.abs(thisRoomData.num[0] - disRoomData.num[0])
    const yDist = Math.abs(thisRoomData.num[1] - disRoomData.num[1])

    if ((xDist === 0 && yDist === 1) || (xDist === 1 && yDist === 0)) {
      const result = Game.rooms[thisRoom].findExitTo(disRoom)
      if (result !== -2 && result !== -10) {
        // 判断一个房间相对另一个房间的方向是否和返回的出口方向一致
        let direction: number | undefined
        // x方向相邻
        if (xDist === 1) {
          const count = thisRoomData.num[0] - disRoomData.num[0]
          // W区
          if (thisRoomData.coor[0] === 'W') {
            switch (count) {
              case 1: { direction = 3; break }
              case -1: { direction = 7; break }
            }
          }
          // E区
          else if (thisRoomData.coor[0] === 'E') {
            switch (count) {
              case 1: { direction = 7; break }
              case -1: { direction = 3; break }
            }
          }
        }
        // y方向相邻
        else if (yDist === 1) {
          const count = thisRoomData.num[1] - disRoomData.num[1]
          // N区
          if (thisRoomData.coor[1] === 'N') {
            switch (count) {
              case 1: { direction = 5; break }
              case -1: { direction = 1; break }
            }
          }
          // S区
          else if (thisRoomData.coor[1] === 'S') {
            switch (count) {
              case 1: { direction = 1; break }
              case -1: { direction = 5; break }
            }
          }
        }

        if (!direction)
          return false
        else if (direction === result)
          return true
      }
    }
  }

  return false
}

const regRoom = /^([WE])(\d{1,2})([NS])(\d{1,2})$/
/**
 * 格式化房间名称信息
 * @param roomName 房间名
 * @returns 一个对象 例: W1N2 -----> {coor:["W","N"], num:[1,2]}
 */
export function regularRoom(roomName: string): { coor: string[]; num: number[] } {
  const result = roomName.match(regRoom)
  if (!result)
    throw new Error(`[regularRoom] 解析房间名错误 roomName:${roomName}`)
  return {
    coor: [result[1], result[3]],
    num: [parseInt(result[2]), parseInt(result[4])],
  }
}

/**
 * 获取相邻房间相对于本房间的方向
 * @param thisRoom 当前房间
 * @param disRoom 目标房价
 * @returns number
 * 方向常量 ↑:1 →:3 ↓:5 ←:7
 */
export function calcNextRoomDirection(thisRoom: string, disRoom: string): TOP | RIGHT | BOTTOM | LEFT | undefined {
  const thisRoomData = regularRoom(thisRoom)
  const disRoomData = regularRoom(disRoom)

  if (thisRoomData.coor[0] === disRoomData.coor[0] && thisRoomData.coor[1] === disRoomData.coor[1]) {
    const xDist = Math.abs(thisRoomData.num[0] - disRoomData.num[0])
    const yDist = Math.abs(thisRoomData.num[1] - disRoomData.num[1])

    if ((xDist === 0 && yDist === 1) || (xDist === 1 && yDist === 0)) {
      const result = Game.rooms[thisRoom].findExitTo(disRoom)
      if (result !== -2 && result !== -10) {
        // 判断一个房间相对另一个房间的方向是否和返回的出口方向一致
        let direction: TOP | RIGHT | BOTTOM | LEFT | undefined
        // x方向相邻
        if (xDist === 1) {
          const count = thisRoomData.num[0] - disRoomData.num[0]
          // W区
          if (thisRoomData.coor[0] === 'W') {
            switch (count) {
              case 1: { direction = RIGHT; break }
              case -1: { direction = LEFT; break }
            }
          }
          // E区
          else if (thisRoomData.coor[0] === 'E') {
            switch (count) {
              case 1: { direction = LEFT; break }
              case -1: { direction = RIGHT; break }
            }
          }
        }
        // y方向相邻
        else if (yDist === 1) {
          const count = thisRoomData.num[1] - disRoomData.num[1]
          // N区
          if (thisRoomData.coor[1] === 'N') {
            switch (count) {
              case 1: { direction = BOTTOM; break }
              case -1: { direction = TOP; break }
            }
          }
          // S区
          else if (thisRoomData.coor[1] === 'S') {
            switch (count) {
              case 1: { direction = TOP; break }
              case -1: { direction = BOTTOM; break }
            }
          }
        }

        return direction
      }
    }
  }
}

/**
 * 判断是否处于房间入口指定格数内
 * @param creep
 * @returns
 */
export function isRoomInRange(thisPos: RoomPosition, disRoom: string, range: number): boolean {
  const thisRoom = thisPos.roomName

  const direction = calcNextRoomDirection(thisRoom, disRoom)
  if (!direction)
    return false

  if (!range || range <= 0 || range >= 49)
    return false

  switch (direction) {
    case TOP: {
      return thisPos.y <= range
    }
    case BOTTOM: {
      return thisPos.y >= (49 - range)
    }
    case LEFT: {
      return thisPos.x <= range
    }
    case RIGHT: {
      return thisPos.x >= (49 - range)
    }
    default: {
      return false
    }
  }
}

/**
 * 判断是否可以组队了
 * 需要一个方块的位置都没有墙壁，而且坐标需要 2 -> 47
 */
export function identifyGarrison(creep: Creep): boolean {
  if (creep.pos.x > 47 || creep.pos.x < 2 || creep.pos.y > 47 || creep.pos.y < 2)
    return false

  for (let i = creep.pos.x; i < creep.pos.x + 2; i++) {
    for (let j = creep.pos.y; j < creep.pos.y + 2; j++) {
      const thisPos = new RoomPosition(i, j, creep.room.name)
      if (thisPos.lookFor(LOOK_TERRAIN)[0] === 'wall')
        return false

      if (thisPos.getStructureList(['spawn', 'constructedWall', 'rampart', 'observer', 'link', 'nuker', 'storage', 'tower', 'terminal', 'powerSpawn', 'extension']).length > 0)
        return false
    }
  }

  return true
}

/**
 * 寻找前一级的爬 四人小队用
 */
export function findFollowQuarter(creep: Creep): string | undefined {
  if (!creep.memory.squad)
    return

  for (const i in creep.memory.squad) {
    if (creep.memory.squad[creep.name].index - creep.memory.squad[i].index === 1)
      return i
  }
}

/**
 * 没有房间名的字符串解压 例如 14/23
 */
export function unzipXY(str: string): [number, number] | undefined {
  const info = str.split('/', 2)
  return info.length === 2 ? [Number(info[0]), Number(info[1])] : undefined
}

/**
 * 平均 cpu 统计相关
 */
export function statCPU(): void {
  const mainEndCpu = Game.cpu.getUsed()
  if (!global.cpuData)
    global.cpuData = []
  global.usedCpu = mainEndCpu

  // 小于一百就直接 push
  if (global.cpuData.length < 100) {
    global.cpuData.push(global.usedCpu)

    // 计算平均 cpu
    const allCpu = global.cpuData.reduce((a, b) => a + b, 0)
    global.aveCpu = allCpu / global.cpuData.length
  }
  // 计算平均值
  else {
    const allCpu = global.cpuData.reduce((a, b) => a + b, 0)
    global.cpuData = [allCpu / 100]
    global.aveCpu = allCpu
  }
}
