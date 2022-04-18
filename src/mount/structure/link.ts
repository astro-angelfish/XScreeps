import { isInArray, sortByKey } from '@/utils'

export default class linkExtension extends StructureLink {
  public manageMission(): void {
    if (!this.room.memory.mission.Structure)
      this.room.memory.mission.Structure = []
    const allmyTask = []
    for (const task of this.room.memory.mission.Structure) {
      if (!task.structure)
        continue
      if (isInArray(task.structure, this.id))
        allmyTask.push(task)
    }
    /* 按照优先级排序 */
    if (allmyTask.length <= 0)
      return
    else if (allmyTask.length >= 1)
      allmyTask.sort(sortByKey('level'))
    /* 处理任务 */
    const thisTask = allmyTask[0]
    if (thisTask.delayTick < 99995)
      thisTask.delayTick--
    switch (thisTask.name) {
      case '链传送能':{ this.Handle_Link(thisTask); break }
    }
  }

  /* 链传送能 */
  public Handle_Link(task: MissionModel): void {
    if (this.cooldown && this.cooldown > 0)
      return
    /* 执行任务 */
    if (!task.data || !task.data.disStructure)
      this.room.removeMission(task.id)

    if (this.store.getUsedCapacity('energy') < 700) {
      /* 如果有传送任务但是没有足够能量，只要是centerlink就下达搬运任务 */
      if (this.room.memory.structureIdData.centerLink == this.id) {
        const storage = global.structureCache[this.room.name].storage as StructureStorage
        if (!storage)
          return
        if (!this.room.carryMissionExist('manage', storage.pos, this.pos, 'energy')) {
          const thisTask = this.room.generateCarryMission({ manage: { num: 1, bind: [] } }, 20, this.room.name, storage.pos.x, storage.pos.y, this.room.name, this.pos.x, this.pos.y, 'energy', this.store.getFreeCapacity())
          this.room.addMission(thisTask)
        }
      }
      return
    }
    const dis = Game.getObjectById(task.data.disStructure) as StructureLink
    if (!dis || dis.store.getUsedCapacity('energy') >= 790) {
      /* 如果未找到link 或者 对方link满了，就删除任务 */
      this.room.removeMission(task.id)
      return
    }
    /* 传完就删除任务 */
    this.transferEnergy(dis)
    this.room.removeMission(task.id)
  }
}
