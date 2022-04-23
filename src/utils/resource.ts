import { ResourceMapData } from '@/structure/constant/resource'

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
