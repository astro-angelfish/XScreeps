/* 房间原型拓展   --内核  --房间初始化 */
export default class RoomInitExtension extends Room {
  /**
   * 房间初始化主函数
   */
  public initRoom(): void {
    this.initRoomMemory()
    this.initRoomStructure()
    this.initRoomSpawnList()
    this.initGlobalRoomStructure()
  }

  /**
   * 所有 RoomMemory 的 1 级 key 都需要在这里注册
   */
  public initRoomMemory(): void {
    if (!this.memory.structureIdData)
      this.memory.structureIdData = {}
    if (!this.memory.roomLabBind)
      this.memory.roomLabBind = {}
    if (!this.memory.spawnConfig)
      this.memory.spawnConfig = {}
    if (!this.memory.originLevel)
      this.memory.originLevel = 0
    if (!this.memory.spawnQueue)
      this.memory.spawnQueue = []
    if (!this.memory.state)
      this.memory.state = 'peace'
    if (!this.memory.cooldownDic)
      this.memory.cooldownDic = {}
    if (!this.memory.mission)
      this.memory.mission = {}
    if (!this.memory.mission.Structure)
      this.memory.mission.Structure = []
    if (!this.memory.mission.Room)
      this.memory.mission.Room = []
    if (!this.memory.mission.Creep)
      this.memory.mission.Creep = []
    if (!this.memory.mission.PowerCreep)
      this.memory.mission.PowerCreep = []
    if (!global.structureCache[this.name])
      global.structureCache[this.name] = {}
    if (!this.memory.TerminalData)
      this.memory.TerminalData = { energy: { num: 50000, fill: true } }
    if (!this.memory.market)
      this.memory.market = { deal: [], order: [] }
    if (!global.resourceLimit[this.name])
      global.resourceLimit[this.name] = {}
    if (!this.memory.comDispatchData)
      this.memory.comDispatchData = {}
    if (!this.memory.toggles)
      this.memory.toggles = {}
    if (!this.memory.enemy)
      this.memory.enemy = {}
    if (!this.memory.productData)
      this.memory.productData = { level: 0, state: 'sleep', baseList: {}, balanceData: {} }
  }

