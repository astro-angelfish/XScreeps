import { allStructureTypes } from '@/constant/structureConstant'

/* 房间原型拓展   --方法  --寻找 */
export default class RoomFunctionFindExtension extends Room {
  /* 获取指定 structureType 的建筑列表 */
  public getStructureWithType<T extends AnyStructure['structureType']>(type: T): NarrowStructure<T>[] {
    if (this._cacheStructuresByType && this._cacheSBTUpdated === Game.time)
      return this._cacheStructuresByType[type]

    this.cacheStructures()

    return this._cacheStructuresByType[type]
  }

  /**
   * 将房间内建筑按 stuctureType 分类放进缓存
   */
  public cacheStructures(): void {
    this._cacheStructuresByType = Object.fromEntries(allStructureTypes.map(v => [v, []])) as unknown as CacheStructuresByType
    for (const structure of this.find(FIND_STRUCTURES))
      this._cacheStructuresByType[structure.structureType].push(structure as never)
    this._cacheSBTUpdated = Game.time
  }

  /**
   * 任务 lab 绑定数据生成便捷函数
   */
  public bindLab(rTypes: ResourceConstant[]): MissionLabBind | undefined {
    const result: MissionLabBind = {}
    const tempList: Id<StructureLab>[] = []

    if (!this.memory.roomLabBind)
      return
    const labIds = this.memory.structureIdData?.labs

    const bindRes = (resource: ResourceConstant) => {
      // 计算是否已经存在相关 lab
      for (const labId in this.memory.roomLabBind) {
        const labBind = this.memory.roomLabBind[labId]
        if (labBind.rType === resource && !labBind.occ) {
          result[labId] = resource
          return
        }
      }

      if (labIds) {
        for (const labId of labIds) {
          const occLabIds = Object.keys(this.memory.roomLabBind!)
          if (!occLabIds.includes(labId) && !tempList.includes(labId)) {
            const thisLab = Game.getObjectById(labId) as StructureLab
            if (!thisLab) {
              labIds.splice(labIds.indexOf(labId), 1)
              continue
            }

            if (thisLab.store) {
              // lab 是空的或者 lab 只有 energy
              if (Object.keys(thisLab.store).length < 1
               || (Object.keys(thisLab.store).length === 1 && thisLab.store.energy > 0)) {
                result[labId] = resource
                tempList.push(labId)
                return
              }
            }
          }
        }
      }
    }
    for (const resource of rTypes) bindRes(resource)

    return result
  }

  /**
   * 获取指定列表中类型的 hit 最小的建筑 (比值)
   * @param mode 0: hits 最小, 1: hitsMax - hits 最小, 2: hits / hitsMax 最小
   */
  public getStructureHitsLeast<T extends AnyStructure['structureType']>(types: T[], mode: 0 | 1 | 2 | 3 = 2): NarrowStructure<T> {
    const structures = this.getStructureWithTypes(types).filter(v => v.hits < v.hitsMax)
    switch (mode) {
      case 0:
      case 3: {
        return structures.reduce((pv, cv) => (pv ? pv.hits : Infinity) < cv.hits ? pv : cv)
      }
      case 1: {
        return structures.reduce((pv, cv) => (pv ? pv.hitsMax - pv.hits : 0) > cv.hitsMax - cv.hits ? pv : cv)
      }
      case 2: {
        return structures.reduce((pv, cv) => (pv ? pv.hits / pv.hitsMax : 1) < cv.hits / cv.hitsMax ? pv : cv)
      }
    }
  }

  /**
   * 获取指定类型的建筑
   */
  public getStructureWithTypes<T extends AnyStructure['structureType']>(types: T[]): NarrowStructure<T>[] {
    if (this._cacheStructuresByType && this._cacheSBTUpdated === Game.time)
      return types.map(v => this._cacheStructuresByType[v]).flat()

    this.cacheStructures()

    return types.map(v => this._cacheStructuresByType[v]).flat()
  }

  /**
   * 房间建筑执行任务
   * @deprecated
   */
  public runStructureMissionWithTypes(type: StructureConstant[]): void {
    const structures = this.getStructureWithTypes(type)
    for (const s of structures) {
      if ('manageMission' in s)
        s.manageMission()
    }
  }

  /**
   * 建筑任务初始化\
   * 目前包含 terminal factory link
   */
  public runStructureMission(): void {
    if (!this.memory.structureIdData)
      return
    const structureIdData = this.memory.structureIdData
    const structures = []

    if (structureIdData.terminalID)
      structures.push(Game.getObjectById(structureIdData.terminalID)!)

    if (structureIdData.factoryId)
      structures.push(Game.getObjectById(structureIdData.factoryId)!)

    if (structureIdData.centerLink)
      structures.push(Game.getObjectById(structureIdData.centerLink)!)

    if (structureIdData.sourceLinks && structureIdData.sourceLinks.length > 0) {
      for (const s of structureIdData.sourceLinks) {
        const link = Game.getObjectById(s)
        if (!link)
          structureIdData.sourceLinks.splice(structureIdData.sourceLinks.indexOf(s), 1)
        else structures.push(link)
      }
    }

    if (structureIdData.consumeLink && structureIdData.consumeLink.length > 0) {
      for (const s of structureIdData.consumeLink) {
        const link = Game.getObjectById(s)
        if (!link)
          structureIdData.consumeLink.splice(structureIdData.consumeLink.indexOf(s), 1)
        else structures.push(link)
      }
    }

    if (structures.length > 0) {
      for (const obj of structures) {
        if ('manageMission' in obj)
          obj.manageMission()
      }
    }
  }

  /**
   * 等级信息更新
   */
  public updateLevelCache(): void {
    if (!this.controller)
      return
    if (this.controller.level > this.memory.originLevel)
      this.memory.originLevel = this.controller.level
  }
}
