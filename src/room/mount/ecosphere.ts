import { devPlanConstant } from '@/room/constant/plan'
import { colorfyLog, profileMethod } from '@/utils'

/* 房间原型拓展   --内核  --房间生态 */
export default class RoomEcosphereExtension extends Room {
  /**
   * 房间生态主函数
   */
  @profileMethod()
  public processRoomEcosphere(): void {
    this.processRoomState() // 房间状态监测
    this.processRoomPlan() // 房间布局及自动修复
  }

  /**
   * 自动布局
   */
  @profileMethod()
  public processRoomPlan(): void {
    if (!this.controller || !this.memory.structureIdData)
      return

    // 没有中心点不进行自动布局
    const centerList = Memory.roomControlData[this.name].center
    if (!centerList || centerList.length < 2)
      return

    const level = this.controller.level

    // 每次等级变化时刷新一次布局
    if (level !== this.memory.originLevel) {
      const layoutPlan = Memory.roomControlData[this.name].arrange
      switch (layoutPlan) {
        case 'man': {
          break
        }
        case 'dev': {
          this.ruleRoomLayout(level, devPlanConstant)
          break
        }
      }

      // link
      // -1 因为留给布局内的中心 link
      let linkCount = CONTROLLER_STRUCTURES.link[level] - 1
      // 第一个 link 给 source
      if (linkCount-- > 0) {
        const sourceId = this.memory.structureIdData.source?.[0]
        if (sourceId && !this.memory.harvestData[sourceId].linkID) {
          const source = Game.getObjectById(sourceId)!
          const link = source.pos.findInRange(this.getStructureWithType(STRUCTURE_LINK), 2)[0]
          if (link) {
            this.memory.harvestData[sourceId].linkID = link.id
          }
          else {
            const points = source.pos.getSourceLinkVoid() || []
            for (const i of points) {
              if (i.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0
             && i.lookFor(LOOK_STRUCTURES).length <= 0) {
                i.createConstructionSite(STRUCTURE_LINK)
                break
              }
            }
          }
        }
      }
      // 第二个出控制器 link 便于冲级
      if (linkCount-- > 0) {
        if (!this.memory.structureIdData.centerLink) {
          const controller = this.controller
          const points = controller.pos.getSourceLinkVoid() || []
          for (const i of points) {
            if (i.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0
             && i.lookFor(LOOK_STRUCTURES).length <= 0) {
              i.createConstructionSite(STRUCTURE_LINK)
              break
            }
          }
        }
      }
      // 第三个 link 给另一个 source
      if (linkCount-- > 0) {
        const sourceId = this.memory.structureIdData.source?.[1]
        if (sourceId && !this.memory.harvestData[sourceId].linkID) {
          const source = Game.getObjectById(sourceId)!
          const link = source.pos.findInRange(this.getStructureWithType(STRUCTURE_LINK), 2)[0]
          if (link) {
            this.memory.harvestData[sourceId].linkID = link.id
          }
          else {
            const points = source.pos.getSourceLinkVoid() || []
            for (const i of points) {
              if (i.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0
             && i.lookFor(LOOK_STRUCTURES).length <= 0) {
                i.createConstructionSite(STRUCTURE_LINK)
                break
              }
            }
          }
        }
      }
    }

    // 自动重建
    if (Game.shard.name === 'shard3' ? Game.time % 25 === 0 : Game.time % 5 === 0) {
      if (this.memory.state === 'peace') {
        // cpu 过少就不进行自动重建
        if (Game.cpu.bucket < 4000)
          return

        // 仅仅在和平情况下才会打开自动重建

        // 寻找所有属于我的建筑的数量，-1 是去除 controller，包含所有非控制器的我方建筑、我方建筑工地、该房间内的道路、container
        const currentNum = this.find(FIND_MY_STRUCTURES).length
          + this.find(FIND_CONSTRUCTION_SITES)
            .filter(s => s.structureType !== STRUCTURE_WALL).length
          + this.getStructureWithTypes([STRUCTURE_CONTAINER, STRUCTURE_ROAD]).length - 1

        if (!this.memory.structureNum)
          this.memory.structureNum = 0
        this.memory.structureNum = this.getDistributionNum()

        if (currentNum > this.memory.structureNum) {
          this.addCurrentStructuresToMemory()
          console.log(`房间 ${this.name} 更新 distribution 记忆! 检测到建筑: ${currentNum}，memory 中建筑数量: ${this.memory.structureNum}`)
        }
        else if (currentNum < this.memory.structureNum) {
          console.log(this.name, `房间 ${this.name} 检测出缺损！检测到建筑: ${currentNum}，memory 中建筑数量: ${this.memory.structureNum}`)
          this.patchFromDistribution()
        }
      }
      // 战争状态
      else if (this.memory.state === 'war') {
        // 仅检测城墙、spawn、仓库、终端、实验室的数量，检测到缺损就自动开启安全模式
        const typesCounting: BuildableStructureConstant[]
         = [STRUCTURE_RAMPART, STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_TERMINAL, STRUCTURE_LAB, STRUCTURE_EXTENSION]

        const currentNum = this.getStructureWithTypes(typesCounting).length
          + this.find(FIND_MY_CONSTRUCTION_SITES)
            .filter(s => typesCounting.includes(s.structureType)).length

        const memoryNum = typesCounting
          .reduce((sum, type) => sum + (this.memory.distribution[type]?.length || 0), 0)

        console.log(`[war] ${this.name} 建筑检测: ${currentNum} / ${memoryNum}`)

        if (currentNum < memoryNum) {
          // 说明出问题了
          this.controller.activateSafeMode()
        }
      }
    }
  }