  /**
   * 定时刷新房间内的建筑，将建筑id储存起来  【已测试】 <能用就行，不想改了QAQ>
   */
  public initRoomStructure(): void {
    if (!this.controller)
      return
    const level = this.controller.level

    if (!this.memory.structureIdData)
      this.memory.structureIdData = {}
    const structureData = this.memory.structureIdData

    // 删掉记忆中所有丢失的建筑类型
    // for (const type in structureData) {
    //   const struct = structureData[type as keyof typeof structureData]

    //   if (Array.isArray(struct)) {
    //     for (const id of struct) {
    //       if (Game.getObjectById(id) === null)
    //         struct.splice(struct.indexOf(id as never), 1)
    //     }
    //   }

    //   if (typeof struct === 'string') {
    //     if (Game.getObjectById(struct) === null)
    //       delete structureData[type as keyof typeof structureData]
    //   }
    // }

    // 验证有效性的函数
    const emptyOrHasInvalidStructure = <T extends _HasId>(arr: Id<T>[] | null | undefined) =>
      !arr || arr.length <= 0 || arr.some(s => Game.getObjectById(s) === null)
    const isInvalidStructure = <T extends _HasId>(id: Id<T> | null | undefined) =>
      !id || Game.getObjectById(id) === null

    // Spawn 建筑记忆更新
    if (!structureData.spawn)
      structureData.spawn = []
    if (emptyOrHasInvalidStructure(structureData.spawn)
     || (level === 8 && structureData.spawn.length < 3 && Game.time % 10 === 0)
     || (level === 7 && structureData.spawn.length < 2 && Game.time % 10 === 0)
     || (level <= 6 && structureData.spawn.length < 1)) {
      const spawns = this.getStructureWithType('spawn')
      for (const sp of spawns)
        structureData.spawn.push(sp.id)
    }

    // 中心点依赖建筑
    if (Memory.roomControlData[this.name].center.length === 2) {
      const center = Memory.roomControlData[this.name].center

      // 中央 link 建筑记忆更新
      if (level >= 5 && isInvalidStructure(structureData.centerLink)) {
        const position = new RoomPosition(center[0], center[1], this.name)
        const centerLinks = position.getRangedStructure(['link'], 3, 0)
        if (centerLinks.length >= 1)
          structureData.centerLink = centerLinks[0].id
      }

      // 近塔记忆更新 (用于维护道路和 container 的塔)
      if (level >= 3 && isInvalidStructure(structureData.NtowerID)) {
        const position = new RoomPosition(center[0], center[1], this.name)
        const tower = position.getClosestStructure([STRUCTURE_TOWER], 0)
        if (tower && tower.my) {
          if (position.getStraightDistanceTo(tower.pos) < 7)
            structureData.NtowerID = tower.id
        }
      }
    }

    // 资源矿记忆更新
    if (isInvalidStructure(structureData.mineralID)) {
      const mineral = this.find(FIND_MINERALS)
      if (mineral.length === 1)
        structureData.mineralID = mineral[0].id
    }

    // 能量矿记忆更新
    if (!structureData.source)
      structureData.source = []
    if (emptyOrHasInvalidStructure(structureData.source))
      structureData.source = this.find(FIND_SOURCES).map(s => s.id)

    // 升级 Link 记忆更新
    if (!structureData.sourceLinks)
      structureData.sourceLinks = []
    if (level >= 6 && isInvalidStructure(structureData.upgradeLink) && Game.time % 20 === 0) {
      const upgradeLink = this.controller.pos.getRangedStructure([STRUCTURE_LINK], 4, 0)
      if (upgradeLink.length >= 1) {
        for (const ul of upgradeLink) {
          if (!structureData.sourceLinks.includes(ul.id)) {
            structureData.upgradeLink = ul.id
            break
          }
        }
      }
    }

    // 矿点 link 记忆更新
    if (!structureData.consumeLink)
      structureData.consumeLink = []
    // 等级 >= 5 才有 link
    if (level >= 5
     // link 表为空
     && (emptyOrHasInvalidStructure(structureData.sourceLinks)
      // 或者 6 级以上时比 source 数少
      || (level >= 6 && structureData.sourceLinks.length < structureData.source.length))) {
      const tempLinks = []
      for (const sID of structureData.source) {
        const source = Game.getObjectById(sID)!
        const nearLinks = source.pos.getRangedStructure(['link'], 2, 0) as StructureLink[]
        for (const link of nearLinks) {
          if (structureData.upgradeLink === link.id)
            continue
          tempLinks.push(link.id)
        }
      }
      structureData.sourceLinks = tempLinks
    }

    // 仓库记忆更新
    if (level >= 4) // && isInvalidStructure(structureData.storageID)
      structureData.storageID = this.storage?.id

    // 防御塔记忆更新
    if (level >= 3 && Game.time % 150 === 0) {
      structureData.AtowerID = this.getStructureWithType(STRUCTURE_TOWER)
        .filter(s => s.my).map(s => s.id)
    }

    // 终端识别
    if (level >= 6) // && isInvalidStructure(structureData.terminalID)
      structureData.terminalID = this.terminal?.id

    // 提取器识别
    if (level >= 5 && isInvalidStructure(structureData.extractorID)) {
      const extractor = this.getStructureWithType(STRUCTURE_EXTRACTOR)
      if (extractor.length === 1)
        structureData.extractorID = extractor[0].id
    }

    // 实验室识别
    if (Game.time % 200 === 0) {
      structureData.labs = this.getStructureWithType(STRUCTURE_LAB)
        .filter(s => s.my).map(s => s.id)

      // 实验室合成数据 需要手动挂载，如果没有实验室合成数据，无法执行合成任务
      // 里面包含自动合成相关的原料 lab 和产出 lab 数据
      // if (!structureData.labInspect)
      //   structureData.labInspect = {}
    }

    // 观察器识别
    if (level >= 8 && isInvalidStructure(structureData.observerID)) {
      const observer = this.getStructureWithType(STRUCTURE_OBSERVER)
      if (observer.length > 0)
        structureData.observerID = observer[0].id
    }

    // PowerSpawn 识别
    if (level >= 8 && isInvalidStructure(structureData.powerSpawnID)) {
      const powerSpawn = this.getStructureWithType(STRUCTURE_POWER_SPAWN)
      if (powerSpawn.length > 0)
        structureData.powerSpawnID = powerSpawn[0].id
    }

    // 核弹识别
    if (level >= 8 && isInvalidStructure(structureData.nukerID)) {
      const nuke = this.getStructureWithType(STRUCTURE_NUKER)
      if (nuke.length > 0)
        structureData.nukerID = nuke[0].id
    }

    // 工厂识别
    if (level >= 8 && isInvalidStructure(structureData.factoryId)) {
      const factory = this.getStructureWithType(STRUCTURE_FACTORY)
      if (factory.length > 0)
        structureData.factoryId = factory[0].id
    }

    // harvestData 数据更新
    if (!this.memory.harvestData) {
      this.memory.harvestData = {}
      for (const source of structureData.source)
        this.memory.harvestData[source] = {}
    }
    const harvestData = this.memory.harvestData
    if (Game.time % 17 === 0) {
      for (const id_ in harvestData) {
        const id = id_ as Id<Source>
        const source = Game.getObjectById(id)!

        if (level < 5 || isInvalidStructure(harvestData[id].linkID)) {
          if (isInvalidStructure(harvestData[id].containerID)) {
            const containers = source.pos.getRangedStructure([STRUCTURE_CONTAINER], 1, 0)
            if (containers.length > 0)
              harvestData[id].containerID = containers[0].id
          }
        }
        if (level >= 5) {
          if (isInvalidStructure(harvestData[id].linkID)) {
            const links = source.pos.getRangedStructure([STRUCTURE_LINK], 2, 0)
            if (links.length > 0)
              harvestData[id].linkID = links[0].id
          }
          else if (harvestData[id].containerID) {
            const container = Game.getObjectById(harvestData[id].containerID!)
            if (container) {
              this.unbindMemory('container', container.pos.x, container.pos.y)
              container.destroy()
            }
            delete harvestData[id].containerID
          }
        }
      }
    }
  }

