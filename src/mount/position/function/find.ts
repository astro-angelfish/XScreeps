/* 位置原型拓展   --方法  --寻找 */
export default class PositionFunctionFindExtension extends RoomPosition {
  /**
   * 获取指定范围内，指定列表类型建筑
   * @param range 范围
   * @param mode 0 代表无筛选，1 代表 hit 受损的，2 代表 hit 最小
   */
  public getRangedStructure<T extends AnyStructure['structureType']>(types: T[], range: number, mode: 0 | 1): NarrowStructure<T>[]
  public getRangedStructure<T extends AnyStructure['structureType']>(types: T[], range: number, mode: 2): NarrowStructure<T> | undefined
  public getRangedStructure<T extends AnyStructure['structureType']>(types: T[], range: number, mode: number): NarrowStructure<T>[] | NarrowStructure<T> | undefined {
    const room = Game.rooms[this.roomName]
    if (!room)
      return mode === 0 || mode === 1 ? [] : undefined

    const structures = room.getStructureWithTypes(types).filter(s => this.inRangeTo(s, range)) as NarrowStructure<T>[]

    switch (mode) {
      case 0: {
        // 无筛选
        return structures
      }
      case 1: {
        // 筛选 hit
        return structures.filter(s => s.hits < s.hitsMax)
      }
      case 2: {
        // 获取 hits / hitsMax 最小的
        return structures.filter(s => s.hits < s.hitsMax)
          .reduce((pv, cv) => pv.hits / pv.hitsMax < cv.hits / cv.hitsMax ? pv : cv)
      }
    }
  }

  /**
   * 获取距离最近的指定列表里类型建筑
   * @param mode 0 代表无筛选，1 代表 hit 受损
   */
  public getClosestStructure<T extends AnyStructure['structureType']>(types: T[], mode: number): NarrowStructure<T> | null {
    const room = Game.rooms[this.roomName]
    if (!room)
      return null

    const structures = room.getStructureWithTypes(types) as NarrowStructure<T>[]

    switch (mode) {
      case 0: {
        // 无筛选
        return this.findClosestByRange(structures)
      }
      case 1: {
        // 筛选 hit
        return this.findClosestByRange(structures.filter(s => s.hits < s.hitsMax))
      }
      default: {
        return null
      }
    }
  }

  /**
   * 获取最近的 store 能量有空的 spawn 或扩展
   */
  public getClosestStore(): StructureExtension | StructureSpawn | StructureLab | null {
    return this.findClosestByPath(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_LAB)
        && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    }) as StructureExtension | StructureSpawn | StructureLab | null
  }

  /**
   * 获取资源矿点周围能开 link 的地方
   */
  public getSourceLinkVoid(): RoomPosition[] | null {
    const result = new Set<RoomPosition>()
    const sourceVoid = this.getSourceVoid()
    for (const x of sourceVoid) {
      const linkVoid = x.getSourceVoid()
      for (const y of linkVoid)
        result.add(y)
    }

    const result2: RoomPosition[] = []
    for (const i of result) {
      if (i.lookFor(LOOK_STRUCTURES).length === 0 && !this.isNearTo(i))
        result2.push(i)
    }

    if (result2)
      return result2

    return null
  }

  /**
   * 获取矿点周围的开采空位
   */
  public getSourceVoid(): RoomPosition[] {
    const result: RoomPosition[] = []

    const terrain = new Room.Terrain(this.roomName)
    const xs = [this.x - 1, this.x, this.x + 1]
    const ys = [this.y - 1, this.y, this.y + 1]

    for (const x of xs) {
      for (const y of ys) {
        if (terrain.get(x, y) !== TERRAIN_MASK_WALL)
          result.push(new RoomPosition(x, y, this.roomName))
      }
    }

    return result
  }

  /**
   * 获取该位置上指定类型建筑
   */
  public getStructure<T extends AnyStructure['structureType']>(type: T): NarrowStructure<T> | null {
    const list = this.lookFor(LOOK_STRUCTURES)
    if (list.length <= 0)
      return null

    for (const i of list) {
      if (i.structureType === type)
        return i as NarrowStructure<T>
    }

    return null
  }

  /**
   * 获取该位置上指定类型建筑列表
   */
  public getStructureList<T extends AnyStructure['structureType']>(types: T[]): NarrowStructure<T>[] {
    return this.lookFor(LOOK_STRUCTURES)
      .filter(s => types.includes(s.structureType as T)) as NarrowStructure<T>[]
  }

  /**
   * 获取该位置上有 store 的 ruin
   */
  public getRuin(): Ruin | null {
    const lis = this.lookFor(LOOK_RUINS)
    if (lis.length <= 0)
      return null

    for (const i of lis) {
      if (i.store && Object.keys(i.store).length > 0)
        return i
    }

    return null
  }

  /**
   * 寻找两个点之间的路线
   */
  public findPath(pos: RoomPosition, range: number): RoomPosition[] | null {
    // TODO 全局路线存储
    if (!global.routeCache)
      global.routeCache = {}

    // 路线查找
    const result = PathFinder.search(this, { pos, range }, {
      plainCost: 2,
      swampCost: 10,
      maxOps: 8000,
      roomCallback: (roomName) => {
        // 在全局绕过房间列表的房间 false
        if (Memory.bypassRooms && Memory.bypassRooms.includes(roomName))
          return false

        const room = Game.rooms[roomName]
        // 没有视野的房间只观察地形
        if (!room)
          return undefined!

        // 有视野的房间
        const costs = new PathFinder.CostMatrix()

        // 将道路的 cost 设置为 1，无法行走的建筑设置为 255
        for (const struct of room.find(FIND_STRUCTURES)) {
          if (struct.structureType === STRUCTURE_ROAD)
            costs.set(struct.pos.x, struct.pos.y, 1)
          else if (struct.structureType !== STRUCTURE_CONTAINER
            && (struct.structureType !== STRUCTURE_RAMPART || (!struct.my)))
            costs.set(struct.pos.x, struct.pos.y, 255)
        }
        room.find(FIND_MY_CONSTRUCTION_SITES).forEach((cons) => {
          if (cons.structureType !== 'road' && cons.structureType !== 'rampart' && cons.structureType !== 'container')
            costs.set(cons.pos.x, cons.pos.y, 255)
        })

        return costs
      },
    })

    // 寻路异常返回 null
    if (result.path.length <= 0)
      return null

    // 寻路结果压缩
    return result.path
  }

  /**
   * 获取该位置n格内的敌对爬虫
   */
  public findRangeCreep(num: number): Creep[] {
    return this.findInRange(FIND_CREEPS, num)
      .filter(c => !Memory.whitelist?.includes(c.owner.username))
  }

  /**
   * 防御塔数据叠加
   */
  public calcTowerRangeData(target: StructureTower, tempData: ARH): void {
    const xR = Math.abs(this.x - target.pos.x)
    const yR = Math.abs(this.y - target.pos.y)
    const distance = Math.max(xR, yR)

    let attackNum: number
    let repairNum: number
    let healNum: number
    if (distance <= 5) {
      attackNum = 600; repairNum = 800; healNum = 400
    }
    else if (distance >= 20) {
      attackNum = 150; repairNum = 200; healNum = 100
    }
    else {
      // 根据距离计算
      attackNum = 600 - (distance - 5) * 30
      repairNum = 800 - (distance - 5) * 40
      healNum = 400 - (distance - 5) * 20
    }
    tempData.attack += attackNum
    tempData.heal += healNum
    tempData.repair += repairNum
  }
}
