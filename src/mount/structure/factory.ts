import { canResourceDispatch, identifyDispatch } from '@/module/dispatch/resource'

export class factoryExtension extends StructureFactory {
  public manageMission(): void {
    if (this.room.memory.toggles.StopFactory)
      return
    this.processResourceMemory()
    this.processResourceBalance()
    this.processFactoryProduce()
  }

  // 资源平衡
  public processResourceBalance(): void {
    if ((Game.time - global.Gtime[this.room.name]) % 7)
      return

    const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
    const terminal = this.room.memory.structureIdData?.terminalID ? Game.getObjectById(this.room.memory.structureIdData.terminalID) : null
    if (!storage || !terminal)
      return

    if (!this.room.memory.productData || !this.room.memory.productData.balanceData)
      return

    const anytype = new Set([...Object.keys(this.store), ...Object.keys(this.room.memory.productData.balanceData)])

    // 把所有资源遍历一遍
    for (const rType_ of anytype) {
      // 找到 manage 爬虫
      if (this.room.countCreepMissionByName('manage', '物流运输') > 0)
        return

      const rType = rType_ as CommodityConstant | MineralConstant | 'energy' | 'G'
      const balanceData = this.room.memory.productData.balanceData[rType]

      // 数量
      const num = this.store[rType] || 0

      // 搬走资源
      if (!balanceData?.num) {
        if (storage.store.getFreeCapacity() < 10000)
          continue

        const thisTask = this.room.generateCarryMission(
          { manage: { num: 1, bind: [] } },
          10,
          this.room.name, this.pos.x, this.pos.y,
          this.room.name, storage.pos.x, storage.pos.y,
          rType, num)
        this.room.addMission(thisTask)
        continue
      }

      else {
        if (num > balanceData.num) {
          if (storage.store.getFreeCapacity() < 10000)
            continue

          const thisTask = this.room.generateCarryMission(
            { manage: { num: 1, bind: [] } },
            10,
            this.room.name, this.pos.x, this.pos.y,
            this.room.name, storage.pos.x, storage.pos.y,
            rType, num - balanceData.num)
          this.room.addMission(thisTask)
        }

        // 少了就搬进
        else if (num < balanceData.num && balanceData.fill) {
          if (this.store.getFreeCapacity() < 2000)
            continue

          // 能量特殊
          if (rType === 'energy') {
            // 相差太少就不搬了
            if (balanceData.num - num > 50 && balanceData.num - num < 1000)
              continue

            if (storage.store.energy > 20000) {
              const thisTask = this.room.generateCarryMission(
                { manage: { num: 1, bind: [] } },
                10,
                this.room.name, storage.pos.x, storage.pos.y,
                this.room.name, this.pos.x, this.pos.y,
                rType, Math.abs(balanceData.num - num))
              this.room.addMission(thisTask)
            }

            continue
          }

          else if (['U', 'L', 'K', 'H', 'O', 'Z', 'X'].includes(rType)) {
            if (storage.store[rType] >= balanceData.num - num) {
              const thisTask = this.room.generateCarryMission(
                { manage: { num: 1, bind: [] } },
                10,
                this.room.name, storage.pos.x, storage.pos.y,
                this.room.name, this.pos.x, this.pos.y,
                rType, Math.abs(balanceData.num - num))
              this.room.addMission(thisTask)
              continue
            }
            // 搬运
            if (!storage.store[rType])
              continue
          }
          else {
            if ((storage.store[rType] || 0) <= balanceData.num - num) {
              if (!storage.store[rType])
                continue

              // 搬运
              const thisTask = this.room.generateCarryMission(
                { manage: { num: 1, bind: [] } },
                10,
                this.room.name, storage.pos.x, storage.pos.y,
                this.room.name, this.pos.x, this.pos.y,
                rType, storage.store[rType])
              this.room.addMission(thisTask)
              continue
            }
            else {
              // 搬运
              const thisTask = this.room.generateCarryMission(
                { manage: { num: 1, bind: [] } },
                10,
                this.room.name, storage.pos.x, storage.pos.y,
                this.room.name, this.pos.x, this.pos.y,
                rType, Math.abs(balanceData.num - num))
              this.room.addMission(thisTask)
              continue
            }
          }
        }
      }
    }
  }

