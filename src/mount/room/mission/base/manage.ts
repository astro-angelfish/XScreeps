/* 房间原型拓展   --任务  --中央运输工任务 */
export default class RoomMissionManageExtension extends Room {
  /* 链接送仓   即中央链接能量转移至仓库 */
  public checkCenterLinkToStorage(): void {
    if ((Game.time - global.Gtime[this.name]) % 15)
      return

    if (!this.memory.structureIdData?.centerLink || !this.memory.structureIdData.storageID)
      return

    const centerLink = Game.getObjectById(this.memory.structureIdData.centerLink)
    if (!centerLink) {
      delete this.memory.structureIdData.centerLink
      return
    }

    const storage = Game.getObjectById(this.memory.structureIdData.storageID)
    if (!storage)
      return

    // storage 满了就不挂载任务了
    if (storage.store.getFreeCapacity() <= 10000)
      return

    for (const i of this.memory.mission.Structure) {
      if (i.name === '链传送能' && i.structure?.includes(centerLink.id))
        return
    }

    if (centerLink.store.getUsedCapacity('energy') >= 400
     && !this.carryMissionExist('manage', centerLink.pos, storage.pos, 'energy')) {
      const thisTask = this.generateCarryMission(
        { manage: { num: 1, bind: [] } },
        20,
        this.name, centerLink.pos.x, centerLink.pos.y,
        this.name, storage.pos.x, storage.pos.y,
        'energy')
      this.addMission(thisTask)
    }
  }
}
