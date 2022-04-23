import { resourceComDispatch } from '@/structure/constant/resource'
import { colorfyLog, getAveragePrice, getHighestPrice, haveMarketOrder, sortByKey, unzipPosition, zipPosition } from '@/utils'
import { defineMission } from '@/room/utils'
import { groupLabsInRoom } from '@/structure/utils'

export default {
  // 终端行为
  terminal: {
    // 默认最多8个传送任务
    send(roomName: string, disRoom: string, rType: ResourceConstant, num: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[terminal] 不存在房间 ${roomName}`

      // 查看资源是否足够
      if (!thisRoom.memory.structureIdData?.terminalID || !thisRoom.memory.structureIdData.storageID)
        return colorfyLog(`[terminal] 房间 ${roomName} 没有终端或者仓库`, 'red', true)
      const terminal = Game.getObjectById(thisRoom.memory.structureIdData.terminalID)
      const storage = Game.getObjectById(thisRoom.memory.structureIdData.storageID)
      if (!terminal || !storage) {
        delete thisRoom.memory.structureIdData.terminalID
        delete thisRoom.memory.structureIdData.storageID
        return colorfyLog(`[terminal] 房间 ${roomName} 不存在终端/仓房或记忆未更新！`, 'red', true)
      }

      const thisTask = thisRoom.generateSendMission(disRoom, rType, num)

      // 查询其他资源传送任务中是否有一样的资源
      let missionNum = 0
      if (!thisRoom.memory.mission.Structure)
        thisRoom.memory.mission.Structure = []
      for (const tM of thisRoom.memory.mission.Structure) {
        if (tM.name === '资源传送' && tM.data.rType === rType)
          missionNum += tM.data.num
      }

      // 计算资源是否满足
      if (terminal.store.getUsedCapacity(rType) + storage.store.getUsedCapacity(rType) - missionNum < num)
        return colorfyLog(`[terminal] 房间 ${roomName} 资源 ${rType} 数量总合少于 ${num}，传送任务挂载失败！`, 'yellow', true)

      // 计算路费
      const cost = Game.market.calcTransactionCost(num, roomName, disRoom)
      if (terminal.store.getUsedCapacity('energy') + storage.store.getUsedCapacity('energy') < cost || cost > 150000)
        return colorfyLog(`[terminal] 房间 ${roomName} --> ${disRoom} 资源 ${rType} 所需路费少于 ${cost} 或大于150000，传送任务挂载失败！`, 'yellow', true)

      if (thisTask && thisRoom.addMission(thisTask))
        return colorfyLog(`[terminal] 房间 ${roomName} --> ${disRoom} 资源 ${rType} 传送挂载成功！数量：${num}；路费：${cost}`, 'green', true)
      return colorfyLog(`[terminal] 房间 ${roomName} --> ${disRoom} 资源 ${rType} 传送 不明原因挂载失败！`, 'red', true)
    },
    Csend(roomName: string, disRoom: string, rType: ResourceConstant): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[terminal] 不存在房间 ${roomName}`

      for (const tM of thisRoom.memory.mission.Structure) {
        if (tM.name === '资源传送' && tM.data.rType === rType && tM.data.disRoom === disRoom) {
          if (thisRoom.removeMission(tM.id))
            return colorfyLog(`[terminal] 房间 ${roomName} --> ${disRoom} 资源 ${rType} 传送任务删除成功!`, 'blue', true)
        }
      }
      return colorfyLog(`[terminal] 房间 ${roomName}--> ${disRoom} 资源 ${rType} 传送 不明原因删除失败！`, 'red', true)
    },
    // 查看目前房间/全局的资源传送任务
    ls(roomName?: string): string {
      let roomList: string[] = []
      if (roomName) {
        roomList = [roomName]
      }
      else {
        if (!Memory.roomControlData)
          Memory.roomControlData = {}
        for (const rN in Memory.roomControlData)
          roomList.push(rN)
      }

      if (roomList.length <= 0)
        return '[terminal] 未发现房间！'

      for (const rN of roomList) {
        if (!Game.rooms[rN])
          return `[terminal] 不存在房间 ${rN}！`
      }

      let str = ''
      for (const rN of roomList) {
        if (!Game.rooms[rN].memory.mission.Structure)
          Game.rooms[rN].memory.mission.Structure = []

        if (Game.rooms[rN].countMissionByName('Structure', '资源传送') <= 0)
          continue
        str += `房间 ${colorfyLog(`${rN}`, 'yellow', true)}：\n`

        for (const m of Game.rooms[rN].memory.mission.Structure) {
          if (m.name === '资源传送')
            str += `  - ${m.data.disRoom} | 资源：${m.data.rType} | 数量：${m.data.num} \n`
        }
      }

      if (str === '')
        return '[terminal] 未发现资源传送任务！'

      return str
    },
  },
  // 全局资源传送
  give: {
    set(roomName: string, rType: ResourceConstant, num: number, pass?: boolean): string {
      if (num > 200000)
        return '[give] 资源数量太多!不能挂载全局资源传送任务!'

      // 不是自己房间需要确认
      if (!Game.rooms[roomName] && !pass)
        return '[give] 未授权的传送命令,目标房间非自己房间!'

      for (const i of Memory.resourceDispatchData) {
        if (i.sourceRoom === roomName && i.rType === rType)
          return '[give] 已经存在全局资源传送任务了!'
      }

      const dispatchTask: RDData = {
        sourceRoom: roomName,
        rType,
        num,
        delayTick: 1500,
        conditionTick: 500,
        buy: false,
        mtype: 'deal', // 可以删了
      }
      Memory.resourceDispatchData.push(dispatchTask)
      return `[give] 全局资源传送任务发布，房间 ${roomName}，资源类型 ${rType}，数量 ${num}`
    },
    rm(roomName: string, rType: ResourceConstant): string {
      for (const i of Memory.resourceDispatchData) {
        if (i.sourceRoom === roomName && i.rType === rType) {
          const index = Memory.resourceDispatchData.indexOf(i)
          Memory.resourceDispatchData.splice(index, 1)
          return `[give] 成功删除房间 ${roomName} [${rType}] 全局资源传送任务!`
        }
      }
      return `[give] 未发现房间 ${roomName} [${rType}] 全局资源传送任务!`
    },
  },

  /* 物流 */
  logistic: {
    send(roomName: string, disRoom: string, rType?: ResourceConstant, num?: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[logistic] 不存在房间 ${roomName}`

      const thisTask = thisRoom.generateResourceTransferMission(disRoom, rType, num)
      if (thisTask && thisRoom.addMission(thisTask))
        return colorfyLog(`[logistic] 房间 ${roomName} --> ${disRoom} 资源转移任务已经下达，资源类型: ${rType || '所有资源'} | 数量: ${num || '所有'}`, 'green')
      return colorfyLog(`[logistic] 房间 ${roomName} --> ${disRoom} 资源转移任务已经下达失败!`, 'red')
    },
    Csend(roomName: string, disRoom?: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[logistic] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '资源转移' && (disRoom ? i.data.disRoom === disRoom : true) && thisRoom.removeMission(i.id))
          return colorfyLog(`[logistic] 房间 ${roomName} --(${i.data.rType})--> ${disRoom} 资源转移任务删除成功!`, 'green')
      }
      return colorfyLog(`[logistic] 房间 ${roomName} --> ${disRoom} 资源转移任务删除失败!`, 'red')
    },
    // 查询所有房间的资源转移相关的物流信息
    ls(): string {
      let result = '[logisitic] 资源转移物流信息:\n'
      for (const i in Memory.roomControlData) {
        if (Game.rooms[i]?.controller?.my) {
          const room = Game.rooms[i]
          const task = room.getMissionModelByName('Room', '资源转移')
          if (task)
            result += `  ${room.name} -> ${task.data.disRoom}: 资源类型: ${task.data.rType ?? '所有资源'}，数量: ${task.data.num ?? '所有'}\n`
        }
      }
      if (result === '[logisitic] 资源转移物流信息:\n')
        return '[logisitic] 未发现资源转移物流信息'
      return result
    },
  },
  /* 外矿 */
  mine: {
    // 采集外矿
    harvest(roomName: string, x: number, y: number, disRoom: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[mine] 不存在房间 ${roomName}`

      const thisTask = thisRoom.generateOutMineMission(roomName, x, y, disRoom)
      if (thisTask) {
        thisTask.maxConcurrent = 8

        if (thisRoom.addMission(thisTask))
          return `[mine] ${roomName} -> ${disRoom} 的外矿任务挂载成功！`
      }
      return `[mine] ${roomName} -> ${disRoom} 的外矿任务挂载失败！`
    },
    // 取消采集
    Charvest(roomName: string, disRoom: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[mine] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '外矿开采' && i.data.disRoom === disRoom) {
          if (thisRoom.removeMission(i.id)) {
            if (Memory.outMineData[disRoom])
              delete Memory.outMineData[disRoom]
            return `[mine] ${roomName} -> ${disRoom} 的外矿任务删除成功！`
          }
        }
      }
      return `[mine] ${roomName} -> ${disRoom} 的外矿任务删除失败！`
    },
    // 更新外矿 road 信息
    road(roomName: string): string {
      if (!Game.rooms[roomName])
        return '[mine] 不存在相应视野'

      const roads = Game.rooms[roomName].find(FIND_STRUCTURES)
        .filter(stru => stru.structureType === 'road')
      const cons = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES)
        .filter(cons => cons.structureType === 'road')

      // 去除 road 记忆
      for (const i of Memory.outMineData[roomName].road) {
        const pos = unzipPosition(i)!
        if (pos.roomName === roomName && !pos.getStructure('road')) {
          const index = Memory.outMineData[roomName].road.indexOf(i)
          Memory.outMineData[roomName].road.splice(index, 1)
        }
      }

      const posList = []
      for (const r of roads) posList.push(zipPosition(r.pos))
      for (const c of cons) posList.push(zipPosition(c.pos))
      for (const p of posList) {
        if (!Memory.outMineData[roomName].road.includes(p))
          Memory.outMineData[roomName].road.push(p)
      }

      return `[mine] 已经更新房间${roomName}的外矿信息!`
    },
  },

  // 市场
  market: {
    // 交易订单
    deal(roomName: string, id: string, amount: number): number {
      return Game.market.deal(id, amount, roomName)
    },
    // 查询订单
    fd(rType: ResourceConstant, marType: 'buy' | 'sell'): string {
      const historyList = Game.market.getHistory(rType)

      const allNum = historyList.reduce((a, b) => a + b.avgPrice, 0)
      const avePrice = allNum / historyList.length

      const list = Game.market.getAllOrders({ type: marType, resourceType: rType })

      // 按照价格从上到下
      const newList = list.sort(sortByKey('price'))

      let result = `当前市场上资源 ${rType} 的 ${marType} 订单如下:\n`
      if (['pixel', 'access_key', 'cpu_unlock'].includes(rType)) {
        for (const i of list)
          result += `  - ID: ${i.id} 数量: ${i.amount} 价格: ${i.price} 坐标: ${i.roomName} \n`
        return result
      }

      for (const i of newList) {
        let priceColor = 'green'
        let roomColor = 'green'
        if (i.price > avePrice && i.price - avePrice > 10)
          priceColor = 'red'
        if (i.price > avePrice && i.price - avePrice <= 10)
          priceColor = 'yellow'
        if (i.price <= avePrice)
          priceColor = 'green'

        for (const roomName in Memory.roomControlData) {
          const cost = Game.market.calcTransactionCost(1000, roomName, i.roomName!)
          if (cost >= 7000) {
            roomColor = 'red'
            break
          }
          else if (cost >= 500) {
            roomColor = 'yellow'
            break
          }
          roomColor = 'green'
        }

        result += `  - ID: ${i.id} 数量: ${i.amount} 价格: ${colorfyLog(`${i.price}`, priceColor || 'blue', true)} 坐标: ${colorfyLog(`${i.roomName}`, roomColor || 'blue', true)}\n`
      }

      return result
    },
    // 下买订单
    buy(roomName: string, rType: ResourceConstant, price: number, amount: number): string {
      const result = Game.market.createOrder({
        type: 'buy',
        resourceType: rType,
        price,
        totalAmount: amount,
        roomName,
      })
      if (result === OK)
        return `[market] ${colorfyLog(`买资源 ${rType} 的订单下达成功！ 数量为 ${amount}，价格为 ${price}`, 'blue', true)}`
      return `[market] ${colorfyLog(`买资源 ${rType} 的订单出现错误，不能下达！`, 'red', true)}`
    },
    // 查询平均价格
    ave(rType: ResourceConstant, day = 1): string {
      return `[market] 资源 ${rType} 在近 ${day} 天内的平均价格为 ${getAveragePrice(rType, day)}`
    },
    // 查询是否有订单
    have(roomName: string, res: ResourceConstant, mtype: 'sell' | 'buy', p?: number, r?: number): string {
      const result = haveMarketOrder(roomName, res, mtype, p, r)
      if (p && r)
        return `[market] 房间: ${roomName}; 资源: ${res}; 类型: ${mtype} [价格: ${p + r} 以上] 的单子 ---> ${result ? '有' : '没有'}`
      else
        return `[market] 房间: ${roomName}; 资源: ${res}; 类型: ${mtype} 的单子 ---> ${result ? '有' : '没有'}`
    },
    // 查询市场上的最高价格
    highest(rType: ResourceConstant, mtype: 'sell' | 'buy', mprice = 0): string {
      const result = getHighestPrice(rType, mtype, mprice)
      if (mprice)
        return `[market] 资源: ${rType}; 类型: ${mtype} 最高价格 ${result} [低于${mprice}]`
      else
        return `[market] 资源: ${rType}; 类型: ${mtype} 最高价格 ${result}`
    },
    // 卖资源
    sell(roomName: string, rType: ResourceConstant, mType: 'deal' | 'order', num: number, price?: number, unit = 2000): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[support] 不存在房间 ${roomName}`

      if (!thisRoom.memory.market)
        thisRoom.memory.market = {}

      if (mType === 'order') {
        if (!thisRoom.memory.market.order)
          thisRoom.memory.market.order = []

        let bR = true
        for (const od of thisRoom.memory.market.order) {
          if (od.rType === rType)
            bR = false
        }

        if (bR) {
          thisRoom.memory.market.order.push({ rType, num, unit, price })
          return `[market] 房间 ${roomName} 成功下达 order 的资源卖出指令：type: sell, rType: ${rType}, num: ${num}, unit: ${unit}, price: ${price}`
        }
        return `[market] 房间 ${roomName} 已经存在 ${rType} 的 sell 订单了`
      }
      else if (mType === 'deal') {
        if (!thisRoom.memory.market.deal)
          thisRoom.memory.market.deal = []

        let bR = true
        for (const od of thisRoom.memory.market.deal) {
          if (od.rType === rType)
            bR = false
        }

        if (bR) {
          thisRoom.memory.market.deal.push({ rType, num, price, unit })
          return `[market] 房间 ${roomName} 成功下达 deal 的资源卖出指令：type: sell, rType: ${rType}, num: ${num}, price: ${price}, unit: ${unit}`
        }
        return `[market] 房间 ${roomName} 已经存在 ${rType} 的 sell 订单了`
      }
      return ''
    },
    // 查询正在卖的资源
    ls(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[support] 不存在房间 ${roomName}`

      let result = `[market] 目前房间 ${roomName} 存在如下资源卖出订单:\n`
      for (const mtype in thisRoom.memory.market) {
        for (const i of thisRoom.memory.market[mtype])
          result += `  - [${mtype}] 资源: ${i.rType} 数量: ${i.num}\n`
      }
      return result
    },
    // 取消卖资源
    cancel(roomName: string, mtype: 'order' | 'deal', rType: ResourceConstant): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[support] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.market[mtype]) {
        if (i.rType === rType) {
          if (mtype === 'order') {
            if (i.rType !== 'energy')
              delete thisRoom.memory.TerminalData[i.rType]

            if (i.id) {
              const order = Game.market.getOrderById(i.id)
              if (order)
                Game.market.cancelOrder(order.id)
            }

            const index = thisRoom.memory.market.order.indexOf(i)
            thisRoom.memory.market.order.splice(index, 1)

            return colorfyLog(`[market] 房间 ${roomName} 取消资源 [${rType}----${mtype}] 卖出配置成功`, 'blue')
          }
          else {
            if (i.rType !== 'energy')
              delete thisRoom.memory.TerminalData[i.rType]

            const index = thisRoom.memory.market.deal.indexOf(i)
            thisRoom.memory.market.deal.splice(index, 1)

            return colorfyLog(`[market] 房间 ${roomName} 取消资源 [${rType}----${mtype}] 卖出配置成功`, 'blue')
          }
        }
      }

      return colorfyLog(`[market] 房间 ${roomName} 取消资源 [${rType}----${mtype}] 卖出配置失败`, 'red')
    },
  },

  // lab
  lab: {
    // 初始化 lab
    init(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[lab] 未找到房间 ${roomName}，请确认房间!`
      if (!myRoom.memory.structureIdData)
        myRoom.memory.structureIdData = {}

      // 初始化 原先配置清零
      delete myRoom.memory.structureIdData.labInspect

      const result = groupLabsInRoom(roomName)
      if (result == null)
        return `[lab] 房间 ${roomName} 初始化合成 lab 信息失败!`

      myRoom.memory.structureIdData.labInspect = result

      return [
        `[lab] 房间 ${roomName} 初始化  lab信息成功!`,
        '底物 lab:',
        result.raw1,
        result.raw2,
        '合成 lab:',
        ...result.com,
      ].join('\n')
    },
    // 挂载具体合成任务
    compound(roomName: string, res: ResourceConstant, num: number): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[lab] 未找到房间 ${roomName}，请确认房间`

      const bindIds = myRoom.memory.structureIdData?.labInspect?.com
        .filter(i => myRoom.memory.roomLabBind?.[i])
      if (!bindIds?.length)
        return `[lab] 房间 ${roomName} 没有合成 lab 可以挂载任务`

      const thisTask = myRoom.generateCompoundMission(num, res, bindIds)
      if (thisTask === null)
        return '[lab] 挂载合成任务失败!'

      if (myRoom.addMission(thisTask))
        return `[lab] 房间 ${roomName} 合成 ${res} 任务挂载成功! ${thisTask.data.raw1} + ${thisTask.data.raw2} = ${res}`
      return `[lab] 房间 ${roomName} 挂载合成任务失败!`
    },
    // 取消具体合成任务
    Ccompound(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[lab] 未找到房间 ${roomName}，请确认房间`

      for (const i of myRoom.memory.mission.Room) {
        if (i.name === '资源合成') {
          if (myRoom.removeMission(i.id))
            return `[lab] 房间 ${roomName} 合成任务删除成功!`
        }
      }
      return colorfyLog(`[lab] 房间 ${roomName} 删除合成任务失败!`, 'red')
    },
    // lab 合成规划 (自动执行具体合成任务 无需挂载)
    dispatch(roomName: string, res: MineralCompoundConstant, num: number): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[lab] 未找到房间 ${roomName}，请确认房间!`

      if (!resourceComDispatch[res])
        return `[lab] 不存在资源 ${res}！`

      if (myRoom.memory.comDispatchData
        && Object.keys(myRoom.memory.comDispatchData).length > 0)
        return `[lab] 房间 ${roomName} 已经存在资源合成调度数据`

      myRoom.memory.comDispatchData = {}
      for (const i of resourceComDispatch[res])
        myRoom.memory.comDispatchData[i as MineralCompoundConstant] = { dispatch_num: num }

      return `[lab] 已经修改房间 ${roomName} 的合成规划数据，为 [${resourceComDispatch[res].join(', ')}]，数量：${num}`
    },
    // 取消 lab 合成规划
    Cdispatch(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[lab] 未找到房间 ${roomName}，请确认房间!`

      delete myRoom.memory.comDispatchData

      return `[lab] 已经修改房间 ${roomName} 的合成规划数据，为 undefined，本房见现已无资源合成调度`
    },
  },
  // power
  power: {
    // 开始、停止升级 gpl
    toggle(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[power] 未找到房间 ${roomName}，请确认房间!`

      myRoom.memory.toggles.StartPower = !myRoom.memory.toggles.StartPower

      return `[power] 房间 ${roomName} 的 power 升级已经设置为 ${myRoom.memory.toggles.StartPower}`
    },
    // 节省能量和 Power 的模式
    save(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[power] 未找到房间 ${roomName}，请确认房间!`

      myRoom.memory.toggles.SavePower = !myRoom.memory.toggles.SavePower

      return `[power] 房间 ${roomName} 的 power 升级的 SavePower 选项已经设置为 ${myRoom.memory.toggles.SavePower}`
    },
    // 限制 pc 的技能
    option(roomName: string, type: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[power] 未找到房间 ${roomName}，请确认房间!`

      const toggleName = {
        storage: 'StopEnhanceStorage',
        tower: 'StopEnhanceTower',
        lab: 'StopEnhanceLab',
        extension: 'StopEnhanceExtension',
        spawn: 'StopEnhanceSpawn',
        factory: 'StopEnhanceFactory',
        powerspawn: 'StopEnhancePowerSpawn',
      }[type]
      if (!toggleName)
        return '[power] stru数据错误!'

      if (!myRoom.memory.toggles[toggleName]) {
        myRoom.memory.toggles[toggleName] = true
        return `[power] 房间 ${roomName} 的 ${toggleName} 选项调整为 true! 将不执行对应的 power 操作`
      }
      else {
        delete myRoom.memory.toggles[toggleName]
        return `[power] 房间 ${roomName} 的 ${toggleName} 选项调整为 false! 将执行对应的 power 操作`
      }
    },
    // 输出pc的技能限制清单
    stat(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[power] 未找到房间 ${roomName}，请确认房间!`

      let result = `[power] 房间 ${roomName} 的 power 操作开关:\n`
      for (const i of [
        'StopEnhanceStorage',
        'StopEnhanceTower',
        'StopEnhanceLab',
        'StopEnhanceExtension',
        'StopEnhanceFactory',
        'StopEnhancePowerSpawn',
      ]) {
        if (myRoom.memory.toggles[i])
          result += colorfyLog(`  - ${i}: true\n`, 'red', true)
        else result += colorfyLog(`  - ${i}: false\n`, 'green', true)
      }

      return result
    },
    // 创建pc
    create(roomName: string, pcType: 'queen'): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[power] 未找到房间 ${roomName}，请确认房间!`

      if (!['queen'].includes(pcType))
        return '[power] 不存在该类型 pc!'

      if (Game.powerCreeps[`${roomName}/${pcType}/${Game.shard.name}`])
        return `[power] 已经存在名为 ${roomName}/${pcType}/${Game.shard.name} 的 pc 了! `

      let result
      if (pcType === 'queen')
        result = PowerCreep.create(`${roomName}/${pcType}/${Game.shard.name}`, POWER_CLASS.OPERATOR)

      if (result === OK)
        return `[power] 房间 ${roomName} 成功创建 ${pcType} 类型pc!`
      else return `[power] 创建失败，错误码: ${result}`
    },
    // 删除pc
    del(name: string, pass?: boolean): string {
      if (!Game.powerCreeps[name])
        return `[power] 不存在名称为 ${name} 的pc!`

      if (!pass)
        return '[power] 未确认，验证不通过!'

      Game.powerCreeps[name].delete()

      return `[power] 名称为 ${name} 的 pc 已经删除! 如非测试模式，可能未立即删除！请等候24小时！`
    },
  },

  // 过道行为
  cross: {
    // 初始化过道任务
    init(roomName: string, relateRoom: string[]): string {
      // relateRoom = ['start'].concat(relateRoom)
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      if (!thisRoom.controller || thisRoom.controller.level < 8)
        return `[cross] 房间 ${roomName} 控制器等级不足！`

      const thisTask = defineMission({
        name: '过道采集',
        category: 'Room',
        delayTick: 99999,
        data: {
          power: false,
          deposit: false,
          relateRooms: relateRoom,
        },
      })

      if (thisRoom.addMission(thisTask))
        return `[cross] 房间 ${roomName} 初始化过道采集任务成功！ 房间：${relateRoom}`
      else return `[cross] 房间 ${roomName} 初始化过道采集任务失败！请检查房间内是否已经存在该任务！`
    },
    toggle(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      thisRoom.memory.toggles.StopCross = !thisRoom.memory.toggles.StopCross

      if (thisRoom.memory.toggles.StopCross)
        return `[cross] 房间 ${roomName} 关闭过道!`
      return `[cross] 房间 ${roomName} 开启过道!`
    },
    // active power
    power(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          i.data.power = !i.data.power
          if (i.data.power)
            return colorfyLog(`[cross] 房间 ${roomName} 过道采集任务的power属性已经更改为 ${i.data.power}`, 'blue')
          else
            return colorfyLog(`[cross] 房间 ${roomName} 过道采集任务的power属性已经更改为 ${i.data.power}`, 'yellow')
        }
      }
      return `[cross] 房间 ${roomName} 更改过道采集任务 power 属性失败！请检查房间内是否已经存在该任务！`
    },
    deposit(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          i.data.deposit = !i.data.deposit
          if (i.data.deposit)
            return colorfyLog(`[cross] 房间 ${roomName} 过道采集任务的 deposit 属性已经更改为 ${i.data.deposit}`, 'blue')
          else
            return colorfyLog(`[cross] 房间 ${roomName} 过道采集任务的 deposit 属性已经更改为 ${i.data.deposit}`, 'yellow')
        }
      }
      return `[cross] 房间 ${roomName} 更改过道采集任务 deposit 属性失败！请检查房间内是否已经存在该任务！`
    },
    room(roomName: string, roomData: string[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          i.data.relateRooms = roomData
          return `[cross] 房间 ${roomName} 过道采集任务的房间已经更改为 [${roomData.join(', ')}]`
        }
      }
      return `[cross] 房间 ${roomName} 更改过道采集任务 deposit 属性失败！请检查房间内是否已经存在该任务！`
    },
    // 删除某个房间
    rm(roomName: string, delRoomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          // 进行删除
          for (const j of i.data.relateRooms) {
            if (j === delRoomName) {
              const list = i.data.relateRooms as string[]
              list.splice(list.indexOf(delRoomName), 1)
              return `[cross] 房间 ${roomName} 的过道采集清单里已经删除房间 ${j}！ 现有房间列表为 [${i.data.relateRooms.join(', ')}]`
            }
          }
          return `[cross] 房间 ${roomName} 过道采集任务的房间清单未找到房间 ${delRoomName}`
        }
      }

      return `[cross] 房间 ${roomName} 更改过道采集任务房间清单失败！请检查房间内是否已经存在该任务！`
    },
    // 增加某个房间
    add(roomName: string, addRoomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          // 进行删除
          if (i.data.relateRooms.includes(addRoomName)) {
            return `[cross] 房间 ${roomName} 过道采集任务的房间清单已经存在房间 ${addRoomName}`
          }
          else {
            i.data.relateRooms.push(addRoomName)
            return `[cross] 房间 ${roomName} 过道采集任务的房间清单已经添加房间 ${addRoomName}！以下为房间清单：[${i.data.relateRooms.join(', ')}]`
          }
        }
      }

      return `[cross] 房间 ${roomName} 更改过道采集任务房间清单失败！请检查房间内是否已经存在该任务！`
    },
    // 删除某个具体 power 任务
    delpower(roomName: string, disRoom: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === 'power采集' && i.data.room === disRoom) {
          if (thisRoom.removeMission(i.id))
            return `[cross] 删除 ${roomName} --> ${disRoom} 的 power 采集任务成功！`
          else
            return `[cross] 删除 ${roomName} --> ${disRoom} 的 power 采集任务失败！`
        }
      }
      return `[cross] 未找到 ${roomName} --> ${disRoom} 的 power 采集任务`
    },
    // 输出过道详细信息
    stat(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      let str = ''
      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          str += `[cross] 房间 ${roomName} 的过道采集任务详情配置如下：\n`
          str += `  - 房间：${i.data.relateRooms}\n`
          str += `  - power: ${i.data.power}\n`
          str += `  - deposit: ${i.data.deposit}\n`
          str += '  - 目前存在如下任务：\n'
          // 寻找目前存在的过道采集任务
          for (const j of thisRoom.memory.mission.Creep) {
            if (j.name === 'power采集')
              str += `    - power 采集任务 ${roomName} --> ${j.data.room}，state: ${j.data.state}\n`
            if (j.name === 'deposit采集')
              str += `    - deposit 采集任务 ${roomName} --> ${j.data.room} ，state: ${j.data.state}\n`
          }
          return str
        }
      }

      return `[cross] 房间 ${roomName} 展示过道采集任务失败！请检查房间内是否已经存在该任务！`
    },
    /* 取消过道采集开关 */
    cancel(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[cross] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Room) {
        if (i.name === '过道采集') {
          thisRoom.removeMission(i.id)
          return `[cross] 房间 ${roomName} 已取消过道采集任务！`
        }
      }
      return `[cross] 房间 ${roomName} 取消过道采集任务失败！请检查房间内是否已经存在该任务！`
    },
  },
  // 工厂行为
  factory: {
    // 启动、关闭工厂
    toggle(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      myRoom.memory.toggles.StopFactory = !myRoom.memory.toggles.StopFactory

      if (myRoom.memory.toggles.StopFactory)
        return `[factory] 房间 ${roomName} 的工厂加工已经停止!`
      return `[factory] 房间 ${roomName} 的工厂加工已经启动!`
    },
    // 输出工厂状态
    stat(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      if (myRoom.memory.toggles.StopFactory)
        return `[factory] 房间 ${roomName} 工厂停工中`

      const productData = myRoom.memory.productData
      let result = `[factory] 房间 ${roomName} 的工厂加工信息如下:\n`

      result += `工厂等级: ${productData.level}\n`
      result += `工厂状态: ${productData.state}\n`

      result += '基本加工资源列表:\n'
      for (const i in productData.baseList)
        result += `  - ${i}: ${productData.baseList[i as keyof typeof productData.baseList]?.num || 0}\n`

      result += `流水线商品: ${myRoom.memory.productData.flowCom}\n`

      if (productData.producing)
        result += `正在合成的资源: ${productData.producing.com || '无'}, 数量：${productData.producing.num || '无'}\n`

      return result
    },
    // 初始化等级
    level(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      if (!Game.powerCreeps[`${myRoom.name}/queen/${Game.shard.name}`])
        return `[factory] ${myRoom.name}此房间无pc请先孵化pc!`

      myRoom.checkPcEnhanceFactory()

      return `[factory] 房间 ${roomName} 发布 pc 确定工厂等级任务成功!`
    },
    // 添加工厂基本物资合成清单
    add(roomName: string, cType: CommodityConstant, num: number): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      if (!myRoom.memory.structureIdData?.factoryId)
        return `[factory] 房间 ${roomName} 无工厂，请先建造工厂!`
      const factory = Game.getObjectById(myRoom.memory.structureIdData.factoryId)
      if (!factory)
        return colorfyLog(`[factory] 未找到房间 ${roomName} 的工厂!`, 'red', true)

      return factory.add(cType, num)
    },
    // 删除工厂基本物资合成
    remove(roomName: string, cType: CommodityConstant): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      if (!myRoom.memory.structureIdData?.factoryId)
        return `[factory] 房间 ${roomName} 无工厂，请先建造工厂!`
      const factory = Game.getObjectById(myRoom.memory.structureIdData.factoryId)
      if (!factory)
        return colorfyLog(`[factory] 未找到房间 ${roomName} 的工厂!`, 'red', true)

      return factory.remove(cType)
    },
    // 设置工厂流水线生产物资
    set(roomName: string, cType: CommodityConstant): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      if (!myRoom.memory.structureIdData?.factoryId)
        return `[factory] 房间 ${roomName} 无工厂，请先建造工厂!`
      const factory = Game.getObjectById(myRoom.memory.structureIdData.factoryId)
      if (!factory)
        return colorfyLog(`[factory] 未找到房间 ${roomName} 的工厂!`, 'red', true)

      return factory.set(cType)
    },
    // 取消工厂流水线生产物资
    del(roomName: string, cType: CommodityConstant): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[factory] 未找到房间 ${roomName}，请确认房间!`

      if (!myRoom.memory.structureIdData?.factoryId)
        return `[factory] 房间 ${roomName} 无工厂，请先建造工厂!`
      const factory = Game.getObjectById(myRoom.memory.structureIdData.factoryId)
      if (!factory)
        return colorfyLog(`[factory] 未找到房间 ${roomName} 的工厂!`, 'red', true)

      return factory.del(cType)
    },
  },

  pixel(): string {
    Memory.stopPixel = !Memory.stopPixel
    return `[pixel] 自动搓像素改为 ${!Memory.stopPixel}`
  },
}
