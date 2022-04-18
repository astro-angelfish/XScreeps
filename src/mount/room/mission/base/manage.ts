import { isInArray } from '@/utils'

/* 房间原型拓展   --任务  --中央运输工任务 */
export default class RoomMissionManageExtension extends Room {
  /* 链接送仓   即中央链接能量转移至仓库 */
  public Task_Clink(): void {
    if ((Game.time - global.Gtime[this.name]) % 15)
      return
    if (!this.memory.structureIdData.centerLink)
      return
    const centerLink = Game.getObjectById(this.memory.structureIdData.centerLink as string) as StructureLink
    if (!centerLink) { delete this.memory.structureIdData.centerLink; return }
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    if (!storage_)
      return
    if (storage_.store.getFreeCapacity() <= 10000)
      return // storage满了就不挂载任务了
    for (const i of this.memory.mission.Structure) {
      if (i.name == '链传送能' && isInArray(i.structure, this.memory.structureIdData.centerLink))
        return
    }
    if (centerLink.store.getUsedCapacity('energy') >= 400 && !this.carryMissionExist('manage', centerLink.pos, storage_.pos, 'energy')) {
      const thisTask = this.generateCarryMission({ manage: { num: 1, bind: [] } }, 20, this.name, centerLink.pos.x, centerLink.pos.y, this.name, storage_.pos.x, storage_.pos.y, 'energy')
      this.addMission(thisTask)
    }
  }
}
