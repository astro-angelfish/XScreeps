import { isOPWR } from './constant'

export default class PowerCreepMissionAction extends PowerCreep {
  // 操作仓库
  public handle_pwr_storage(): void {
    const storage_ = global.structureCache[this.memory.belong].storage as StructureStorage
    if (!storage_)
      return
    if (isOPWR(storage_)) {
      Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
      this.memory.MissionData = {}
    }
    if (!this.OpsPrepare())
      return
    if (!this.pos.isNearTo(storage_))
      this.goTo(storage_.pos, 1)

    else this.usePower(PWR_OPERATE_STORAGE, storage_)
  }

  // 操作tower
  public handle_pwr_tower(): void {
    if (this.powers[PWR_OPERATE_TOWER] && this.powers[PWR_OPERATE_TOWER].cooldown) {
      if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) {
        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
        this.memory.MissionData = {}
      }
      else { this.memory.MissionData = {} }
      return
    }
    if (!this.OpsPrepare())
      return
    for (const id of this.memory.MissionData.data.tower) {
      const tower_ = Game.getObjectById(id) as StructureTower
      if (!isOPWR(tower_)) {
        if (!this.pos.isNearTo(tower_))
          this.goTo(tower_.pos, 1)

        else
          this.usePower(PWR_OPERATE_TOWER, tower_)

        return
      }
    }
  }

  // 操作lab
  public handle_pwr_lab(): void {
    if (this.powers[PWR_OPERATE_LAB] && this.powers[PWR_OPERATE_LAB].cooldown) {
      if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) {
        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
        this.memory.MissionData = {}
      }
      else { this.memory.MissionData = {} }
      return
    }
    if (!this.OpsPrepare())
      return
    for (const id of this.memory.MissionData.Data.lab) {
      const lab_ = Game.getObjectById(id) as StructureTower
      if (!isOPWR(lab_)) {
        if (!this.pos.isNearTo(lab_))
          this.goTo(lab_.pos, 1)

        else
          this.usePower(PWR_OPERATE_LAB, lab_)

        return
      }
    }
  }

  // 操作拓展
  public handle_pwr_extension(): void {
    const storage_ = global.structureCache[this.memory.belong].storage as StructureStorage
    if (!storage_)
      return
    if (this.powers[PWR_OPERATE_EXTENSION] && this.powers[PWR_OPERATE_EXTENSION].cooldown) {
      if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) {
        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
        this.memory.MissionData = {}
      }
      else { this.memory.MissionData = {} }
      return
    }
    if (!this.OpsPrepare())
      return
    if (!this.pos.inRangeTo(storage_, 3))
      this.goTo(storage_.pos, 3)

    else this.usePower(PWR_OPERATE_EXTENSION, storage_)
  }

  /* 操作孵化 */
  public handle_pwr_spawn(): void {
    if (this.powers[PWR_OPERATE_SPAWN] && this.powers[PWR_OPERATE_SPAWN].cooldown) {
      if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) {
        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
        this.memory.MissionData = {}
      }
      else { this.memory.MissionData = {} }
      return
    }
    const spawningSpawn = this.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (stru) => {
        return stru.structureType == 'spawn'
      },
    })
    if (!this.OpsPrepare())
      return
    if (!this.pos.inRangeTo(spawningSpawn, 3))
      this.goTo(spawningSpawn.pos, 3)

    else this.usePower(PWR_OPERATE_SPAWN, spawningSpawn)
  }

  /* 操作工厂 */
  public handle_pwr_factory(): void {
    const factory_ = global.structureCache[this.memory.belong].factory as StructureStorage
    if (!factory_)
      return
    if (this.powers[PWR_OPERATE_FACTORY] && this.powers[PWR_OPERATE_FACTORY].cooldown) {
      if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) {
        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
        this.memory.MissionData = {}
      }
      else { this.memory.MissionData = {} }
      return
    }
    if (!this.OpsPrepare())
      return
    if (!this.pos.inRangeTo(factory_, 3))
      this.goTo(factory_.pos, 3)

    else this.usePower(PWR_OPERATE_FACTORY, factory_)
  }

  /* 操作powerspawn */
  public handle_pwr_powerspawn(): void {
    const powerspawn_ = global.structureCache[this.memory.belong].powerspawn as StructureStorage
    if (!powerspawn_)
      return
    if (this.powers[PWR_OPERATE_POWER] && this.powers[PWR_OPERATE_POWER].cooldown) {
      if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id)) {
        Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
        this.memory.MissionData = {}
      }
      else { this.memory.MissionData = {} }
      return
    }
    if (!this.OpsPrepare())
      return
    if (!this.pos.inRangeTo(powerspawn_, 3))
      this.goTo(powerspawn_.pos, 3)

    else this.usePower(PWR_OPERATE_POWER, powerspawn_)
  }
}
