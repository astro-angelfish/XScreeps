import { colorfyLog, getAveragePrice, getHighestPrice, haveMarketOrder, profileMethod, sortByKey } from '@/utils'

// terminal 扩展
export default class terminalExtension extends StructureTerminal {
  @profileMethod()
  public manageMission(): void {
    // 急速冲级状态下停止 terminal 功能
    if (this.room.countMissionByName('Creep', '急速冲级') > 0)
      return

    const tasks = this.room.memory.mission.Structure
      .filter(mission => mission.structure?.includes(this.id))
      .sort(sortByKey('level'))

    const thisTask = tasks[0]

    if (!thisTask || !['资源传送'].includes(thisTask.name)) {
      // terminal 默认操作
      this.processResourceBalance() // 资源平衡
      this.processResourceMarket() // 资源买卖
      if (!thisTask)
        return
    }

    if (thisTask.delayTick < 99995)
      thisTask.processing = true

    switch (thisTask.name) {
      case '资源传送': { this.processResourceSendMission(thisTask); break }
      case '资源购买': { this.processResourceDealMission(thisTask); break }
    }
  }

  /**
   * 资源平衡函数，用于平衡房间中资源数量以及资源在 terminal 和 storage 中的分布，尤其是能量和原矿
   */
  public processResourceBalance(): void {
    this.processResourceMemory()
    // terminal 资源平衡
    if ((Game.time - global.Gtime[this.room.name]) % 7)
      return

    const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
    if (!storage) {
      console.log('找不到 storage！')
      return
    }

    for (const rType_ in this.store) {
      if (this.room.countCreepMissionByName('manage', '物流运输') >= 1)
        return
      const rType = rType_ as ResourceConstant

      // 数量
      const num = this.store[rType]

      // terminalData 里没有该数据
      if (!this.room.memory.TerminalData[rType] || !this.room.memory.TerminalData[rType].num) {
        if (storage.store.getFreeCapacity() < 40000)
          continue
        const thisTask = this.room.generateCarryMission(
          { manage: { num: 1, bind: [] } },
          20,
          this.room.name, this.pos.x, this.pos.y,
          this.room.name, storage.pos.x, storage.pos.y,
          rType, num)
        this.room.addMission(thisTask)
      }
      else if (num > this.room.memory.TerminalData[rType].num) {
        if (storage.store.getFreeCapacity() < 40000)
          continue
        const thisTask = this.room.generateCarryMission(
          { manage: { num: 1, bind: [] } },
          20,
          this.room.name, this.pos.x, this.pos.y,
          this.room.name, storage.pos.x, storage.pos.y,
          rType, num - this.room.memory.TerminalData[rType].num)
        this.room.addMission(thisTask)
      }
    }

    for (const rType_ in this.room.memory.TerminalData) {
      if (this.room.countCreepMissionByName('manage', '物流运输') >= 1)
        return
      const rType = rType_ as ResourceConstant

      if (!this.room.memory.TerminalData[rType].fill)
        continue

      const num = this.store[rType] || 0

      if (num < this.room.memory.TerminalData[rType].num) {
        if (this.store.getFreeCapacity() < 5000)
          continue
        if (rType === 'energy') {
          if ((storage.store.energy || 0) <= 20000)
            continue
        }
        else if (!storage.store[rType] && num < this.room.memory.TerminalData[rType].num) {
          continue
        }

        const thisTask = this.room.generateCarryMission(
          { manage: { num: 1, bind: [] } },
          20,
          this.room.name, storage.pos.x, storage.pos.y,
          this.room.name, this.pos.x, this.pos.y,
          rType, this.room.memory.TerminalData[rType].num - num > 0 ? this.room.memory.TerminalData[rType].num - num : 100)
        this.room.addMission(thisTask)
      }
    }
  }

  /**
   * 资源记忆更新函数
   */
  public processResourceMemory(): void {
    // terminal 自身资源管理
    const terminalData = this.room.memory.TerminalData
    for (const i in terminalData) {
      // 数量小于0就删除数据，节省 memory
      if (terminalData[i].num <= 0)
        delete terminalData[i]
    }
  }

