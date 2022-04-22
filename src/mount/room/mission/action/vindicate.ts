import { getAveragePrice, getHighestPrice, haveMarketOrder } from '@/module/fun/funtion'
import { colorfyLog } from '@/utils'

/* 房间原型拓展   --行为  --维护任务 */
export default class RoomMissionVindicateExtension extends Room {
  public verifyRepairMission(mission: MissionModel): void {
    // 根据 level 决定任务爬虫体型
    const level = mission.data.level
    if (!level)
      mission.data.level = 'T0'
    if (level === 'T2') {
      global.MSB[mission.id] = { repair: { work: 6, carry: 4, move: 10 } }
    }
    else if (level === 'T1') {
      global.MSB[mission.id] = { repair: { work: 10, carry: 10, move: 10 } }
    }
    else if (level === 'T0') {
      // 默认配置
    }

    if ((Game.time - global.Gtime[this.name]) % 8)
      return

    if (mission.labBind)
      this.checkLab(mission, 'transport', 'complex')
  }

  /**
   * 急速冲级
   */
  public verifyQuickUpgradeMission(mission: MissionModel): void {
    if (!this.controller)
      return
    if (this.controller.level >= 8) {
      this.removeMission(mission.id)
      console.log(`房间${this.name}等级已到8级，删除任务!`)
      return
    }

    if (!this.memory.structureIdData?.terminalID)
      return

    // 能量购买
    const terminal = Game.getObjectById(this.memory.structureIdData.terminalID)
    if (!terminal)
      return

    // 如果 terminal 附近已经充满了爬虫，则 standed 为 false
    const creeps = terminal.pos.findInRange(FIND_MY_CREEPS, 1)
    mission.data.standed = !(creeps.length >= 8)

    if (!this.checkLab(mission, 'transport', 'complex'))
      return

    if (Game.time % 40)
      return

    if (terminal.store.getUsedCapacity('energy') < 100000 && Game.market.credits >= 1000000) {
      const ave = getAveragePrice('energy', 2)
      const highest = getHighestPrice('energy', 'buy', ave + 6)
      if (!haveMarketOrder(this.name, 'energy', 'buy', highest, -0.2)) {
        const result = Game.market.createOrder({
          type: ORDER_BUY,
          resourceType: 'energy',
          price: highest + 0.1,
          totalAmount: 100000,
          roomName: this.name,
        })
        if (result !== OK)
          console.log(`创建能量订单出错，房间 ${this.name}`)
        console.log(colorfyLog(`[急速冲级] 房间 ${this.name} 创建 energy 订单，价格: ${highest + 0.01}，数量: 100000`, 'green', true))
      }
    }
  }

  /**
   * 紧急援建
   */
  public verifyHelpBuildMission(mission: MissionModel): void {
    if (!mission.data.defend)
      global.MSB[mission.id] = { architect: { work: 15, carry: 24, move: 10, heal: 1 } }

    if ((Game.time - global.Gtime[this.name]) % 9)
      return

    if (mission.labBind) {
      // 如果目标 lab 的 t3 少于 1000 发布搬运任务
      this.checkLab(mission, 'transport', 'complex')
    }
  }

  /* 资源转移任务 */
  public verifyResourceTransferMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 50)
      return
    const structureIdData = this.memory.structureIdData
    if (!structureIdData)
      return

    const storage = structureIdData.storageID ? Game.getObjectById(structureIdData.storageID) : null
    const terminal = structureIdData.terminalID ? Game.getObjectById(structureIdData.terminalID) : null
    if (!storage || !terminal) {
      this.removeMission(mission.id)
      return
    }

    // 有传送任务就先不执行
    if (this.countMissionByName('Structure', '资源传送') > 0)
      return

    // 仓库资源太少不执行
    if (storage.store.getUsedCapacity('energy') < 200000)
      return

    // 不限定资源代表除了能量和 ops 之外所有资源都要转移
    if (!mission.data.rType) {
      for (const rType_ in storage.store) {
        const rType = rType_ as ResourceConstant
        if (rType === RESOURCE_ENERGY || rType === RESOURCE_OPS)
          continue

        const missNum = Math.min(storage.store[rType], 50000)
        const sendTask = this.generateSendMission(mission.data.disRoom, rType, missNum)
        if (sendTask && this.addMission(sendTask))
          return
      }
      // 代表已经没有资源了
      this.removeMission(mission.id)
    }
    else {
      const rType = mission.data.rType as ResourceConstant
      const num = mission.data.num as number

      // 数量或存量小于0 就删除任务
      if (num <= 0 || (storage.store[rType] || 0) <= 0) {
        this.removeMission(mission.id)
        return
      }

      let missNum = Math.min(num, 50000)
      if (missNum > storage.store[rType])
        missNum = storage.store[rType]

      const sendTask = this.generateSendMission(mission.data.disRoom, rType, missNum)
      if (sendTask && this.addMission(sendTask))
        mission.data.num -= missNum
    }
  }
}
