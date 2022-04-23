/* 房间原型拓展   --任务  --常规战争 */
export default class RoomMissionNormalWarExtension extends Room {
  /**
   * 拆迁黄球
   */
  public verifyDismantleMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return

    if (mission.data.boost) {
      // 体型
      global.MSB[mission.id] = { dismantle: { work: 40, move: 10 } }
      // boost lab填充检查
      if (!this.checkLab(mission, 'transport', 'complex'))
        return
    }

    // 数量投放
    if (mission.creepBind?.dismantle.num === 0)
      mission.creepBind.dismantle.num = mission.data.num
  }

  /**
   * 一体机
   */
  public verifyAioMission(mission: MissionModel): void {
    if (mission.data.boost) {
      // 体型
      const bodylevel = mission.data.bodylevel
      // 不可以防御6塔的体型，适合清理七级以内新手房
      if (bodylevel === 'T2')
        global.MSB[mission.id] = { aio: { move: 10, ranged_attack: 15, heal: 20, tough: 5 } }
      // 可以防御距离适中的六塔，适合骑墙
      else if (bodylevel === 'T1')
        global.MSB[mission.id] = { aio: { move: 10, ranged_attack: 11, heal: 20, tough: 9 } }
      // 最高防御单位
      else
        global.MSB[mission.id] = { aio: { move: 10, ranged_attack: 6, heal: 23, tough: 11 } }

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

    if (mission.creepBind?.aio.num === 0)
      mission.creepBind.aio.num = mission.data.num
  }

  /**
   * 双人小队
   */
  public verifyDoubleMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 11)
      return

    this.checkLab(mission, 'transport', 'complex')
  }

  /**
   * 四人小队
   */
  public verifySquadMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 7)
      return

    if (!mission.data.squadID) {
      if (!Memory.squadMemory)
        Memory.squadMemory = {}
      const randomStr = Math.random().toString(36).slice(3)
      if (!Memory.squadMemory[`${mission.data.flag}|${randomStr}|${Game.shard.name}`])
        mission.data.squadID = `${mission.data.flag}|${randomStr}|${Game.shard.name}`
    }
    else {
      if (Memory.squadMemory[mission.data.squadID]
       && Object.keys(Memory.squadMemory[mission.data.squadID].creepData).length >= 4)
        delete mission.data.squadID
    }

    this.checkLab(mission, 'transport', 'complex')
  }

  /**
   * 紧急支援
   */
  public verifyHelpDefendMission(mission: MissionModel): void {
    if (mission.data.sType === 'aio' && mission.data.boost)
      global.SpecialBodyData[this.name].saio = { move: 10, ranged_attack: 6, heal: 23, tough: 11 }

    if ((Game.time - global.Gtime[this.name]) % 7)
      return

    if (mission.labBind)
      this.checkLab(mission, 'transport', 'complex')
  }
}