  /**
   * 资源买卖函数 只买能量、挂单、卖 (不 deal 买资源)
   */
  public processResourceMarket(): void {
    if ((Game.time - global.Gtime[this.room.name]) % 27)
      return

    // 能量自动购买区 [与MarketData无关] storage 内能量小于 200000 时自动购买
    // 清理过期订单
    if (Object.keys(Game.market.orders).length > 80) {
      for (const j in Game.market.orders) {
        const order = Game.market.getOrderById(j)
        if (!order!.remainingAmount)
          Game.market.cancelOrder(j)
      }
    }

    const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
    if (!storage) {
      console.log('找不到 storage！')
      return
    }

    // 能量购买函数
    const storeNum = (storage.store.energy || 0) + (this.store.energy || 0)

    // 能量一般少的情况下，下平均价格订单购买能量
    if (storeNum < 250000 && storeNum >= 100000) {
      const ave = getAveragePrice('energy', 1)
      const price = ave * 1.1
      if (!haveMarketOrder(this.room.name, 'energy', 'buy', price, -0.2)) {
        const result = Game.market.createOrder({
          type: ORDER_BUY,
          resourceType: 'energy',
          price: price + 0.001,
          totalAmount: 100000,
          roomName: this.room.name,
        })
        if (result !== OK)
          console.log(`创建能量订单出错，房间 ${this.room.name}`)
        console.log(colorfyLog(`[普通] 房间 ${this.room.name} 创建 energy 订单，价格: ${price + 0.001}，数量: 100000`, 'green', true))
      }
    }
    // 能量极少的情况下，下市场合理范围内最高价格订单
    else if (storeNum < 100000) {
      const ave = getAveragePrice('energy', 2)
      const highest = getHighestPrice('energy', 'buy', ave + 6)
      if (!haveMarketOrder(this.room.name, 'energy', 'buy', highest, -0.1)) {
        const result = Game.market.createOrder({
          type: ORDER_BUY,
          resourceType: 'energy',
          price: highest + 0.001,
          totalAmount: 200000,
          roomName: this.room.name,
        })
        if (result !== OK)
          console.log(`创建能量订单出错，房间 ${this.room.name}`)
        console.log(colorfyLog(`[紧急] 房间 ${this.room.name} 创建 energy 订单，价格:${highest + 0.01}，数量: 100000`, 'green', true))
      }
    }

    // 仓库资源过于饱和就卖掉能量 超出则不卖(考虑到pc技能间隔)
    if (storage.store.getFreeCapacity() < 50000 && storage.store.getCapacity() >= storage.store.getUsedCapacity()) {
      // 如果仓库饱和(小于200k空间)，而且仓库能量超过400K,就卖能量
      if (storage.store.getUsedCapacity('energy') > 350000) {
        if (!this.room.memory.market)
          this.room.memory.market = {}
        if (!this.room.memory.market.deal)
          this.room.memory.market.deal = []

        if (!this.room.memory.market.deal.some(od => od.rType === 'energy')) {
          // 下达自动 deal 的任务
          this.room.memory.market.deal.push({ rType: 'energy', num: 100000 })
        }
      }
    }

    // 其他类型资源的交易 【考虑到已经有了资源调度模块的存在，这里主要是卖】
    for (const t in this.room.memory.market) {
      let stopProcessing = false
      // deal 类型
      if (t === 'deal') {
        // terminal 空闲资源过少便不会继续
        if (this.store.getUsedCapacity('energy') < 50000)
          continue
        for (const i of this.room.memory.market.deal) {
          if (i.rType !== 'energy')
            this.room.memory.TerminalData[i.rType] = { num: i.unit ? i.unit : 5000, fill: true }
          const rType = i.rType as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY

          // 数量少了就删除
          if (i.num <= 0) {
            if (rType !== 'energy')
              delete this.room.memory.TerminalData[rType]
            const index = this.room.memory.market.deal.indexOf(i)
            this.room.memory.market.deal.splice(index, 1)
            continue
          }

          // 冷却模式下进行不了其他 deal 了
          if (this.cooldown)
            break

          let least = 100
          if (COMMODITIES[rType]?.level)
            least = 0

          const price = i.price ?? 0.05

          const orders = Game.market.getAllOrders({ resourceType: rType })
            .filter(order => order.type === ORDER_BUY && order.price >= price && order.amount > least)
          if (orders.length <= 0)
            continue

          // 按价格从低到高排列
          orders.sort(sortByKey('price'))

          // 倒数第二 没有就倒数第一
          const thisDealOrder = orders.length >= 2 ? orders[orders.length - 2] : orders[orders.length - 1]
          if (!thisDealOrder)
            continue

          if (storage.store.getUsedCapacity(rType) <= 0 && this.room.countCreepMissionByName('manage', '物流运输') <= 0) {
            if (rType !== 'energy')
              delete this.room.memory.TerminalData[rType]
            const index = this.room.memory.market.deal.indexOf(i)
            this.room.memory.market.deal.splice(index, 1)
            continue
          }

          if (thisDealOrder.amount >= this.store.getUsedCapacity(rType)) {
            if (i.num > this.store.getUsedCapacity(i.rType)) {
              Game.market.deal(thisDealOrder.id, this.store.getUsedCapacity(rType), this.room.name)
              i.num -= this.store.getUsedCapacity(rType)
            }
            else {
              Game.market.deal(thisDealOrder.id, i.num, this.room.name)
              i.num = 0
            }
            stopProcessing = true
            break
          }
          else {
            if (i.num > thisDealOrder.amount) {
              Game.market.deal(thisDealOrder.id, thisDealOrder.amount, this.room.name)
              i.num -= thisDealOrder.amount
            }
            else {
              Game.market.deal(thisDealOrder.id, i.num, this.room.name)
              i.num = 0
            }
            stopProcessing = true
            break
          }
        }
        if (stopProcessing)
          break
      }
      // order 类型
      else if (t === 'order') {
        for (const l of this.room.memory.market.order) {
          if (l.rType !== 'energy')
            this.room.memory.TerminalData[l.rType] = { num: l.unit || 5000, fill: true }

          // 查询有无订单
          if (!l.id) {
            const myOrder = haveMarketOrder(this.room.name, l.rType, 'sell')
            if (!myOrder) {
              if (!l.price)
                continue

              // 没有就创建订单
              console.log(colorfyLog(`[market] 房间 ${this.room.name} -rType: ${l.rType} 创建订单!`, 'yellow'))
              const result = Game.market.createOrder({
                type: ORDER_SELL,
                resourceType: l.rType,
                price: l.price,
                totalAmount: l.num,
                roomName: this.room.name,
              })
              if (result !== OK)
                continue
            }

            for (const o in Game.market.orders) {
              const order = Game.market.getOrderById(o)
              if (order!.remainingAmount <= 0) {
                Game.market.cancelOrder(o)
                continue
              }
              if (order!.roomName === this.room.name && order!.resourceType === l.rType && order!.type === 'sell')
                l.id = o
            }

            continue
          }
          else {
            const order = Game.market.getOrderById(l.id)
            // 取消订单信息
            if (!order || !order.remainingAmount) {
              if (l.rType !== 'energy')
                delete this.room.memory.TerminalData[l.rType]
              console.log(colorfyLog(`[market] 房间 ${this.room.name} 订单ID: ${l.id}, rType: ${l.rType} 的删除订单!`, 'blue'))
              const index = this.room.memory.market.order.indexOf(l)
              this.room.memory.market.order.splice(index, 1)
              continue
            }

            // 价格
            if (l.price) {
              const price = order.price
              const standprice = l.price
              // 价格太低或太高都会改变订单价格
              if (standprice <= price / 3 || standprice >= price * 3) {
                Game.market.changeOrderPrice(l.id, l.price)
                console.log(`[market] 房间 ${this.room.name} 改变订单ID: ${l.id}, type: ${l.rType} 的价格为 ${l.price}`)
              }
              // 收到改变价格指令，也会改变订单价格
              if (l.changePrice) {
                Game.market.changeOrderPrice(l.id, l.price)
                console.log(`[market] 房间 ${this.room.name} 改变订单ID: ${l.id}, type: ${l.rType} 的价格为 ${l.price}`)
                l.changePrice = false
              }
            }
          }
        }
      }
    }
  }

