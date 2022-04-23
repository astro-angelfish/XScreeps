import { isOPWR } from '../../utils'

export default class PowerCreepMissionAction extends PowerCreep {
  /**
   * 操作仓库
   */
  public processPwrStorageMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
    if (!storage)
      return

    if (isOPWR(storage)) {
      Game.rooms[this.memory.belong].removeMission(this.memory.missionData.id)
      this.memory.missionData = {}
    }

    if (!this.prepareOps())
      return

    if (!this.pos.isNearTo(storage))
      this.goTo(storage.pos, 1)
    else this.usePower(PWR_OPERATE_STORAGE, storage)
  }

  /**
   * 操作 tower
   */
  public processPwrTowerMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    if (this.powers[PWR_OPERATE_TOWER]?.cooldown) {
      if (belongRoom.getMissionById(this.memory.missionData.id)) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
      else {
        this.memory.missionData = {}
      }
      return
    }

    if (!this.prepareOps())
      return

    for (const id of this.memory.missionData.data.tower) {
      const tower = Game.getObjectById(id as Id<StructureTower>)
      if (!tower)
        continue

      if (!isOPWR(tower)) {
        if (!this.pos.isNearTo(tower))
          this.goTo(tower.pos, 1)
        else
          this.usePower(PWR_OPERATE_TOWER, tower)

        return
      }
    }
  }

  /**
   * 操作 lab
   */
  public processPwrLabMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    if (this.powers[PWR_OPERATE_LAB]?.cooldown) {
      if (belongRoom.getMissionById(this.memory.missionData.id)) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
      else {
        this.memory.missionData = {}
      }
      return
    }

    if (!this.prepareOps())
      return

    for (const id of this.memory.missionData.Data.lab) {
      const lab = Game.getObjectById(id as Id<StructureLab>)
      if (!lab)
        continue

      if (!isOPWR(lab)) {
        if (!this.pos.isNearTo(lab))
          this.goTo(lab.pos, 1)
        else
          this.usePower(PWR_OPERATE_LAB, lab)

        return
      }
    }
  }

  /**
   * 操作拓展
   */
  public processPwrExtensionMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
    if (!storage)
      return

    if (this.powers[PWR_OPERATE_EXTENSION]?.cooldown) {
      if (belongRoom.getMissionById(this.memory.missionData.id)) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
      else {
        this.memory.missionData = {}
      }
      return
    }

    if (!this.prepareOps())
      return

    if (!this.pos.inRangeTo(storage, 3))
      this.goTo(storage.pos, 3)
    else this.usePower(PWR_OPERATE_EXTENSION, storage)
  }

  /**
   * 操作孵化
   */
  public processPwrSpawnMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    if (this.powers[PWR_OPERATE_SPAWN]?.cooldown) {
      if (belongRoom.getMissionById(this.memory.missionData.id)) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
      else {
        this.memory.missionData = {}
      }
      return
    }

    if (!this.prepareOps())
      return

    const spawningSpawn = this.pos.findClosestByRange(belongRoom.getStructureWithType(STRUCTURE_SPAWN))
    if (!spawningSpawn)
      return

    if (!this.pos.inRangeTo(spawningSpawn, 3))
      this.goTo(spawningSpawn.pos, 3)
    else this.usePower(PWR_OPERATE_SPAWN, spawningSpawn)
  }

  /**
   * 操作工厂
   */
  public processPwrFactoryMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const factory = belongRoom.memory.structureIdData?.factoryId ? Game.getObjectById(belongRoom.memory.structureIdData.factoryId) : null
    if (!factory)
      return

    if (this.powers[PWR_OPERATE_FACTORY]?.cooldown) {
      if (belongRoom.getMissionById(this.memory.missionData.id)) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
      else {
        this.memory.missionData = {}
      }
      return
    }

    if (!this.prepareOps())
      return

    if (!this.pos.inRangeTo(factory, 3))
      this.goTo(factory.pos, 3)
    else this.usePower(PWR_OPERATE_FACTORY, factory)
  }

  /**
   * 操作 powerspawn
   */
  public processPwrPowerSpawnMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const powerspawn = belongRoom.memory.structureIdData?.powerSpawnID ? Game.getObjectById(belongRoom.memory.structureIdData.powerSpawnID) : null
    if (!powerspawn)
      return

    if (this.powers[PWR_OPERATE_POWER]?.cooldown) {
      if (belongRoom.getMissionById(this.memory.missionData.id)) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
      else {
        this.memory.missionData = {}
      }
      return
    }

    if (!this.prepareOps())
      return

    if (!this.pos.inRangeTo(powerspawn, 3))
      this.goTo(powerspawn.pos, 3)
    else this.usePower(PWR_OPERATE_POWER, powerspawn)
  }

  /**
   * 操作 source
   */
  public processPwrSourceMission(): void {
    if (!this.memory.belong)
      return
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return

    const data = this.memory.missionData.Data

    const source = Game.getObjectById(data.source_id as Id<Source>)
    if (!source)
      return

    if (source.effects) {
      if (source.effects.length > 0) {
        belongRoom.removeMission(this.memory.missionData.id)
        this.memory.missionData = {}
      }
    }

    if (!this.prepareOps())
      return

    if (!this.pos.inRangeTo(source, 2))
      this.goTo(source.pos, 2)
    else
      this.usePower(PWR_REGEN_SOURCE, source)
  }
}
