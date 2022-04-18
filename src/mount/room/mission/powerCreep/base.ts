import { isOPWR } from '@/mount/powercreep/mission/constant'

/* 超能powercreep相关任务 */
export default class PowerCreepMission extends Room {
  /**
   * Pc任务管理器
   */
  public missionPowerCreep(): void {
    if (!this.controller || this.controller.level < 8)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    const powerSpawn = global.structureCache[this.name].powerspawn as StructurePowerSpawn
    if (!pc) {
      return
    }
    else {
      // 看看是否存活，没存活就孵化
      if (!pc.ticksToLive && powerSpawn) {
        pc.spawn(powerSpawn)
        return
      }
    }

    this.missionPcEnhanceStorage()
    this.missionPcEnhanceLab()
    this.missionPcEnhanceExtension()
    this.missionPcEnhanceSpawn()
    this.missionPcEnhanceTower()
    // this.missionPcEnhanceFactory()
    this.missionPcEnhancePowerSpawn()
  }

  /**
   * 挂载增强 storage 的任务\
   * 适用于 queen 类型 pc
   */
  public missionPcEnhanceStorage(): void {
    if ((Game.time - global.Gtime[this.name]) % 7)
      return
    if (this.memory.toggle.StopEnhanceStorage)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_STORAGE] || pc.powers[PWR_OPERATE_STORAGE].cooldown)
      return

    // const effectDelay = false
    if (!storage.effects)
      storage.effects = []

    if (!isOPWR(storage) && this.countMissionByName('PowerCreep', '仓库扩容') <= 0) {
      // 发布任务
      this.addMission({
        name: '仓库扩容',
        delayTick: 40,
        category: 'PowerCreep',
        creepBind: { queen: { num: 1, bind: [] } },
      })
    }
  }

  /**
   * 挂载增强 lab 的任务\
   * 适用于 queen 类型 pc
   */
  public missionPcEnhanceLab(): void {
    if ((Game.time - global.Gtime[this.name]) % 10)
      return
    if (this.memory.toggle.StopEnhanceLab)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_LAB] || pc.powers[PWR_OPERATE_LAB].cooldown)
      return

    const disTask = this.getMissionModelByName('Room', '资源合成')
    if (!disTask)
      return

    if (this.countMissionByName('PowerCreep', '合成加速') > 0)
      return

    const labs = []
    for (const id of disTask.data.comData) {
      const lab = Game.getObjectById(id) as StructureLab
      if (lab && !isOPWR(lab))
        labs.push(id)
    }

    if (labs.length <= 0)
      return

    this.addMission({
      name: '合成加速',
      delayTick: 50,
      category: 'PowerCreep',
      creepBind: { queen: { num: 1, bind: [] } },
      data: {
        lab: labs,
      },
    })
  }

  /**
   * 挂载防御塔任务，配合主动防御\
   * 适用于 queen 类型 pc
   */
  public missionPcEnhanceTower(): void {
    if ((Game.time - global.Gtime[this.name]) % 11)
      return
    if (this.memory.state !== 'war' || !this.memory.toggle.AutoDefend)
      return
    if (this.memory.toggle.StopEnhanceTower)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_TOWER] || pc.powers[PWR_OPERATE_TOWER].cooldown)
      return

    const towers = []
    for (const id of this.memory.structureIdData?.AtowerID ?? []) {
      const tower = Game.getObjectById(id) as StructureTower
      if (tower && !isOPWR(tower))
        towers.push(tower.id)
    }

    if (towers.length <= 0)
      return

    if (this.countMissionByName('PowerCreep', '塔防增强') > 0)
      return

    // 发布任务
    this.addMission({
      name: '塔防增强',
      delayTick: 70,
      category: 'PowerCreep',
      creepBind: { queen: { num: 1, bind: [] } },
      data: {
        tower: towers,
      },
    })
  }

  /**
   * 挂载填充拓展任务
   * 适用于 queen 类型 pc
   */
  public missionPcEnhanceExtension(): void {
    if ((Game.time - global.Gtime[this.name]) % 25)
      return
    if (this.memory.toggle.StopEnhanceExtension)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage || storage.store.getUsedCapacity('energy') < 20000)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_EXTENSION] || pc.powers[PWR_OPERATE_EXTENSION].cooldown)
      return

    if (this.energyAvailable < this.energyCapacityAvailable * 0.3
       && this.countMissionByName('PowerCreep', '拓展填充') <= 0) {
      this.addMission({
        name: '拓展填充',
        delayTick: 30,
        category: 'PowerCreep',
        creepBind: { queen: { num: 1, bind: [] } },
        data: {},
      })
    }
  }

  /**
   * 挂载 spawn 加速任务
   * 适用于 queen 类型 pc
   */
  public missionPcEnhanceSpawn(): void {
    if ((Game.time - global.Gtime[this.name]) % 13)
      return
    if (this.memory.toggle.StopEnhanceSpawn)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_SPAWN] || pc.powers[PWR_OPERATE_SPAWN].cooldown)
      return

    // 在战争时期、对外战争时期，启动
    let isOnWar = false
    if (this.memory.state === 'war' && this.memory.toggle.AutoDefend) {
      isOnWar = true
    }
    else {
      for (const i of ['攻防一体', '双人小队', '四人小队', '紧急支援']) {
        if (this.countMissionByName('Creep', i) > 0)
          isOnWar = true
      }
    }

    if (!isOnWar)
      return

    this.addMission({
      name: '虫卵强化',
      delayTick: 50,
      category: 'PowerCreep',
      creepBind: { queen: { num: 1, bind: [] } },
      data: {},
    })
  }

  /**
   * 挂载升级工厂任务
   * 适用于 queen 类型 pc
   */
  public missionPcEnhanceFactory(): void {
    // if ((Game.time - global.Gtime[this.name]) % 14)
    //   return
    if (this.memory.toggle.StopEnhanceFactory)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_FACTORY] || pc.powers[PWR_OPERATE_FACTORY].cooldown)
      return

    if (this.countMissionByName('Room', '工厂合成') > 0)
      return

    this.addMission({
      name: '工厂强化',
      delayTick: 50,
      category: 'PowerCreep',
      creepBind: { queen: { num: 1, bind: [] } },
      data: {},
    })
  }

  /**
   * 挂载 powerspawn 增强任务
   * 适用于 queen 类型 pc
   */
  public missionPcEnhancePowerSpawn(): void {
    if ((Game.time - global.Gtime[this.name]) % 13)
      return
    if (this.memory.toggle.StopEnhancePowerSpawn)
      return

    const storage = global.structureCache[this.name].storage as StructureStorage
    if (!storage)
      return

    const pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
    if (!pc?.powers[PWR_OPERATE_POWER] || pc.powers[PWR_OPERATE_POWER].cooldown)
      return

    if (this.countMissionByName('Room', 'power升级') > 0)
      return

    this.addMission({
      name: 'power强化',
      delayTick: 50,
      category: 'PowerCreep',
      creepBind: { queen: { num: 1, bind: [] } },
      data: {},
    })
  }
}
