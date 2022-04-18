import { isInArray } from '@/utils'

/* 房间原型拓展   --方法  --防御塔 */
export default class RoomFunctionTowerExtension extends Room {
  public TowerWork(): void {
    if (this.memory.state == 'peace') {
      if (Game.flags[`${this.name}/repair`]) {
        const towers = this.find(FIND_MY_STRUCTURES, {
          filter: (stru) => {
            return stru.structureType == 'tower' && stru.id != this.memory.structureIdData.NtowerID
          },
        }) as StructureTower[]
        const ramparts = this.getStructureHitsLeast(['rampart', 'constructedWall'], 3)
        for (const t of towers) {
          if (t.store.getUsedCapacity('energy') > 400)
            t.repair(ramparts)
        }
      }
      let Ntower: StructureTower = null
      if (this.memory.structureIdData.NtowerID)
        Ntower = Game.getObjectById(this.memory.structureIdData.NtowerID) as StructureTower
      if (!Ntower) { delete this.memory.structureIdData.NtowerID; return }
      if ((Game.time - global.Gtime[this.name]) % 5 == 0) {
        /* 寻找路，修路 */
        const repairRoad = Ntower.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (stru) => {
            return (stru.structureType == 'road' || stru.structureType == 'container') && stru.hits / stru.hitsMax < 0.8
          },
        })
        if (repairRoad)
          Ntower.repair(repairRoad)
      }
    }
    else if (this, this.memory.state == 'war') {
      if (Game.flags[`${this.name}/stop`])
        return
      if (this.memory.toggle.AutoDefend)
        return

      /* 没有主动防御下的防御塔逻辑 */
      const enemys = this.find(FIND_HOSTILE_CREEPS, {
        filter: (creep) => {
          return !isInArray(Memory.whitelist, creep.owner.username)
        },
      })
      if (!this.memory.structureIdData.AtowerID)
        this.memory.structureIdData.AtowerID = []
      if (enemys.length <= 0) {}
      else if (enemys.length == 1) {
        for (const c of this.memory.structureIdData.AtowerID) {
          const thisTower = Game.getObjectById(c) as StructureTower
          if (!thisTower) {
            const index = this.memory.structureIdData.AtowerID.indexOf(c); this.memory.structureIdData.AtowerID.splice(index, 1); continue
          }
          thisTower.attack(enemys[0])
        }
      }
      else if (enemys.length > 1) {
        for (const c of this.memory.structureIdData.AtowerID) {
          const thisTower = Game.getObjectById(c) as StructureTower
          if (!thisTower) {
            const index = this.memory.structureIdData.AtowerID.indexOf(c); this.memory.structureIdData.AtowerID.splice(index, 1); continue
          }
          if (Game.time % 2)
            thisTower.attack(enemys[0])
          else
            thisTower.attack(enemys[1])
        }
      }
    }
  }
}
