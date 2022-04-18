/* 房间原型拓展   --任务  --运输工任务 */
export default class RoomMissionTransportExtension extends Room {
  // 虫卵填充任务
  public missionSpawnFeed(): void {
    // 每 10tick 观察一次
    if (Game.time % 10)
      return
    if (!this.memory.structureIdData?.storageID)
      return

    if (this.countCreepMissionByName('transport', '虫卵填充') > 0)
      return

    const centerPos = new RoomPosition(Memory.roomControlData[this.name].center[0], Memory.roomControlData[this.name].center[1], this.name)
    const emptyExtension = centerPos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: structure =>
        (structure.structureType === 'spawn' || structure.structureType === 'extension')
          && structure.store.getFreeCapacity('energy') > 0,
    })

    // 满足条件则触发虫卵填充任务
    if (emptyExtension) {
      this.addMission({
        name: '虫卵填充',
        category: 'Creep',
        delayTick: 50,
        cooldownTick: 4,
        creepBind: { transport: { num: 2, bind: [] } },
        data: {},
      })
    }
  }

  // 防御塔填充任务
  public missionTowerFeed(): void {
    if (Game.shard.name === 'shard3' ? Game.time % 15 : Game.time % 5)
      return

    if (!this.memory.structureIdData?.storageID)
      return
    const storage = Game.getObjectById(this.memory.structureIdData.storageID)
    if (!storage || storage.store.energy < 1000)
      return

    if (!this.memory.structureIdData.AtowerID)
      this.memory.structureIdData.AtowerID = []
    const towerIds = this.memory.structureIdData.AtowerID

    for (const id of towerIds) {
      const tower = Game.getObjectById(id)
      if (!tower) {
        towerIds.splice(towerIds.indexOf(id), 1)
        continue
      }

      // 不需要补
      if (tower.store.energy > 500)
        continue

      // 任务过多或已有任务
      if (this.countCreepMissionByName('transport', '物流运输') > 3
        || this.carryMissionExist('transport', storage.pos, tower.pos, 'energy'))
        continue

      // 下达搬运任务搬运
      const thisTask = this.generateCarryMission(
        { transport: { num: 2, bind: [] } },
        35,
        this.name, storage.pos.x, storage.pos.y,
        this.name, tower.pos.x, tower.pos.y,
        'energy', 1000 - tower.store.getUsedCapacity('energy'))
      this.addMission(thisTask)

      return
    }
  }

  /**
   * 实验室能量填充任务，包含多余物回收
   */
  public missionLabFeed(): void {
    if ((global.Gtime[this.name] - Game.time) % 13)
      return
    if (!this.memory.structureIdData?.storageID)
      return
    const storage = Game.getObjectById(this.memory.structureIdData.storageID)
    if (!storage)
      return

    if (!this.memory.structureIdData.labs || this.memory.structureIdData.labs.length <= 0)
      return

    const missionNum = this.countCreepMissionByName('transport', '物流运输')
    if (missionNum > 3)
      return

    for (const id of this.memory.structureIdData.labs) {
      const thisLab = Game.getObjectById(id)
      if (!thisLab) {
        const index = this.memory.structureIdData.labs.indexOf(id)
        this.memory.structureIdData.labs.splice(index, 1)
        continue
      }

      // 下布搬运命令
      if (thisLab.store.energy <= 800) {
        if (storage.store.getUsedCapacity('energy') >= 2000)
          continue
        if (this.carryMissionExist('transport', storage.pos, thisLab.pos, 'energy'))
          continue

        const thisTask = this.generateCarryMission(
          { transport: { num: 1, bind: [] } },
          25,
          this.name, storage.pos.x, storage.pos.y,
          this.name, thisLab.pos.x, thisLab.pos.y,
          'energy', 2000 - thisLab.store.getUsedCapacity('energy'))
        this.addMission(thisTask)
      }
      // 如果该实验室不在绑定状态却有多余资源
      else if (!this.memory.roomLabBind?.[id] && thisLab.mineralType) {
        const thisTask = this.generateCarryMission(
          { transport: { num: 1, bind: [] } },
          25,
          this.name, thisLab.pos.x, thisLab.pos.y,
          this.name, storage.pos.x, storage.pos.y,
          thisLab.mineralType, thisLab.store.getUsedCapacity(thisLab.mineralType))
        this.addMission(thisTask)
      }
    }
  }

  // 核弹填充任务
  public missionNukerFeed(): void {
    if (Game.time % 103)
      return
    if (this.memory.toggle.StopFillNuker)
      return
    if (!this.memory.structureIdData?.nukerID || !this.memory.structureIdData.storageID)
      return

    const nuker = Game.getObjectById(this.memory.structureIdData.nukerID)
    if (!nuker) {
      delete this.memory.structureIdData.nukerID
      return
    }
    const storage = Game.getObjectById(this.memory.structureIdData.storageID)
    if (!storage) {
      delete this.memory.structureIdData.storageID
      return
    }

    if (this.countCreepMissionByName('transport', '物流运输') >= 1)
      return

    if (nuker.store.G < 5000 && storage.store.G >= 5000) {
      const thisTask = this.generateCarryMission(
        { transport: { num: 1, bind: [] } },
        40,
        this.name, storage.pos.x, storage.pos.y,
        this.name, nuker.pos.x, nuker.pos.y,
        'G', 5000 - nuker.store.getUsedCapacity('G'))
      this.addMission(thisTask)
    }
    else if (nuker.store.energy < 300000 && storage.store.energy > 130000) {
      const thisTask = this.generateCarryMission(
        { transport: { num: 1, bind: [] } },
        40,
        this.name, storage.pos.x, storage.pos.y,
        this.name, nuker.pos.x, nuker.pos.y,
        'energy', 300000 - nuker.store.getUsedCapacity('energy'))
      this.addMission(thisTask)
    }
  }
}