  /**
   * 资源传送
   */
  public processResourceSendMission(task: MissionModel): void {
    if (this.cooldown && this.cooldown > 0)
      return

    // 任务数据有问题
    if (!task.data?.disRoom) {
      this.room.removeMission(task.id)
      return
    }

    // 1状态下，搜集资源
    if (!task.state)
      task.state = 1

    if (task.state === 1) {
      // 每 10 tick 监测一次
      if (Game.time % 10)
        return

      if (!task.data.num || task.data.num <= 0)
        this.room.removeMission(task.id)

      // manage 爬虫有任务时就不管
      if (this.room.countCreepMissionByName('manage', '物流运输') > 0)
        return

      // 路费
      const wastage = Game.market.calcTransactionCost(task.data.num, this.room.name, task.data.disRoom)

      // 如果非能量资源且路费不够，发布资源搬运任务，优先寻找 storage
      const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null

      // terminal 的剩余资源
      const remain = this.store.getFreeCapacity()

      // 路费判断
      if (wastage > (this.store.energy || 0)) {
        // 只有在能量富裕的情况下才会允许进入下一阶段
        if (storage
         && (storage.store.energy || 0) + (this.store.energy || 0) - 5000 > wastage
         && remain > wastage - (this.store.energy || 0)) {
          // 下布搬运任务
          const thisTask = this.room.generateCarryMission(
            { manage: { num: 1, bind: [] } },
            40,
            this.room.name, storage.pos.x, storage.pos.y,
            this.room.name, this.pos.x, this.pos.y,
            'energy', wastage - this.store.energy || 0)
          this.room.addMission(thisTask)
          return
        }
        // 条件不满足就自动删除任务
        this.room.removeMission(task.id)
        return
      }

      const rType = task.data.rType as ResourceConstant

      console.log(`资源传送任务监控中: ###########################\n 房间: ${this.room.name} ---> ${task.data.disRoom} 运送资源：${rType}`)
      console.log(`路费:${colorfyLog(`${wastage}`, 'yellow')}energy  终端拥有能量: ${colorfyLog(`${this.store.energy || 0}`, 'yellow')}energy`)

      // 资源判断
      const cargoNum = rType === 'energy' ? this.store.getUsedCapacity(rType)! - wastage : this.store.getUsedCapacity(rType)!
      console.log(`终端拥有资源量: ${colorfyLog(`${cargoNum}`, 'blue')}，仓库拥有资源量: ${storage?.store.getUsedCapacity(rType)}，任务所需资源量: ${task.data.num}`)

      if (task.data.num > cargoNum) {
        if (storage
         && (storage.store[rType] || 0) + (this.store[rType] || 0) >= (task.data.num - 1600)
         && remain > task.data.num - cargoNum) {
          // 下布搬运任务
          const thisTask = this.room.generateCarryMission(
            { manage: { num: 1, bind: [] } },
            40,
            this.room.name, storage.pos.x, storage.pos.y,
            this.room.name, this.pos.x, this.pos.y,
            rType, task.data.num - cargoNum)
          this.room.addMission(thisTask)
          return
        }

        // 条件不满足就自动删除任务
        this.room.removeMission(task.id)
        return
      }

      // 都满足条件了就进入状态2
      task.state = 2
    }
    else if (task.state === 2) {
      const result = this.send(task.data.rType as ResourceConstant, task.data.num, task.data.disRoom as string)
      // 能量不够就重新返回状态1
      if (result === -6) {
        console.log(colorfyLog(`房间 ${this.room.name} 发送资源 ${task.data.rType} 失败!`, 'read', true))
        task.state = 1
      }
      else if (result === OK) {
        // 如果传送成功，就删除任务
        this.room.removeMission(task.id)
      }
    }
  }

