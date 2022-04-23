/* 资源调度模块 */

import { checkDispatch, checkSendMission, colorfyLog, getAveragePrice, getHighestPrice, getRoomDispatchNum, haveMarketOrder } from '@/utils'
import { t1Compounds, t2Compounds, t3Compounds } from '@/structure/constant/resource'

// 主调度函数
export function processResourceDispatch(thisRoom: Room): void {
  if ((Game.time - global.Gtime[thisRoom.name]) % 15)
    return

  // 处理订单前检查
  const storage = thisRoom.memory.structureIdData?.storageID ? Game.getObjectById(thisRoom.memory.structureIdData.storageID) : null
  const terminal = thisRoom.memory.structureIdData?.terminalID ? Game.getObjectById(thisRoom.memory.structureIdData.terminalID) : null
  if (!thisRoom.controller || thisRoom.controller.level < 6 || !storage || !terminal)
    return

  // 如果房间有资源传送任务，则不执行
  if (thisRoom.countMissionByName('Structure', '资源传送') >= 1)
    return

  // ResourceLimit更新
  processResourceLimitUpdate(thisRoom)

  /* 对资源调度进行操作 */
  for (const i of Memory.resourceDispatchData) {
    // 执行资源调度
    if (i.sourceRoom === thisRoom.name) {
      // 执行买操作
      if ((!i.conditionTick || i.conditionTick <= 0) && i.buy) {
        if (i.mtype === 'order') {
          // 1. 获取近两天的平均价格
          // 2. 拉取平均价格+10以内价格最高的订单
          // 3. 发布订单的价格比最高的订单的价格多0.01
          console.log(colorfyLog(`[资源调度] 房间 ${thisRoom.name} 需求资源 [${i.rType}] 无法调度，将进行购买! 购买方式为 ${i.mtype}，购买数量 ${i.num}`, 'yellow'))
          const ave = getAveragePrice(i.rType, 2)
          if (!haveMarketOrder(thisRoom.name, i.rType, 'buy', ave)) {
            const highest = getHighestPrice(i.rType, 'buy', ave + 10)
            const result = Game.market.createOrder({
              type: ORDER_BUY,
              resourceType: i.rType,
              price: highest + 0.01,
              totalAmount: i.num,
              roomName: thisRoom.name,
            })
            if (result !== OK) {
              console.log(`[资源调度] 创建能量订单出错，房间 ${thisRoom.name}`)
              continue
            }
            console.log(colorfyLog(`房间 ${thisRoom.name} 创建 ${i.rType} 订单，价格: ${highest + 0.01}，数量: ${i.num}`, 'green', true))
            i.delayTick = 0
          }
          continue
        }
        else if (i.mtype === 'deal') {
          if (thisRoom.checkBuy(i.rType) || thisRoom.countMissionByName('Structure', '资源购买') >= 2)
            continue
          // 在一定范围内寻找最便宜的订单 deal，例如平均价格 20 范围 10 最高价格 31 便只能接受 30 以下的价格 （根据资源不同选择不同参数）
          console.log(colorfyLog(`[资源调度] 房间 ${thisRoom.name} 需求资源 [${i.rType}] 无法调度，将进行购买! 购买方式为 ${i.mtype}，购买数量: ${i.num}`, 'yellow'))
          // 能量 ops
          if (i.rType === RESOURCE_OPS || i.rType === RESOURCE_ENERGY) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 5, 10)
            if (task) {
              thisRoom.addMission(task)
              i.delayTick = 0
            }
            continue
          }
          // 原矿 中间化合物
          else if (['X', 'L', 'H', 'O', 'Z', 'K', 'U', 'G', 'OH', 'ZK', 'UL'].includes(i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 10, 30)
            if (task) {
              thisRoom.addMission(task)
              i.delayTick = 0
            }
            continue
          }
          // t3
          else if (t3Compounds.includes(i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 50, 150)
            if (task) {
              thisRoom.addMission(task)
              i.delayTick = 0
            }
            continue
          }
          // power
          else if (i.rType === RESOURCE_POWER) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 20, 70)
            if (task) {
              thisRoom.addMission(task)
              i.delayTick = 0
            }
            continue
          }
          // t1 t2
          else if (t2Compounds.includes(i.rType) || t1Compounds.includes(i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 20, 65)
            if (task) {
              thisRoom.addMission(task)
              i.delayTick = 0
            }
            continue
          }
          // 其他商品类资源，bar 类资源
          else {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 50, 200)
            if (task) {
              thisRoom.addMission(task)
              i.delayTick = 0
            }
            continue
          }
        }
        else {
          // 未定义i.mtype 便按照默认的执行
          if (i.rType === 'energy')
            i.mtype = 'order'
          else i.mtype = 'deal'
          continue
        }
      }
    }
    else {
      if (i.dealRoom)
        continue

      // 没有就删除
      if (!storage.store[i.rType] || storage.store[i.rType] <= 0)
        continue

      // 接单
      const limitNum = global.resourceLimit[thisRoom.name][i.rType] || 0

      // storage 里资源大于等于调度所需资源
      if (storage.store.getUsedCapacity(i.rType) - limitNum >= i.num) {
        const sendNum = i.num > 50000 ? 50000 : i.num
        const task = thisRoom.generateSendMission(i.sourceRoom, i.rType, sendNum)
        if (task && thisRoom.addMission(task)) {
          // 如果调度数量大于 50k，则只减少 num 数量
          if (i.num <= 50000)
            i.dealRoom = thisRoom.name
          console.log(`房间 ${thisRoom.name} 接取房间 ${i.sourceRoom} 的资源调度申请，资源: ${i.rType}，数量: ${sendNum}`)
          i.num -= sendNum
          continue
        }
      }
      // sotrage 里资源小于调度所需资源
      if ((storage.store.getUsedCapacity(i.rType) - limitNum) > 0 && storage.store.getUsedCapacity(i.rType) - limitNum < i.num) {
        const SendNum = storage.store.getUsedCapacity(i.rType) - limitNum
        const task = thisRoom.generateSendMission(i.sourceRoom, i.rType, SendNum)
        if (task && thisRoom.addMission(task)) {
          console.log(`房间 ${thisRoom.name} 接取房间 ${i.sourceRoom} 的资源调度申请，资源: ${i.rType}，数量: ${SendNum}`)
          i.num -= SendNum
          continue
        }
      }
    }
  }
}