  /**
   * 检测和调整房间状态\
   * 每 10tick 观察一次房间状态，如果发现敌人，房间状态变为 war，否则为 peace
   */
  @profileMethod()
  public processRoomState(): void {
    if (Game.time % 10)
      return

    // 安全模式下为和平模式
    if (this.controller?.safeMode) {
      this.memory.state = 'peace'
      return
    }

    const enemy = this.find(FIND_HOSTILE_CREEPS)
      .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
    const enemyPowerCreep = this.find(FIND_HOSTILE_POWER_CREEPS)
      .filter(creep => !Memory.whitelist?.includes(creep.owner.username))

    if (enemy.length > 0 || enemyPowerCreep.length > 0)
      this.memory.state = 'war'
    else this.memory.state = 'peace'
  }

  /**
   * 房间自动布局
   */
  @profileMethod()
  public ruleRoomLayout(level: number, map: BluePrint): void {
    const centerList = Memory.roomControlData[this.name].center
    const centerPoint = new RoomPosition(centerList[0], centerList[1], this.name)
    const terrain = this.getTerrain()

    for (const obj of map) {
      // 跳过无效建筑
      if (!obj.level || !obj.structureType)
        continue

      // 由于建筑是按等级排序的，所以到高等级建筑可以直接跳过所有
      if (level < obj.level)
        break

      const objPos = new RoomPosition(centerPoint.x + obj.x, centerPoint.y + obj.y, this.name)

      // 忽略越界位置
      if (objPos.x >= 49 || objPos.x <= 0 || objPos.y >= 49 || objPos.y <= 0)
        continue

      // 墙壁不建造东西
      if (terrain.get(objPos.x, objPos.y) === TERRAIN_MASK_WALL)
        continue

      // 如果位置已经有建筑就跳过
      if (objPos.lookFor(LOOK_STRUCTURES)
        .filter(s => s.structureType !== STRUCTURE_RAMPART).length > 0)
        continue
      if (objPos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0)
        continue

      const result = objPos.createConstructionSite(obj.structureType)
      if (result !== OK)
        console.log(colorfyLog(`房间 ${this.name} 创建工地 ${obj.structureType} 失败! 位置: [${obj.x}, ${obj.y}]`, 'orange', false))
      else
        console.log(colorfyLog(`房间 ${this.name} 创建工地 ${obj.structureType} 成功! 位置: [${obj.x}, ${obj.y}]`, 'green', false))
    }
  }

