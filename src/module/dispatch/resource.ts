/* 资源调度模块 */

import { avePrice, checkDispatch, checkLabBindResource, checkSend, getRoomDispatchNum, haveOrder, highestPrice } from '../fun/funtion'
import { t1Compounds, t2Compounds, t3Compounds } from '@/constant/ResourceConstant'
import { colorfyLog, isInArray } from '@/utils'

// 主调度函数
export function ResourceDispatch(thisRoom: Room): void {
  if ((Game.time - global.Gtime[thisRoom.name]) % 15)
    return
  // 处理订单前检查
  const storage_ = global.structureCache[thisRoom.name].storage as StructureStorage
  const terminal_ = global.structureCache[thisRoom.name].terminal as StructureTerminal
  if (thisRoom.controller.level < 6 || !storage_ || !terminal_)
    return
  if (thisRoom.countMissionByName('Structure', '资源传送') >= 1)
    return // 如果房间有资源传送任务，则不执行
  // ResourceLimit更新
  ResourceLimitUpdate(thisRoom)
  /* 对资源调度进行操作 */
  for (const i of Memory.resourceDispatchData) {
    // 执行资源调度
    if (i.sourceRoom == thisRoom.name) {
      // 执行买操作
      if (i.conditionTick <= 0 && i.buy) {
        if (i.mtype == 'order') {
          /**
                     *       1.获取近两天的平均价格
                     *       2.拉取平均价格+10以内价格最高的订单
                     *       3.发布订单的价格比最高的订单的价格多0.01
                    */
          console.log(colorfyLog(`[资源调度] 房间${thisRoom.name}需求资源[${i.rType}]无法调度,将进行购买! 购买方式为${i.mtype},购买数量${i.num}`, 'yellow'))
          const ave = avePrice(i.rType, 2)
          if (!haveOrder(thisRoom.name, i.rType, 'buy', ave)) {
            const highest = highestPrice(i.rType, 'buy', ave + 10)
            const result = Game.market.createOrder({
              type: ORDER_BUY,
              resourceType: i.rType,
              price: highest + 0.01,
              totalAmount: i.num,
              roomName: thisRoom.name,
            })
            if (result != OK) { console.log('[资源调度]创建能量订单出错,房间', thisRoom.name); continue }
            console.log(colorfyLog(`房间${thisRoom.name}创建${i.rType}订单,价格:${highest + 0.01};数量:${i.num}`, 'green', true))
            i.delayTick = 0
          }
          continue
        }
        else if (i.mtype == 'deal') {
          if (thisRoom.checkBuy(i.rType) || thisRoom.countMissionByName('Structure', '资源购买') >= 2)
            continue
          // 在一定范围内寻找最便宜的订单deal 例如平均价格20 范围 10 最高价格31 便只能接受30以下的价格 （根据资源不同选择不同参数）
          console.log(colorfyLog(`[资源调度] 房间${thisRoom.name}需求资源[${i.rType}]无法调度,将进行购买! 购买方式为${i.mtype},购买数量:${i.num}`, 'yellow'))
          // 能量 ops
          if (isInArray(['ops', 'energy'], i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 5, 10)
            if (task) { thisRoom.addMission(task); i.delayTick = 0 } continue
          }
          // 原矿 中间化合物
          else if (isInArray(['X', 'L', 'H', 'O', 'Z', 'K', 'U', 'G', 'OH', 'ZK', 'UL'], i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 10, 30)
            if (task) { thisRoom.addMission(task); i.delayTick = 0 } continue
          }
          // t3
          else if (isInArray(t3Compounds, i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 50, 150)
            if (task) { thisRoom.addMission(task); i.delayTick = 0 } continue
          }
          // power
          else if (i.rType == 'power') {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 20, 70)
            if (task) { thisRoom.addMission(task); i.delayTick = 0 } continue
          }
          // t1 t2
          else if (isInArray(t2Compounds, i.rType) || isInArray(t1Compounds, i.rType)) {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 20, 65)
            if (task) { thisRoom.addMission(task); i.delayTick = 0 } continue
          }
          // 其他商品类资源 bar类资源
          else {
            const task = thisRoom.generateBuyMission(i.rType, i.num, 50, 200)
            if (task) { thisRoom.addMission(task); i.delayTick = 0 } continue
          }
        }
        else {
          // 未定义i.mtype 便按照默认的执行
          if (i.rType == 'energy')
            i.mtype = 'order'
          else i.mtype = 'deal'
          continue
        }
      }
    }
    else {
      if (i.dealRoom)
        continue
      // 接单
      if (storage_.store.getUsedCapacity(i.rType))
        var limitNum = global.resourceLimit[thisRoom.name][i.rType] ? global.resourceLimit[thisRoom.name][i.rType] : 0
      if (storage_.store.getUsedCapacity(i.rType) <= 0)
        continue // 没有就删除
      // storage里资源大于等于调度所需资源
      if ((storage_.store.getUsedCapacity(i.rType) - limitNum) >= i.num) {
        const SendNum = i.num > 50000 ? 50000 : i.num
        const task = thisRoom.generateSendMission(i.sourceRoom, i.rType, SendNum)
        if (task && thisRoom.addMission(task)) {
          if (i.num <= 50000)
            i.dealRoom = thisRoom.name // 如果调度数量大于50k 则只减少num数量
          console.log(`房间${thisRoom.name}接取房间${i.sourceRoom}的资源调度申请,资源:${i.rType},数量:${SendNum}`)
          i.num -= SendNum
          return
        }
      }
      // sotrage里资源小于调度所需资源
      if ((storage_.store.getUsedCapacity(i.rType) - limitNum) > 0 && storage_.store.getUsedCapacity(i.rType) - limitNum < i.num) {
        const SendNum = storage_.store.getUsedCapacity(i.rType) - limitNum
        const task = thisRoom.generateSendMission(i.sourceRoom, i.rType, SendNum)
        if (task && thisRoom.addMission(task)) {
          console.log(`房间${thisRoom.name}接取房间${i.sourceRoom}的资源调度申请,资源:${i.rType},数量:${SendNum}`)
          i.num -= SendNum
          return
        }
      }
    }
  }
}