// 调度信息超时管理器
export function tickResourceDispatch(): void {
  for (const i of Memory.resourceDispatchData) {
    // 超时将删除调度信息
    if (!i.delayTick || i.delayTick <= 0 || i.num <= 0 || !i.rType) {
      console.log(`[资源调度] 房间 ${i.sourceRoom} 的 [${i.rType}] 资源调度删除！原因:调度任务已部署|超时|无效调度`)
      const index = Memory.resourceDispatchData.indexOf(i)
      Memory.resourceDispatchData.splice(index, 1)
    }

    if (i.delayTick > 0)
      i.delayTick--
    if (i.conditionTick && i.conditionTick > 0) {
      // 有 deal 房间的时候， conditionTick 衰减减慢
      if (i.dealRoom) {
        if (Game.time % 5 === 0)
          i.conditionTick--
      }
      else {
        i.conditionTick--
      }
    }
  }
}

// 调度信息更新器  ResourceLimit 建议放global里
export function processResourceLimitUpdate(thisRoom: Room): void {
  // 初始化
  global.resourceLimit[thisRoom.name] = {}
  const resourceLimit = global.resourceLimit[thisRoom.name]
  resourceLimit.energy = 350000

  // 所有 t3 保存 8000 基础量，以备应急
  for (const i of t3Compounds)
    resourceLimit[i] = 8000
  // 所有基础资源保存 15000 的基础量
  for (const b of ['X', 'L', 'Z', 'U', 'K', 'O', 'H', 'ops'] as const)
    resourceLimit[b] = 15000

  // 监测 boost
  if (thisRoom.memory.roomLabBind && Object.keys(thisRoom.memory.roomLabBind).length > 0) {
    for (const labId in thisRoom.memory.roomLabBind) {
      const lab = Game.getObjectById(labId as Id<StructureLab>)
      if (!lab)
        continue

      const rType = thisRoom.memory.roomLabBind[labId].rType

      if (!resourceLimit[rType])
        resourceLimit[rType] = 8000
      else
        resourceLimit[rType] = Math.min(resourceLimit[rType]!, 8000)
    }
  }

  // 监测 lab 合成
  if (thisRoom.countMissionByName('Room', '资源合成') > 0) {
    for (const m of thisRoom.memory.mission.Room) {
      if (m.name === '资源合成') {
        const raw1 = m.data.raw1 as ResourceConstant
        const raw2 = m.data.raw2 as ResourceConstant

        if (!resourceLimit[raw1])
          resourceLimit[raw1] = m.data.num
        else
          resourceLimit[raw1] = Math.max(resourceLimit[raw1]!, m.data.num)

        if (!resourceLimit[raw2])
          resourceLimit[raw2] = m.data.num
        else
          resourceLimit[raw2] = Math.max(resourceLimit[raw2]!, m.data.num)
      }
    }
  }

  // 监测合成规划
  if (thisRoom.memory.comDispatchData && Object.keys(thisRoom.memory.comDispatchData).length > 0) {
    for (const g in thisRoom.memory.comDispatchData) {
      const rType = g as ResourceConstant
      if (!resourceLimit[rType])
        resourceLimit[rType] = thisRoom.memory.comDispatchData[rType]!.dispatch_num
      else
        resourceLimit[rType] = Math.max(resourceLimit[rType]!, thisRoom.memory.comDispatchData[rType]!.dispatch_num)
    }
  }

  // 监测资源卖出
  for (const mtype in thisRoom.memory.market) {
    for (const obj of thisRoom.memory.market[mtype]) {
      if (!resourceLimit[obj.rType])
        resourceLimit[obj.rType] = obj.num
      else
        resourceLimit[obj.rType] = Math.max(resourceLimit[obj.rType]!, obj.num)
    }
  }

  // 监测工厂相关
  for (const b in thisRoom.memory.productData.baseList) {
    const rType = b as CommodityConstant | MineralConstant | 'energy' | 'G'

    // 基础合成物品也做一定限制
    resourceLimit[rType] = Math.ceil(thisRoom.memory.productData.baseList[rType]!.num / 2)

    // 所有基础合成物品的底物也做一定限制
    for (const row in COMMODITIES[rType].components) {
      if (['L', 'G', 'H', 'O', 'Z', 'U', 'Z'].includes(row)) {
        resourceLimit[rType] = 15000
      }
      else if (row === 'energy') {
        continue
      }
      else {
        if (!Object.keys(thisRoom.memory.productData.baseList).includes(row))
          resourceLimit[rType] = 5000
        else continue
      }
    }
  }

  if (thisRoom.memory.productData.flowCom) {
    const disCom = thisRoom.memory.productData.flowCom
    const level = COMMODITIES[disCom].level
    if (level) {
      if (level >= 4) {
        for (const row_ in COMMODITIES[disCom].components) {
          const row = row_ as CommodityConstant | MineralConstant | 'G' | 'energy' | DepositConstant
          if (!resourceLimit[row] || resourceLimit[row]! < COMMODITIES[disCom].components[row] * 10)
            resourceLimit[row] = COMMODITIES[disCom].components[row] * 10
        }
      }
      else if (level === 3) {
        for (const row_ in COMMODITIES[disCom].components) {
          const row = row_ as CommodityConstant | MineralConstant | 'G' | 'energy' | DepositConstant
          if (!resourceLimit[row] || resourceLimit[row]! < COMMODITIES[disCom].components[row] * 40)
            resourceLimit[row] = COMMODITIES[disCom].components[row] * 40
        }
      }
      else if (level <= 2) {
        for (const row_ in COMMODITIES[disCom].components) {
          const row = row_ as CommodityConstant | MineralConstant | 'G' | 'energy' | DepositConstant
          if (!resourceLimit[row] || resourceLimit[row]! < COMMODITIES[disCom].components[row] * 100)
            resourceLimit[row] = COMMODITIES[disCom].components[row] * 100
        }
      }
    }
  }

  // 检测传送任务
  if (thisRoom.countMissionByName('Structure', '资源传送') > 0) {
    for (const sobj of thisRoom.memory.mission.Structure) {
      if (sobj.name === '资源传送') {
        const sobj_rType = sobj.data.rType as ResourceConstant
        const sobj_num = sobj.data.num
        if (!resourceLimit[sobj_rType])
          resourceLimit[sobj_rType] = sobj_num
        else
          resourceLimit[sobj_rType] = resourceLimit[sobj_rType]! > sobj_num ? resourceLimit[sobj_rType] : sobj_num
      }
    }
  }
}