  /**
   * 获取房间 memory 中 distribution 总数量
   */
  @profileMethod()
  public getDistributionNum(): number {
    if (!this.memory.distribution)
      return 0

    return Object.entries(this.memory.distribution)
      .reduce((pv, [, v]) => pv + v.length, 0)
  }

  /**
   * 遍历该房间内所有的可以建造、维修的工地或建筑，将其添加进该房间的 memory 中
   */
  @profileMethod()
  public addCurrentStructuresToMemory(): void {
    if (!this.memory.distribution)
      this.memory.distribution = {}
    const distribution = this.memory.distribution

    // 获取所有的结构和工地
    const construction = [
      // 除了 controller 的建筑
      ...this.find(FIND_MY_STRUCTURES)
        .filter(s => s.structureType !== STRUCTURE_CONTROLLER),
      // spawn
      ...this.find(FIND_MY_SPAWNS),
      // road, container
      ...this.getStructureWithTypes([STRUCTURE_ROAD, STRUCTURE_CONTAINER]),
      // 工地
      ...this.find(FIND_CONSTRUCTION_SITES)
        .filter(s => s.structureType !== STRUCTURE_WALL),
    ] as ConcreteStructure<BuildableStructureConstant>[]

    for (const { structureType, pos: { x, y } } of construction) {
      if (!distribution[structureType])
        distribution[structureType] = []

      const posStr = `${x}/${y}`
      if (!distribution[structureType]!.includes(posStr))
        distribution[structureType]!.push(posStr)
    }
  }

  /**
   * 修补函数，根据记忆将缺损的建筑进行自动工地规划
   */
  @profileMethod()
  public patchFromDistribution(): void {
    if (!this.memory.distribution)
      return

    for (const type_ in this.memory.distribution) {
      const type = type_ as BuildableStructureConstant
      for (const posStr of this.memory.distribution[type]!) {
        const pos = this.unzipPositionInRoom(posStr)
        if (!pos)
          continue

        if (type === 'spawn') {
          pos.createConstructionSite(STRUCTURE_SPAWN)
          continue
        }
        if (pos.createConstructionSite(type) === 0)
          console.log(`自动修复成功，其建筑为 ${type}，位置为 [${pos.x}, ${pos.y}]`)
      }
    }
  }

  /**
   * 解压房间内字符串获取 RoomPosition
   */
  public unzipPositionInRoom(str: string): RoomPosition | undefined {
    const info = str.split('/', 2)
    return info.length === 2 ? new RoomPosition(Number(info[0]), Number(info[1]), this.name) : undefined
  }

  /**
   * 解绑函数，删除 memory 中指定的数据
   */
  public unbindMemory(type: BuildableStructureConstant, x: number, y: number): void {
    const pos = new RoomPosition(x, y, this.name)
    if (pos.lookFor(LOOK_STRUCTURES).length === 0
     && pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0) {
      console.log(`房间 ${this.name} 的位置 [${pos.x}, ${pos.y}] 无任何建筑或工地！`)
      return
    }

    const structures = [
      ...pos.lookFor(LOOK_STRUCTURES),
      ...pos.lookFor(LOOK_CONSTRUCTION_SITES),
    ]

    const distribution = this.memory.distribution

    for (const struct of structures) {
      if (struct.structureType !== type)
        continue

      // 在记忆列表中删除指定的数据，并删除该位置的建筑或工地
      if (!distribution[type] || distribution[type]!.length <= 0)
        return

      for (const posStr of distribution[type]!) {
        if (posStr === `${x}/${y}`)
          distribution[type]!.splice(distribution[type]!.indexOf(posStr), 1)
      }

      if ('destroy' in struct)
        struct.destroy()
      else if ('remove' in struct)
        struct.remove()

      return
    }

    console.log(`房间 ${this.name} 的位置 [${pos.x}, ${pos.y}] 不存在 ${type} 类型建筑或结构！`)
  }
}
