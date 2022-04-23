import { profileMethod } from '@/utils'

/* 房间原型拓展   --方法  --防御塔 */
export default class RoomTowerExtension extends Room {
  @profileMethod()
  public processTowers(): void {
    if (this.memory.state === 'peace') {
      // 修墙塔
      if (Game.flags[`${this.name}/repair`]) {
        const towers = this.getStructureWithType(STRUCTURE_TOWER)
          .filter(tower => tower.id !== this.memory.structureIdData?.NtowerID)
        const ramparts = this.getStructureHitsLeast([STRUCTURE_RAMPART, STRUCTURE_WALL], 3)
        for (const t of towers) {
          if (t.store.getUsedCapacity('energy') > 400)
            t.repair(ramparts)
        }
      }

      // 修 road / container
      this.collectTowerRepairList()
      const repairList = global.repairList![this.name]
      if (repairList?.length) {
        if (this.memory.structureIdData?.NtowerID) {
          const tower = Game.getObjectById(this.memory.structureIdData.NtowerID)
          if (tower) {
            for (const id of repairList) {
              const struct = Game.getObjectById(id)
              if (struct && struct.hits < struct.hitsMax) {
                tower.repair(struct)
                break
              }
              else {
                repairList.splice(repairList.indexOf(id), 1)
              }
            }
          }
        }
      }
    }
    else if (this.memory.state === 'war') {
      if (Game.flags[`${this.name}/stop`])
        return
      if (this.memory.toggles.AutoDefend)
        return
      if (!this.memory.structureIdData)
        return
      const structureIdData = this.memory.structureIdData

      // 没有主动防御下的防御塔逻辑
      if (structureIdData.AtowerID?.length) {
        const enemys = this.find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username))

        if (enemys.length === 1) {
          for (const towerId of structureIdData.AtowerID!) {
            const tower = Game.getObjectById(towerId)
            if (!tower) {
              structureIdData.AtowerID.splice(structureIdData.AtowerID.indexOf(towerId), 1)
              continue
            }
            tower.attack(enemys[0])
          }
        }
        else if (enemys.length > 1) {
          for (const towerId of structureIdData.AtowerID) {
            const tower = Game.getObjectById(towerId)
            if (!tower) {
              structureIdData.AtowerID.splice(structureIdData.AtowerID.indexOf(towerId), 1)
              continue
            }

            if (Game.time % 2)
              tower.attack(enemys[0])
            else
              tower.attack(enemys[1])
          }
        }
      }
    }
  }

  public collectTowerRepairList(): void {
    if ((Game.time - global.Gtime[this.name]) % 20 !== 0)
      return

    if (!global.repairList)
      global.repairList = {}

    global.repairList[this.name] = []

    const repairRoad = this.getStructureWithTypes([STRUCTURE_ROAD, STRUCTURE_CONTAINER])
      .filter(struct => !global.repairList![this.name].includes(struct.id) && struct.hits / struct.hitsMax < 0.8).map(struct => struct.id)
    global.repairList[this.name].push(...repairRoad)
  }
}