/* --------------隔离区---------------- */

/**
 * 判断某种类型化合物是否还需要调度
 * 1. 如果有mtype，即有该资源的资源购买任务的，则不再需要进行调度
 * 2. 如果有关该房间的资源调度信息过多，则不再需要进行调度
 * 3. 如果已经存在该资源的调度信息了，则不再需要进行调度
 * 4. 如果已经发现传往该房间的资源传送任务了，则不再需要进行调度
*/
export function identifyDispatch(thisRoom: Room, rType: ResourceConstant, num: number, disNum = 1, mtype?: 'deal' | 'order'): boolean {
  // 先判断是否已经存在该房间的调度了
  if (mtype) {
    if (Game.market.credits < 1000000)
      return false
    if (mtype === 'deal' && thisRoom.countMissionByName('Structure', '资源购买') > 0)
      return false // 存在资源购买任务的情况下，不执行资源调度
    if (mtype === 'order' && haveMarketOrder(thisRoom.name, rType, 'buy'))
      return false // 如果是下单类型 已经有单就不进行资源调度
  }
  // 资源调度数量过多则不执行资源调度
  if (getRoomDispatchNum(thisRoom.name) >= disNum)
    return false
    // 已经存在调用信息的情况
  if (checkDispatch(thisRoom.name, rType))
    return false
  // 已经存在其它房间的传送信息的情况
  if (checkSendMission(thisRoom.name, rType))
    return false
  return true
}