  /**
   * 房间孵化队列初始化
   */
  public initRoomSpawnList(): void {
    if (!global.creepBodyData)
      global.creepBodyData = {}
    if (!global.creepBodyData[this.name])
      global.creepBodyData[this.name] = {}
    if (!global.creepNumData)
      global.creepNumData = {}
    if (!global.creepNumData[this.name])
      global.creepNumData[this.name] = {}
  }

  /**
   * 房间全局建筑初始化\
   * 目前只支持 storage terminal factory powerspawn Ntower
   */
  public initGlobalRoomStructure(): void {
    if (!this.memory.structureIdData)
      return

    const structureIdData = this.memory.structureIdData
    if (!global.structureCache[this.name])
      global.structureCache[this.name] = {}
    const structureCache = global.structureCache[this.name]

    if (structureIdData.storageID)
      structureCache.storage = Game.getObjectById(structureIdData.storageID)!

    if (structureIdData.terminalID)
      structureCache.terminal = Game.getObjectById(structureIdData.terminalID)!

    if (structureIdData.powerSpawnID)
      structureCache.powerspawn = Game.getObjectById(structureIdData.powerSpawnID)!

    if (structureIdData.factoryId)
      structureCache.factory = Game.getObjectById(structureIdData.factoryId)!

    if (structureIdData.NtowerID)
      structureCache.Ntower = Game.getObjectById(structureIdData.NtowerID)!

    if (structureIdData.AtowerID && structureIdData.AtowerID.length > 0) {
      const otlist = structureCache.Atower = [] as StructureTower[]
      for (const ti of structureIdData.AtowerID) {
        const ot = Game.getObjectById(ti)
        if (!ot) {
          const index = structureIdData.AtowerID.indexOf(ti)
          structureIdData.AtowerID.splice(index, 1)
          continue
        }
        otlist.push(ot)
      }
    }
  }
}