// 调度信息超时管理器
export function ResourceDispatchTick(): void {
  for (const i of Memory.resourceDispatchData) {
    // 超时将删除调度信息
    if (!i.delayTick || i.delayTick <= 0 || i.num <= 0 || !i.rType) {
      console.log(`[资源调度]房间${i.sourceRoom}的[${i.rType}]资源调度删除!原因:调度任务已部署|超时|无效调度`)
      const index = Memory.resourceDispatchData.indexOf(i)
      Memory.resourceDispatchData.splice(index, 1)
    }
    if (i.delayTick > 0)
      i.delayTick--
    if (i.conditionTick > 0) {
      if (i.dealRoom) // 有deal房间的时候， conditionTick衰减减慢
      {
        if (Game.time % 5 == 0)
          i.conditionTick--
      }
      else {
        i.conditionTick--
      }
    }
  }
}

// 调度信息更新器  ResourceLimit 建议放global里
export function ResourceLimitUpdate(thisRoom: Room): void {
  global.resourceLimit[thisRoom.name] = {} // 初始化
  global.resourceLimit[thisRoom.name].energy = 350000
  for (const i of t3Compounds) global.resourceLimit[thisRoom.name][i] = 8000 // 所有t3保存8000基础量，以备应急
  for (var b of ['X', 'L', 'Z', 'U', 'K', 'O', 'H', 'ops']) global.resourceLimit[thisRoom.name][b] = 15000 // 所有基础资源保存15000的基础量
  // 监测boost
  if (Object.keys(thisRoom.memory.roomLabBind).length > 0) {
    for (const l in thisRoom.memory.roomLabBind) {
      const lab = Game.getObjectById(l) as StructureLab
      if (!lab)
        continue
      if (!global.resourceLimit[thisRoom.name][thisRoom.memory.roomLabBind[l].rType])
        global.resourceLimit[thisRoom.name][thisRoom.memory.roomLabBind[l].rType] = 8000
      else
        global.resourceLimit[thisRoom.name][thisRoom.memory.roomLabBind[l].rType] = global.resourceLimit[thisRoom.name][thisRoom.memory.roomLabBind[l].rType] > 8000 ? global.resourceLimit[thisRoom.name][thisRoom.memory.roomLabBind[l].rType] : 8000
    }
  }
  // 监测lab合成
  if (thisRoom.countMissionByName('Room', '资源合成') > 0) {
    for (const m of thisRoom.memory.mission.Room) {
      if (m.name == '资源合成') {
        if (!global.resourceLimit[thisRoom.name][m.data.raw1])
          global.resourceLimit[thisRoom.name][m.data.raw1] = m.data.num
        else
          global.resourceLimit[thisRoom.name][m.data.raw1] = global.resourceLimit[thisRoom.name][m.data.raw1] > m.data.num ? global.resourceLimit[thisRoom.name][m.data.raw1] : m.data.num

        if (!global.resourceLimit[thisRoom.name][m.data.raw2])
          global.resourceLimit[thisRoom.name][m.data.raw2] = m.data.num
        else
          global.resourceLimit[thisRoom.name][m.data.raw2] = global.resourceLimit[thisRoom.name][m.data.raw2] > m.data.num ? global.resourceLimit[thisRoom.name][m.data.raw2] : m.data.num
      }
    }
  }
  // 监测合成规划
  if (Object.keys(thisRoom.memory.comDispatchData).length > 0) {
    for (const g in thisRoom.memory.comDispatchData) {
      if (!global.resourceLimit[thisRoom.name][g])
        global.resourceLimit[thisRoom.name][g] = thisRoom.memory.comDispatchData[g].dispatch_num
      else
        global.resourceLimit[thisRoom.name][g] = global.resourceLimit[thisRoom.name][g] > thisRoom.memory.comDispatchData[g].dispatch_num ? global.resourceLimit[thisRoom.name][g] : thisRoom.memory.comDispatchData[g].dispatch_num
    }
  }
  // 监测资源卖出
  for (const mtype in thisRoom.memory.market) {
    for (const obj of thisRoom.memory.market[mtype]) {
      if (!global.resourceLimit[thisRoom.name][obj.rType])
        global.resourceLimit[thisRoom.name][obj.rType] = obj.num
      else
        global.resourceLimit[thisRoom.name][obj.rType] = global.resourceLimit[thisRoom.name][obj.rType] > obj.num ? global.resourceLimit[thisRoom.name][obj.rType] : obj.num
    }
  }
  // 监测工厂相关
  for (var b in thisRoom.memory.productData.baseList) {
    // 基础合成物品也做一定限制
    global.resourceLimit[thisRoom.name][b] = Math.ceil(thisRoom.memory.productData.baseList[b].num / 2)
    // 所有基础合成物品的底物也做一定限制
    LoopC:
    for (const row in COMMODITIES[b].components) {
      if (isInArray(['L', 'G', 'H', 'O', 'Z', 'U', 'Z'], row)) { global.resourceLimit[thisRoom.name][row] = 15000 }
      else if (row == 'energy') { continue LoopC }
      else {
        if (!isInArray(Object.keys(thisRoom.memory.productData.baseList), row))
          global.resourceLimit[thisRoom.name][row] = 5000

        else continue LoopC
      }
    }
  }
  if (thisRoom.memory.productData.flowCom) {
    const disCom = thisRoom.memory.productData.flowCom
    if (COMMODITIES[disCom].level >= 4) {
      for (const row in COMMODITIES[b].components) {
        if (!global.resourceLimit[thisRoom.name][row] || global.resourceLimit[thisRoom.name][row] < COMMODITIES[b].components[row] * 10)
          global.resourceLimit[thisRoom.name][row] = COMMODITIES[b].components[row] * 10
      }
    }
    else if (COMMODITIES[disCom].level == 3) {
      for (const row in COMMODITIES[b].components) {
        if (!global.resourceLimit[thisRoom.name][row] || global.resourceLimit[thisRoom.name][row] < COMMODITIES[b].components[row] * 40)
          global.resourceLimit[thisRoom.name][row] = COMMODITIES[b].components[row] * 40
      }
    }
    else if ((COMMODITIES[disCom].level <= 2)) {
      for (const row in COMMODITIES[b].components) {
        if (!global.resourceLimit[thisRoom.name][row] || global.resourceLimit[thisRoom.name][row] < COMMODITIES[b].components[row] * 100)
          global.resourceLimit[thisRoom.name][row] = COMMODITIES[b].components[row] * 100
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
export function identifyDispatch(thisRoom: Room, resource_: ResourceConstant, num: number, disNum = 1, mtype?: 'deal'|'order'): boolean {
  // 先判断是否已经存在该房间的调度了
  if (mtype) {
    if (Game.market.credits < 1000000)
      return false
    if (mtype == 'deal' && thisRoom.countMissionByName('Structure', '资源购买') > 0)
      return false // 存在资源购买任务的情况下，不执行资源调度
    if (mtype == 'order' && haveOrder(thisRoom.name, resource_, 'buy'))
      return false // 如果是下单类型 已经有单就不进行资源调度
  }
  if (getRoomDispatchNum(thisRoom.name) >= disNum)
    return false // 资源调度数量过多则不执行资源调度
  if (checkDispatch(thisRoom.name, resource_))
    return false // 已经存在调用信息的情况
  if (checkSend(thisRoom.name, resource_))
    return false // 已经存在其它房间的传送信息的情况
  return true
}

/**
 * 判断某种类型的函数是否可以调度
 * 1. 如果发现有房间有指定数量的某类型资源，则返回 can 代表可调度
 * 2. 如果没有发现其他房间有送往该房间资源的任务，则返回 running 代表已经有了调度任务了
 * 3. 如果没有发现调度大厅存在该类型的调度任务，则返回 running 代表已经有了调度任务了
 * 4. 以上情况都不符合，返回 no 代表不可调度
*/
export function ResourceCanDispatch(thisRoom: Room, resource_: ResourceConstant, num: number): 'running'|'no'|'can' {
  if (checkDispatch(thisRoom.name, resource_))
    return 'running'// 有调度信息
  if (checkSend(thisRoom.name, resource_))
    return 'running' // 有传送信息
  for (const i in Memory.roomControlData) {
    if (i == thisRoom.name)
      continue
    if (Game.rooms[i] && Game.rooms[i].controller && Game.rooms[i].controller.my) {
      if (!global.structureCache[i])
        continue
      const storage_ = global.structureCache[i].storage as StructureStorage
      if (!storage_)
        continue
      const limit = global.resourceLimit[i][resource_] ? global.resourceLimit[i][resource_] : 0
      if (storage_.store.getUsedCapacity(resource_) - limit > num)
        return 'can'
    }
  }
  return 'no' // 代表房间内没有可调度的资源
}
