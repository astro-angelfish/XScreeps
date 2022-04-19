import { getAveragePrice, getHighestPrice, haveMarketOrder } from '@/module/fun/funtion'
import { GenerateAbility, colorfyLog, isInArray } from '@/utils'

/* 房间原型拓展   --行为  --维护任务 */
export default class RoomMissionVindicateExtension extends Room {
  public Task_Repair(mission: MissionModel): void {
    /* 根据level决定任务爬虫体型 */
    const level = mission.data.level
    if (!level)
      mission.data.level = 'T0'
    if (level == 'T2') {
      global.MSB[mission.id] = { repair: GenerateAbility(6, 4, 10, 0, 0, 0, 0, 0) }
    }
    else if (level == 'T1') {
      global.MSB[mission.id] = { repair: GenerateAbility(10, 10, 10, 0, 0, 0, 0, 0) }
    }
    else if (level == 'T0') {
      // 默认配置
    }
    if ((Game.time - global.Gtime[this.name]) % 8)
      return
    if (mission.labBind) {
      if (!this.checkLab(mission, 'transport', 'complex'))
        return
    }
  }

  /* 急速冲级 */
  public Task_Quick_upgrade(mission: MissionModel): void {
    if (this.controller.level >= 8) { this.removeMission(mission.id); console.log(`房间${this.name}等级已到8级，删除任务!`); return }
    if (!this.memory.structureIdData.terminalID)
      return
    /* 能量购买 */
    const terminal_ = Game.getObjectById(this.memory.structureIdData.terminalID) as StructureTerminal
    if (!terminal_)
      return
    if (!mission.data.standed)
      mission.data.standed = true
    /* 如果terminal附近已经充满了爬虫，则standed为false */
    const creeps = terminal_.pos.findInRange(FIND_MY_CREEPS, 1)
    if (creeps.length >= 8)
      mission.data.standed = false
    else mission.data.standed = true
    if (!this.checkLab(mission, 'transport', 'complex'))
      return
    if (Game.time % 40)
      return
    if (terminal_.store.getUsedCapacity('energy') < 100000 && Game.market.credits >= 1000000) {
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
        if (result != OK)
          console.log('创建能量订单出错,房间', this.name)
        console.log(colorfyLog(`[急速冲级]房间${this.name}创建energy订单,价格:${highest + 0.01};数量:100000`, 'green', true))
      }
    }
  }

  /* 紧急援建 */
  public Task_HelpBuild(mission: MissionModel): void {
    if (!mission.data.defend)
      global.MSB[mission.id] = { architect: GenerateAbility(15, 24, 10, 0, 0, 1, 0, 0) }

    if ((Game.time - global.Gtime[this.name]) % 9)
      return
    if (mission.labBind) {
      if (!this.checkLab(mission, 'transport', 'complex'))
        return // 如果目标lab的t3少于 1000 发布搬运任务
    }
  }

  /* 资源转移任务 */
  public Task_Resource_transfer(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 50)
      return
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    const terminal_ = global.structureCache[this.name].terminal as StructureTerminal
    if (!storage_ || !terminal_) {
      this.removeMission(mission.id)
      return
    }
    if (this.countMissionByName('Structure', '资源传送') > 0)
      return // 有传送任务就先不执行
    if (storage_.store.getUsedCapacity('energy') < 200000)
      return // 仓库资源太少不执行
    // 不限定资源代表除了能量和ops之外所有资源都要转移
    if (!mission.data.rType) {
      for (const i in storage_.store) {
        if (isInArray(['energy', 'ops'], i))
          continue
        const missNum = (storage_.store[i] >= 50000) ? 50000 : storage_.store[i]
        const sendTask = this.generateSendMission(mission.data.disRoom, i as ResourceConstant, missNum)
        if (this.addMission(sendTask))
          return
      }
      // 代表已经没有资源了
      this.removeMission(mission.id)
    }
    else {
      const rType = mission.data.rType as ResourceConstant
      const num = mission.data.num as number
      if (num <= 0 || storage_.store.getUsedCapacity(rType) <= 0) // 数量或存量小于0 就删除任务
      {
        this.removeMission(mission.id)
        return
      }
      let missNum = (num >= 50000) ? 50000 : num
      if (missNum > storage_.store.getUsedCapacity(rType))
        missNum = storage_.store.getUsedCapacity(rType)
      const sendTask = this.generateSendMission(mission.data.disRoom, rType, missNum)
      if (sendTask && this.addMission(sendTask))
        mission.data.num -= missNum
    }
  }
}