/**
 * 判断某种类型的函数是否可以调度
 * 1. 如果发现有房间有指定数量的某类型资源，则返回 can 代表可调度
 * 2. 如果没有发现其他房间有送往该房间资源的任务，则返回 running 代表已经有了调度任务了
 * 3. 如果没有发现调度大厅存在该类型的调度任务，则返回 running 代表已经有了调度任务了
 * 4. 以上情况都不符合，返回 no 代表不可调度
*/
export function canResourceDispatch(thisRoom: Room, rType: ResourceConstant, num: number): 'running' | 'no' | 'can' {
  // 有调度信息
  if (checkDispatch(thisRoom.name, rType))
    return 'running'
  // 有传送信息
  if (checkSendMission(thisRoom.name, rType))
    return 'running'

  for (const i in Memory.roomControlData) {
    if (i === thisRoom.name)
      continue

    if (Game.rooms[i]?.controller?.my) {
      if (!global.structureCache[i])
        continue

      const storage = Game.rooms[i].memory.structureIdData?.storageID ? Game.getObjectById(Game.rooms[i].memory.structureIdData!.storageID!) : null
      if (!storage)
        continue

      const limit = global.resourceLimit[i][rType] || 0
      if (storage.store.getUsedCapacity(rType) - limit > num)
        return 'can'
    }
  }

  // 代表房间内没有可调度的资源
  return 'no'
}
