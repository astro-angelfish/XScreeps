import { boostedPartData } from '@/creep/constant/boost'

/* 爬虫原型拓展   --功能  --功能 */
export default class CreepUtilsExtension extends Creep {
  /**
   * working 状态
   */
  public processBasicWorkState(rType: ResourceConstant = RESOURCE_ENERGY): void {
    if (!this.memory.working)
      this.memory.working = false
    if (this.memory.working && this.store[rType] === 0)
      this.memory.working = false
    if (!this.memory.working && this.store.getFreeCapacity() === 0)
      this.memory.working = true
  }

  public processBasicHarvest(source_: Source): void {
    if (this.harvest(source_) === ERR_NOT_IN_RANGE) {
      this.goTo(source_.pos, 1)
      this.memory.standed = false
    }
    else {
      this.memory.standed = true
    }
  }

  public processBasicTransfer(distination: Structure, rType: ResourceConstant = RESOURCE_ENERGY): void {
    if (this.transfer(distination, rType) === ERR_NOT_IN_RANGE)
      this.goTo(distination.pos, 1)
  }

  public processBasicUpgrade(): void {
    if (this.room.controller) {
      if (this.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
        this.goTo(this.room.controller.pos, 1)
        this.memory.standed = false
      }
      else {
        this.memory.standed = true
      }
    }
  }

  // 考虑到建筑和修复有可能造成堵虫，所以解除钉扎状态
  public processBasicBuild(distination: ConstructionSite): void {
    if (this.build(distination) === ERR_NOT_IN_RANGE) {
      this.goTo(distination.pos, 1)
      this.memory.standed = false
    }
    else {
      this.memory.standed = true
    }
  }

  public processBasicRepair(distination: Structure): void {
    if (this.repair(distination) === ERR_NOT_IN_RANGE) {
      this.goTo(distination.pos, 1)
      this.memory.standed = false
    }
    else {
      this.memory.standed = true
    }
  }

  public processBasicWithdraw(distination: Structure, rType: ResourceConstant = RESOURCE_ENERGY): void {
    if (this.withdraw(distination, rType) === ERR_NOT_IN_RANGE)
      this.goTo(distination.pos, 1)

    this.memory.standed = false
  }

  // 确认是否 boost 了，并进行相应 boost
  public processBoost(boostBody: string[]): boolean {
    for (const body in this.memory.boostData) {
      if (!boostBody.includes(body))
        continue

      if (!this.memory.boostData[body].boosted) {
        const thisRoomMission = Game.rooms[this.memory.belong].getMissionById(this.memory.missionData.id)
        if (!thisRoomMission)
          return false

        if (!thisRoomMission.labBind)
          continue
        const labId = Object.entries(thisRoomMission.labBind)
          .find(([, rType]) => body === boostedPartData[rType])?.[0] as Id<StructureLab>
        if (!labId)
          continue
        const disLab = Game.getObjectById(labId)
        if (!disLab)
          continue
        if (!disLab.mineralType)
          return false

        if (!this.pos.isNearTo(disLab)) {
          this.goTo(disLab.pos, 1)
        }
        else {
          // 计算 body 部件
          const parts = Object.values(this.body).filter(i => i.type === body)
          if (parts.some(i => i.boost !== thisRoomMission.labBind![labId])) {
            disLab.boostCreep(this)
            return false
          }

          this.memory.boostData[body] = {
            boosted: true,
            num: parts.length,
            type: thisRoomMission.labBind[labId],
          }
        }

        return false
      }
    }

    return true
  }

  /**
   * 召唤所有房间内的防御塔治疗/攻击 自己/爬虫 [不一定成功]
   */
  public optTower(otype: 'heal' | 'attack', creep: Creep): void {
    if (this.room.name !== this.memory.belong || Game.shard.name !== this.memory.shard)
      return
    const room = Game.rooms[this.memory.belong]
    if (!room?.memory.structureIdData?.AtowerID)
      return

    for (const id of room.memory.structureIdData.AtowerID) {
      const tower = Game.getObjectById(id)
      if (!tower)
        continue

      if (otype === 'heal')
        tower.heal(creep)
      else
        tower.attack(creep)
    }
  }

  public isInDefend(creep: Creep): boolean {
    const room = Game.rooms[this.memory.belong]
    if (!room?.memory.enemy)
      return false

    for (const i in room.memory.enemy) {
      for (const id of room.memory.enemy[i]) {
        if (creep.id === id)
          return true
      }
    }
    return false
  }

  /**
   * 寻找数组里距离自己最近的爬虫
   * @param canAttack 为 true 则去除没有攻击部件的爬
   */
  public getClosestCreep(creeps: Creep[], canAttack?: boolean): Creep | undefined {
    if (creeps.length <= 0)
      return

    if (canAttack)
      creeps = creeps.filter(i => i.getActiveBodyparts('attack') || i.getActiveBodyparts('ranged_attack'))

    return creeps
      .map(creep => ({
        creep,
        distance: Math.max(Math.abs(this.pos.x - creep.pos.x), Math.abs(this.pos.y - creep.pos.y)),
      }))
      .reduce((a, b) => a.distance < b.distance ? a : b)
      .creep
  }

  /**
   * 计算 rangedMassAttack 对指定目标的伤害
   */
  public calcRangedMassAttackDamage(target: Creep | PowerCreep | Structure): number {
    // 对 ram 下无伤害
    if (target.pos.getStructure(STRUCTURE_RAMPART))
      return 0

    const distance = this.pos.getRangeTo(target)
    if (distance > 3)
      return 0
    if (distance > 2)
      return 1
    if (distance > 1)
      return 4
    return 10
  }
}
