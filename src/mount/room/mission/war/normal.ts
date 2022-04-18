import { GenerateAbility, generateID } from '@/utils'

/* 房间原型拓展   --任务  --常规战争 */
export default class NormalWarExtension extends Room {
  // 拆迁黄球
  public Task_dismantle(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return
    if (mission.data.boost) {
      // 体型
      global.MSB[mission.id] = { dismantle: GenerateAbility(40, 0, 10, 0, 0, 0, 0, 0) }
      // boost lab填充检查
      if (!this.checkLab(mission, 'transport', 'complex'))
        return
    }
    /* 数量投放 */
    if (mission.creepBind.dismantle.num == 0)
      mission.creepBind.dismantle.num = mission.data.num
  }

  // 一体机
  public Task_aio(mission: MissionModel): void {
    if (mission.data.boost) {
      // 体型
      const bodylevel = mission.data.bodylevel
      if (bodylevel == 'T2') // 不可以防御6塔的体型，适合清理七级以内新手房

        global.MSB[mission.id] = { aio: GenerateAbility(0, 0, 10, 0, 15, 20, 0, 5) }

      else if (bodylevel == 'T1') // 可以防御距离适中的六塔，适合骑墙

        global.MSB[mission.id] = { aio: GenerateAbility(0, 0, 10, 0, 11, 20, 0, 9) }

      else // 最高防御单位

        global.MSB[mission.id] = { aio: GenerateAbility(0, 0, 10, 0, 6, 23, 0, 11) }

      if ((Game.time - global.Gtime[this.name]) % 10)
        return
      // boost lab填充检查
      if (!this.checkLab(mission, 'transport', 'complex'))
        return
    }
    else {
      if ((Game.time - global.Gtime[this.name]) % 10)
        return
    }
    if (mission.creepBind.aio.num == 0)
      mission.creepBind.aio.num = mission.data.num
  }

  // 双人小队
  public Task_double(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 11)
      return
    if (!this.checkLab(mission, 'transport', 'complex'))
      return
  }

  // 四人小队
  public Task_squad(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 7)
      return
    if (!mission.data.squadID) {
      if (!Memory.squadMemory)
        Memory.squadMemory = {}
      for (let i = 1; i < 100; i++) {
        if (!Memory.squadMemory[`${mission.data.flag}${i}|${Game.shard.name}`]) {
          mission.data.squadID = `${mission.data.flag}${i}|${Game.shard.name}`
          break
        }
      }
    }
    else {
      if (Memory.squadMemory[mission.data.squadID] && Object.keys(Memory.squadMemory[mission.data.squadID].creepData).length >= 4)
        delete mission.data.squadID
    }
    if (!this.checkLab(mission, 'transport', 'complex'))
      return
  }

  // 紧急支援
  public Task_HelpDefend(mission: MissionModel): void {
    if (mission.data.sType == 'aio' && mission.data.boost)
      global.SpecialBodyData[this.name].saio = GenerateAbility(0, 0, 10, 0, 6, 23, 0, 11)

    if ((Game.time - global.Gtime[this.name]) % 7)
      return
    if (mission.labBind) {
      if (!this.checkLab(mission, 'transport', 'complex'))
        return
    }
  }
}