  // 资源平衡记忆更新
  public processResourceMemory(): void {
    // factory 自身资源管理
    const factoryData = this.room.memory.productData.balanceData
    for (const rType_ in factoryData) {
      const rType = rType_ as CommodityConstant | MineralConstant | 'energy' | 'G'
      // 数量小于0就删除数据，节省 memory
      if (!factoryData[rType]!.num || factoryData[rType]!.num! <= 0) {
        console.log(`[factory] 房间 ${this.room.name} 删除 balanceData 数据 ${rType}`)
        delete factoryData[rType]
      }
    }

    // factory 自身等级管理
    if (this.level) {
      if (this.level !== this.room.memory.productData.level)
        this.room.memory.productData.level = this.level
    }
    else {
      this.room.memory.productData.level = 0
    }
  }

  // 工厂生产
  public processFactoryProduce(): void {
    if ((Game.time - global.Gtime[this.room.name]) % 5)
      return
    if (this.cooldown)
      return

    if (!this.room.memory.productData.state)
      this.room.memory.productData.state = 'sleep'

    const state = this.room.memory.productData.state

    const storage = this.room.memory.structureIdData?.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
    const terminal = this.room.memory.structureIdData?.terminalID ? Game.getObjectById(this.room.memory.structureIdData.terminalID) : null
    if (!storage || !terminal)
      return

    if (state === 'sleep') {
      this.room.memory.productData.balanceData = {}
      if ((Game.time - global.Gtime[this.room.name]) % 45)
        return
      delete this.room.memory.productData.producing

      const disCom = this.room.memory.productData.flowCom
      // 检测是否可以直接生产商品 是否可以资源调度
      if (disCom) {
        // 初始化numList数据
        const numList: Record<string, number> = {}
        let flow = true
        // 判断合成资源是否足够
        for (const rType_ in COMMODITIES[disCom].components) {
          const rType = rType_ as CommodityConstant | MineralConstant | 'energy' | 'G' | DepositConstant

          numList[rType] = storage.store.getUsedCapacity(rType)

          if ((COMMODITIES[disCom].level || 0) >= 4) {
            // 如果仓库内的底物少于规定量
            if (numList[rType] < COMMODITIES[disCom].components[rType] * 5) {
              flow = false
              // 判断一下能否调度 不能调度直接跳转到 baseList 相关合成判断
              const identify = canResourceDispatch(this.room, rType, COMMODITIES[disCom].components[rType] * 5)
              if (identify === 'can') {
                console.log(`[dispatch]<factory> 房间 ${this.room.name} 将进行资源为 ${rType} 的资源调度!`)
                const dispatchTask: RDData = {
                  sourceRoom: this.room.name,
                  rType: rType as ResourceConstant,
                  num: COMMODITIES[disCom].components[rType] * 5,
                  delayTick: 200,
                  conditionTick: 35,
                  buy: false,
                }
                Memory.resourceDispatchData.push(dispatchTask)
              }
              else if (identify === 'running') {
                return
              }
              else {
                break
              }
            }
            else {
              continue
            }
          }
          else {
            if (numList[rType] < COMMODITIES[disCom].components[rType] * 10) {
              flow = false
              const identify = canResourceDispatch(this.room, rType, COMMODITIES[disCom].components[rType] * 10)
              if (identify === 'can') {
                console.log(`[dispatch]<factory> 房间 ${this.room.name} 将进行资源为 ${rType} 的资源调度!`)
                const dispatchTask: RDData = {
                  sourceRoom: this.room.name,
                  rType: rType as ResourceConstant,
                  num: COMMODITIES[disCom].components[rType] * 10,
                  delayTick: 200,
                  conditionTick: 35,
                  buy: false,
                }
                Memory.resourceDispatchData.push(dispatchTask)
              }
              else if (identify === 'running') {
                return
              }
              else {
                break
              }
            }
            else {
              continue
            }
          }
        }
        if (flow) {
          console.log(`[factory] 房间 ${this.room.name} 转入 flow 生产模式，目标商品为 ${disCom}`)
          this.room.memory.productData.state = 'flow'
          this.room.memory.productData.producing = { com: disCom }
          return
        }
      }

      // 如果没有流水线商品或者商品不够生产流水线商品 就生产基本商品
      if (Object.keys(this.room.memory.productData.baseList).length <= 0)
        return

      const baseList = this.room.memory.productData.baseList
      const zip: CommodityConstant[] = [] // 压缩商品 bar
      const low: CommodityConstant[] = [] // 低级商品 Wire Cell Alloy Condensate
      const high: CommodityConstant[] = [] // 高等商品 Composite Crystal Liquid
      const zipList = ['utrium_bar', 'lemergium_bar', 'keanium_bar', 'zynthium_bar', 'ghodium_melt', 'oxidant', 'reductant', 'purifier', 'battery']
      for (const baseProduction in baseList) {
        if (zipList.includes(baseProduction))
          zip.push(baseProduction as CommodityConstant)
        else if (['wire', 'cell', 'alloy', 'condensate'].includes(baseProduction))
          low.push(baseProduction as CommodityConstant)
        else if (['composite', 'crystal', 'liquid'].includes(baseProduction))
          high.push(baseProduction as CommodityConstant)
      }

      // 检测基础商品是否满足
      for (const b of zip) {
        if (storage.store.getUsedCapacity(b) < baseList[b]!.num - 3000) {
          console.log(`[factory] 房间 ${this.room.name} 转入 base 生产模式，目标商品为 ${b}`)
          this.room.memory.productData.state = 'base'
          this.room.memory.productData.producing = { com: b, num: baseList[b]!.num }
          return
        }
      }

      // 检测低级商品是否满足
      for (const l_ of low) {
        const l = l_ as CommodityConstant

        if ((storage.store[l] || 0) < baseList[l]!.num - 300) {
          // 测试用
          if (this.owner.username === 'ExtraDim') {
            const minList = ['energy', 'L', 'O', 'H', 'U', 'K', 'Z', 'X', 'G']
            // 判断一下是否有足够子资源
            if ((Object.keys(COMMODITIES[l].components) as (CommodityConstant | MineralConstant | 'energy' | 'G' | DepositConstant)[])
              .some(r => !minList.includes(r)
                && (storage.store[r] || 0) < COMMODITIES[l].components[r]
                && canResourceDispatch(this.room, r, COMMODITIES[l].components[r] * 100) === 'no'))
              continue
          }

          console.log(`[factory] 房间 ${this.room.name} 转入 base 生产模式，目标商品为 ${l}`)
          this.room.memory.productData.state = 'base'
          this.room.memory.productData.producing = { com: l, num: baseList[l]!.num }
          return
        }
      }

      // 检测高级商品是否满足
      for (const h of high) {
        if ((storage.store[h] || 0) < baseList[h]!.num - 300) {
          console.log(`[factory] 房间 ${this.room.name} 转入 base 生产模式，目标商品为 ${h}`)
          this.room.memory.productData.state = 'base'
          this.room.memory.productData.producing = { com: h, num: baseList[h]!.num }
          return
        }
      }
    }

    // 生产基础商品
    else if (state === 'base') {
      if (!this.room.memory.productData.producing) {
        this.room.memory.productData.state = 'sleep'
        return
      }
      const disCom = this.room.memory.productData.producing.com

      const minList = ['energy', 'L', 'O', 'H', 'U', 'K', 'Z', 'X', 'G']
      // 挂载资源平衡数据
      // 判定所需数量是否足够
      for (const rType_ in COMMODITIES[disCom].components) {
        const rType = rType_ as CommodityConstant | MineralConstant | 'energy' | 'G'

        if (minList.includes(rType)) {
          this.room.memory.productData.balanceData[rType] = { num: 5000, fill: true }

          if ((storage.store[rType] || 0) < 10000) {
            // 资源调度
            if (identifyDispatch(this.room, rType, 10000, 1, 'deal')) {
              console.log(`[dispatch] 房间 ${this.room.name} 将进行资源为 ${rType} 的资源调度!`)
              const dispatchTask: RDData = {
                sourceRoom: this.room.name,
                rType,
                num: 10000,
                delayTick: 200,
                conditionTick: 35,
                buy: true,
                mtype: 'deal',
              }
              Memory.resourceDispatchData.push(dispatchTask)
            }
            break
          }
        }

        // 其他资源的话，看看能不能调度
        else {
          this.room.memory.productData.balanceData[rType] = { num: COMMODITIES[disCom].components[rType] * 10, fill: true }
          if (this.room.countCreepMissionByName('manage', '物流运输') <= 0) {
            if ((this.store[rType] || 0) + (storage.store[rType] || 0) < COMMODITIES[disCom].components[rType]) {
              const identify = canResourceDispatch(this.room, rType, COMMODITIES[disCom].components[rType] * 100)
              if (identify === 'can') {
                console.log(`[dispatch]<factory> 房间 ${this.room.name} 将进行资源为 ${rType} 的资源调度!`)
                const dispatchTask: RDData = {
                  sourceRoom: this.room.name,
                  rType: rType as ResourceConstant,
                  num: COMMODITIES[disCom].components[rType] * 100,
                  delayTick: 200,
                  conditionTick: 35,
                  buy: false,
                }
                Memory.resourceDispatchData.push(dispatchTask)
              }
              else if (identify === 'running') {
                break
              }
              else {
                console.log(`[资源调度]<factory> 商品 ${rType} 无法调度，工厂状态切换为 sleep!`)
                this.room.memory.productData.state = 'sleep'
                return
              }
            }
          }
        }
      }

      // 合成
      const result = this.produce(disCom)
      if (result === OK) {
        if (this.room.memory.productData.producing.num)
          this.room.memory.productData.producing.num -= COMMODITIES[disCom].amount
      }
      else if (result === ERR_BUSY) {
        if (Game.powerCreeps[`${this.room.name}/queen/${Game.shard.name}`])
          this.room.checkPcEnhanceFactory()
        else console.log(`[factory] 房间 ${this.room.name} 出现工厂等级错误，不能生产 ${disCom}`)
      }

      if ((this.room.memory.productData.producing.num || 0) <= 0)
        this.room.memory.productData.state = 'sleep'
    }

    // 生产流水线商品
    else if (state === 'flow') {
      if (!this.room.memory.productData.producing) {
        this.room.memory.productData.state = 'sleep'
        return
      }

      const disCom = this.room.memory.productData.producing.com
      // 调度相关资源
      for (const rType_ in COMMODITIES[disCom].components) {
        const rType = rType_ as CommodityConstant | MineralConstant | 'energy' | 'G'

        if ((COMMODITIES[disCom].level || 0) < 4) {
          if (rType === RESOURCE_ENERGY)
            this.room.memory.productData.balanceData[rType] = { num: 5000, fill: true }
          else
            this.room.memory.productData.balanceData[rType] = { num: COMMODITIES[disCom].components[rType] * 4, fill: true }

          if (this.room.countCreepMissionByName('manage', '物流运输') > 0)
            break

          if ((this.store[rType] || 0) + (storage.store[rType] || 0) < COMMODITIES[disCom].components[rType]) {
            console.log(`[factory] 房间 ${this.room.name} 转入 sleep 生产模式`)
            this.room.memory.productData.state = 'sleep'
            return
          }
        }

        else {
          if (rType === RESOURCE_ENERGY)
            this.room.memory.productData.balanceData[rType] = { num: 5000, fill: true }
          else
            this.room.memory.productData.balanceData[rType] = { num: COMMODITIES[disCom].components[rType], fill: true }

          if (this.room.countCreepMissionByName('manage', '物流运输') > 0)
            break

          if ((this.store[rType] || 0) + (storage.store[rType] || 0) < COMMODITIES[disCom].components[rType]) {
            console.log(`[factory] 房间 ${this.room.name} 转入 sleep 生产模式`)
            this.room.memory.productData.state = 'sleep'
            return
          }
        }
      }

      // 合成
      const result = this.produce(disCom)
      if (result === 0) {
        if (this.room.memory.productData.producing.num)
          this.room.memory.productData.producing.num -= COMMODITIES[disCom].amount
      }
      else if (result === ERR_BUSY) {
        if (Game.powerCreeps[`${this.room.name}/queen/${Game.shard.name}`])
          this.room.checkPcEnhanceFactory()
        else console.log(`[factory] 房间 ${this.room.name} 出现工厂等级错误，不能生产 ${disCom}`)
      }
    }
  }