  /**
     * 资源购买 (deal)
     */
  public processResourceDealMission(task: MissionModel): void {
    if ((Game.time - global.Gtime[this.room.name]) % 10)
      return
    if (this.cooldown || this.store.getUsedCapacity('energy') < 45000)
      return

    if (!task.data) {
      this.room.removeMission(task.id)
      return
    }

    const money = Game.market.credits
    if (money <= 0 || task.data.num > 50000) {
      this.room.removeMission(task.id)
      return
    }

    const rType = task.data.rType as ResourceConstant
    const num = task.data.num

    const historyList = Game.market.getHistory(rType)
    const historyLength = historyList.length
    // 以防特殊情况
    if (historyList.length < 3) {
      console.log(`资源 ${rType} 的订单太少，无法购买!`)
      return
    }

    let allNum = 0
    for (let i = historyLength - 3; i < historyLength; i++)
      allNum += historyList[i].avgPrice
    // 平均价格 [近3天]
    const avePrice = allNum / 3

    // 获取该资源的平均价格
    const maxPrice = avePrice + (task.data.range || 50) // 范围

    // 在市场上寻找
    const orders = Game.market.getAllOrders({ resourceType: rType })
      .filter(o => o.price >= avePrice && o.price <= maxPrice)
    if (orders.length <= 0)
      return

    // 寻找价格最低的
    orders.sort(sortByKey('price'))
    const lowest = orders[0]

    if (lowest.price > maxPrice)
      return

    if (lowest.amount >= num) {
      if (Game.market.deal(lowest.id, num, this.room.name) === OK)
        this.room.removeMission(task.id)
    }
    else {
      if (Game.market.deal(lowest.id, lowest.amount, this.room.name) === OK)
        task.data.num -= lowest.amount
    }
  }
}
