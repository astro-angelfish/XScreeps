import { sortByKey } from '@/utils'

// TODO 写严格一点，加个并任务
export default class linkExtension extends StructureLink {
  public manageMission(): void {
    if (!this.room.memory.mission.Structure)
      this.room.memory.mission.Structure = []

    const tasks = this.room.memory.mission.Structure
      .filter(mission => mission.structure?.includes(this.id))
    if (tasks.length <= 0)
      return

    // 按照优先级排序
    tasks.sort(sortByKey('level'))

    // 处理任务
    const thisTask = tasks[0]

    if (thisTask.delayTick < 99995)
      thisTask.delayTick--

    switch (thisTask.name) {
      case '链传送能': { this.processLinkMission(thisTask); break }
    }
  }

  /* 链传送能 */
  public processLinkMission(task: MissionModel): void {
    if (this.cooldown && this.cooldown > 0)
      return

    // 执行任务
    if (!task.data || !task.data.disStructure)
      this.room.removeMission(task.id)

    // 如果有传送任务但是没有足够能量，只要是 centerLink 就下达搬运任务
    if (this.store.getUsedCapacity('energy') < 700) {
      if (this.room.memory.structureIdData?.centerLink === this.id) {
        const storage = this.room.memory.structureIdData.storageID ? Game.getObjectById(this.room.memory.structureIdData.storageID) : null
        if (!storage)
          return

        if (!this.room.carryMissionExist('manage', storage.pos, this.pos, 'energy')) {
          const thisTask = this.room.generateCarryMission(
            { manage: { num: 1, bind: [] } },
            20,
            this.room.name, storage.pos.x, storage.pos.y,
            this.room.name, this.pos.x, this.pos.y,
            'energy', this.store.getFreeCapacity()!)
          this.room.addMission(thisTask)
        }
      }
      return
    }

    const dis = Game.getObjectById(task.data.disStructure as Id<StructureLink>)
    // 如果未找到 link 或者 对方 link 满了，就删除任务
    if (!dis || dis.store.getUsedCapacity('energy') >= 790) {
      this.room.removeMission(task.id)
      return
    }

    // 传完就删除任务
    this.transferEnergy(dis)
    this.room.removeMission(task.id)
  }
}