  // 添加合成
  public add(res: CommodityConstant, num: number): string {
    if (!Object.keys(COMMODITIES).includes(res) || num <= 0 || !num)
      return '[factory] 错误参数'

    this.room.memory.productData.baseList[res] = { num }

    return `[factory] 房间 ${this.room.name} 成功添加基础资源 ${res}; 目前基础资源列表如下:\n${Object.entries(this.room.memory.productData.baseList).map(([k, v]) => `${k}: ${v.num}`).join(',')}`
  }

  // 删除合成
  public remove(res: CommodityConstant): string {
    delete this.room.memory.productData.baseList[res]

    return `[factory] 房间 ${this.room.name} 成功删除基础资源 ${res}; 目前基础资源列表如下:\n${Object.entries(this.room.memory.productData.baseList).map(([k, v]) => `${k}: ${v.num}`).join(',')}`
  }

  // 设置生产线资源
  public set(res: CommodityConstant): string {
    this.room.memory.productData.flowCom = res

    return `[factory] 房间 ${this.room.name} 的流水线资源设置为 ${res}!`
  }

  // 删除生产线资源
  public del(res: CommodityConstant): string {
    delete this.room.memory.productData.flowCom

    return `[factory] 房间 ${this.room.name} 的流水线资源已删除!`
  }

  /**
   * 更新工厂等级
   */
  public enhanceFactory(): string {
    if (!Game.powerCreeps[`${this.room.name}/queen/${Game.shard.name}`])
      return `${this.room.name} 此房间无pc请先孵化pc`

    this.room.checkPcEnhanceFactory()

    return '发布pc确定工厂等级任务成功'
  }
}
