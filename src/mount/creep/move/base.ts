// import { RequestShard } from "@/shard/base"
import { calcCreepAttackDamage, havePart } from '@/module/fun/funtion'
import { requestShard } from '@/module/shard/base'
import { closestPortalRoom, getCoordPosFromRoomName, getOppositeDirection, profileMethod } from '@/utils'

/* 本地寻路移动 */
export default class CreepMoveExtension extends Creep {
  /**
   * 位置标准化
   */
  public standardizePos(pos: RoomPosition): string {
    return `${pos.roomName}/${pos.x}/${pos.y}/${Game.shard.name}`
  }

  /**
   * 寻找不允许对穿的爬虫的位置
   */
  public getStandedPos(): RoomPosition[] {
    const standedCreep = this.room.find(FIND_MY_CREEPS)
      .filter(creep => creep.memory.standed || (creep.memory.crossLevel && this.memory.crossLevel && creep.memory.crossLevel > this.memory.crossLevel))
    if (standedCreep.length > 0)
      return standedCreep.map(creep => creep.pos)

    return []
  }

  /**
   * 通用寻路
   */
  @profileMethod()
  public findPath(target: RoomPosition, range: number): string | null {
    // 全局路线存储
    if (!global.routeCache)
      global.routeCache = {}

    if (!this.memory.moveData)
      this.memory.moveData = {}
    this.memory.moveData.index = 0

    // 查找全局中是否已经有预定路线，如果有了就直接返回路线
    const routeKey = `${this.standardizePos(this.pos)} ${this.standardizePos(target)}`
    let route = global.routeCache[routeKey]
    if (route && this.room.name !== target.roomName)
      return route

    // 过道路口优先
    const allowedRooms = { [this.pos.roomName]: true, [target.roomName]: true }
    let swi = false
    if (target.roomName !== this.room.name) {
      // 计算距离 如果两个房间之间距离过短就不这样做
      const enoughDistance = Game.map.getRoomLinearDistance(this.room.name, target.roomName)
      if (enoughDistance > 4.3) {
        swi = true
        const ret = Game.map.findRoute(this.pos.roomName, target.roomName, {
          routeCallback(roomName) {
            // 在全局绕过房间列表的房间 false
            if (Memory.bypassRooms && Memory.bypassRooms.includes(roomName))
              return Infinity

            const parsed = getCoordPosFromRoomName(roomName)
            const isHighway = (parsed.pos[0] % 10 === 0) || (parsed.pos[1] % 10 === 0)
            const isMyRoom = Game.rooms[roomName]?.controller?.my
            if (isHighway || isMyRoom)
              return 1
            else
              return 2
          },
        })
        if (ret !== ERR_NO_PATH) {
          for (const info of ret)
            allowedRooms[info.room] = true
        }
      }
    }

    // 路线查找
    const result = PathFinder.search(this.pos, { pos: target, range }, {
      plainCost: 2,
      swampCost: 5,
      maxOps: target.roomName === this.room.name ? 1000 : 8000,
      roomCallback: (roomName) => {
        // 在全局绕过房间列表的房间 false
        if (!swi && Memory.bypassRooms && Memory.bypassRooms.includes(roomName))
          return false
        if (swi && allowedRooms[roomName] === undefined)
          return false

        // 在爬虫记忆绕过房间列表的房间 false
        const room = Game.rooms[roomName]

        // 没有视野的房间只观察地形
        if (!room)
          return null!

        // 有视野的房间
        const costs = new PathFinder.CostMatrix()

        // 将道路的 cost 设置为 1，无法行走的建筑设置为 255
        for (const struct of room.find(FIND_STRUCTURES)) {
          if (struct.structureType === STRUCTURE_ROAD)
            costs.set(struct.pos.x, struct.pos.y, 1)
          else if (struct.structureType !== STRUCTURE_CONTAINER
           && (struct.structureType !== STRUCTURE_RAMPART || !struct.my))
            costs.set(struct.pos.x, struct.pos.y, 0xFF)
        }
        for (const cons of room.find(FIND_MY_CONSTRUCTION_SITES)) {
          if (cons.structureType !== STRUCTURE_ROAD && cons.structureType !== STRUCTURE_RAMPART && cons.structureType !== STRUCTURE_CONTAINER)
            costs.set(cons.pos.x, cons.pos.y, 0xFF)
        }

        // 防止撞到其他虫子造成堵虫
        for (const creep of room.find(FIND_HOSTILE_CREEPS))
          costs.set(creep.pos.x, creep.pos.y, 0xFF)
        for (const creep of room.find(FIND_MY_CREEPS)) {
          if (creep.memory.standed || (creep.memory.crossLevel && this.memory.crossLevel && creep.memory.crossLevel > this.memory.crossLevel))
            costs.set(creep.pos.x, creep.pos.y, 0xFF)
          else
            costs.set(creep.pos.x, creep.pos.y, 3)
        }

        return costs
      },
    })

    // 寻路异常返回 null
    if (result.path.length <= 0)
      return null

    // 寻路结果压缩
    route = this.serializeFarPath(result.path)

    if (!result.incomplete)
      global.routeCache[routeKey] = route

    return route
  }

  /**
   * 使用寻路结果移动
   */
  @profileMethod()
  public goByPath(): CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_IN_RANGE | ERR_INVALID_TARGET {
    if (!this.memory.moveData?.path || !this.memory.moveData.index)
      return ERR_NO_PATH

    const index = this.memory.moveData.index
    // 移动索引超过数组上限代表到达目的地
    if (index >= this.memory.moveData.path.length) {
      delete this.memory.moveData.path
      return OK
    }

    // 获取方向，进行移动
    const direction = Number(this.memory.moveData.path[index]) as DirectionConstant
    const goResult = this.go(direction)
    // 移动成功，更新下次移动索引
    if (goResult === OK)
      this.memory.moveData.index++
    return goResult
  }

  /**
   * 通用移动 (配合findPath 和 goByPath)
   */
  @profileMethod()
  public goTo(target: RoomPosition, range = 1): CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_IN_RANGE | ERR_INVALID_TARGET {
    //  var a = Game.cpu.getUsed()
    if (this.memory.moveData === undefined)
      this.memory.moveData = {}

    // 确认目标没有变化，如果变化了就重新规划路线
    const targetPosTag = this.standardizePos(target)
    if (targetPosTag !== this.memory.moveData.targetPos) {
      this.memory.moveData.targetPos = targetPosTag
      this.memory.moveData.path = this.findPath(target, range) || undefined
    }
    // 确认缓存有没有被清除
    if (!this.memory.moveData.path)
      this.memory.moveData.path = this.findPath(target, range) || undefined

    // 还为空的话就是没有找到路径
    if (!this.memory.moveData.path) {
      delete this.memory.moveData.path
      return OK
    }

    // 使用缓存进行移动
    const goResult = this.goByPath()
    // 如果发生撞停或者参数异常，说明缓存可能存在问题，移除缓存
    if (goResult === ERR_INVALID_TARGET)
      delete this.memory.moveData

    else if (goResult !== OK && goResult !== ERR_TIRED)
      this.say(`异常码：${goResult}`)

    // var b = Game.cpu.getUsed()
    // this.say(`${b-a}`)
    return goResult
  }

  /**
   * 请求对穿 按照对穿等级划分 等级高的可以任意对穿等级低的，等级低的无法请求等级高的对穿，等级相等则不影响
   */
  public requestCross(direction: DirectionConstant): OK | ERR_BUSY | ERR_NOT_FOUND {
    // 10 为默认对穿等级
    if (!this.memory.crossLevel)
      this.memory.crossLevel = 10

    // 获取目标方向一格的位置
    const fontPos = this.pos.directionToPos(direction)
    // 在出口、边界
    if (!fontPos)
      return ERR_NOT_FOUND

    const fontCreep = (fontPos.lookFor(LOOK_CREEPS)[0] || fontPos.lookFor(LOOK_POWER_CREEPS)[0]) as Creep | PowerCreep
    if (!fontCreep)
      return ERR_NOT_FOUND

    if (fontCreep.owner.username !== this.owner.username)
      return ERR_BUSY

    this.say('👉')

    if (fontCreep.manageCross(getOppositeDirection(direction), this.memory.crossLevel))
      this.move(direction)
    return OK
  }

  /**
   * 处理对穿
   */
  public manageCross(direction: DirectionConstant, crossLevel: number): boolean {
    if (!this.memory.crossLevel)
      this.memory.crossLevel = 10

    if (!this.memory)
      return true

    if (this.memory.standed || this.memory.crossLevel > crossLevel) {
      if (!(Game.time % 5))
        this.say('👊')
      return false
    }

    // 同意对穿
    this.say('👌')
    this.move(direction)
    return true
  }

  /**
   * 单位移动 (goByPath中的移动基本函数)
   */
  @profileMethod()
  public go(direction: DirectionConstant): CreepMoveReturnCode | ERR_INVALID_TARGET {
    const moveResult = this.move(direction)
    if (moveResult !== OK)
      return moveResult

    // 如果 ok 的话，有可能撞上东西了或者一切正常
    const currentPos = `${this.pos.x}/${this.pos.y}`
    if (currentPos === this.memory.prePos) {
      // 这个时候确定在原点驻留了
      const crossResult = this.memory.disableCross ? ERR_BUSY : this.requestCross(direction)
      if (crossResult !== OK) {
        delete this.memory.moveData
        return ERR_INVALID_TARGET
      }
    }

    this.memory.prePos = currentPos
    return OK
  }

  /**
   * 压缩路径
   */
  public serializeFarPath(positions: RoomPosition[]): string {
    if (positions.length === 0)
      return ''

    // 确保路径里第一个位置是自己当前的位置
    if (!positions[0].isEqualTo(this.pos))
      positions.splice(0, 0, this.pos)

    return positions.map((pos, index) => {
      // 最后一个位置就不用再移动
      if (index >= positions.length - 1)
        return null

      // 由于房间边缘地块会有重叠，所以这里筛除掉重叠的步骤
      if (pos.roomName !== positions[index + 1].roomName)
        return null

      // 获取到下个位置的方向
      return pos.getDirectionTo(positions[index + 1])
    }).join('')
  }

  /**
   * 跨 shard 移动
   */
  @profileMethod()
  public arriveTo(target: RoomPosition, range: number, shard: string = Game.shard.name, shardData?: shardRoomData[]): void {
    if (!this.memory.targetShard)
      this.memory.targetShard = shard

    if (!shardData || shardData.length === 0) {
      if (shard === Game.shard.name) {
        this.goTo(target, range)
      }
      else {
        // 寻找最近的十字路口房间
        if (!this.memory.protalRoom) {
          if (Game.flags[`${this.memory.belong}/portal`])
            this.memory.protalRoom = Game.flags[`${this.memory.belong}/portal`].room?.name
          else
            this.memory.protalRoom = closestPortalRoom(this.memory.belong, target.roomName)
        }
        if (!this.memory.protalRoom)
          return

        if (this.room.name !== this.memory.protalRoom) {
          this.goTo(new RoomPosition(25, 25, this.memory.protalRoom), 20)
        }
        else {
          // 寻找星门
          const portals = this.room.getStructureWithType(STRUCTURE_PORTAL)
          if (portals.length <= 0)
            return

          const portal = portals.find(portal => 'shard' in portal.destination && portal.destination.shard === shard)
          if (!portal)
            return

          if (!this.pos.isNearTo(portal)) {
            this.goTo(portal.pos, 1)
          }
          else {
            // moveData 里的 shardmemory
            // 靠近后等待信息传送
            const requestData = {
              relateShard: shard,
              sourceShard: Game.shard.name,
              type: 1,
              data: { id: this.name, MemoryData: this.memory },
            }
            if (requestShard(requestData))
              this.moveTo(portal)
          }
        }
      }
    }
    else {
      // 存在 shardData 则说明爬虫可能需要跨越多个 shard
      if (!this.memory.shardAffirm) {
        this.memory.shardAffirm = shardData.map(data_ => ({
          shardName: data_.shard,
          roomName: data_.roomName,
          x: data_.x,
          y: data_.y,
          affirm: false,
        }))
      }
      if (this.memory.shardAffirm.length === 0) {
        this.say('shardAffirm赋予错误!')
        return
      }

      // 更新目的 shardRoom
      for (const sr of this.memory.shardAffirm) {
        if (sr.disRoomName === this.pos.roomName && sr.disRoomName === Game.shard.name) {
          sr.affirm = true
          break
        }
      }

      // 确定下一个目的 shardRoom
      let nextShardRoom: shardRoomData | undefined
      for (const nr of this.memory.shardAffirm) {
        if (!nr.affirm) {
          nextShardRoom = { shard: nr.shardName, roomName: nr.roomName, x: nr.x, y: nr.y }
          break
        }
      }

      // 到达目标 shard
      if (!nextShardRoom && Game.shard.name === this.memory.targetShard) {
        this.goTo(target, range)
        return
      }
      // 没到达
      if (!nextShardRoom) {
        this.say('找不到nextShardRoom')
        return
      }
      if (this.room.name !== nextShardRoom.roomName) {
        this.goTo(new RoomPosition(25, 25, nextShardRoom.roomName), 20)
      }
      else {
        // 寻找星门
        const portal = this.room.getStructureWithType(STRUCTURE_PORTAL)
        if (portal.length <= 0)
          return

        let thisportal: StructurePortal | undefined
        for (const i of portal) {
          const porType = i.destination
          if (!('shard' in porType))
            continue

          if (i.pos.x === nextShardRoom.x && i.pos.y === nextShardRoom.y) {
            // 更新一下 shardAffirm 的 disRoomName 信息
            for (const sr of this.memory.shardAffirm) {
              if (sr.roomName === this.pos.roomName && sr.shardName === Game.shard.name) {
                sr.disRoomName = porType.room
                nextShardRoom.disShardName = porType.shard
                sr.disShardName = porType.shard
                break
              }
            }

            thisportal = i
            break
          }
        }
        if (!thisportal) {
          console.log('找不到thisportal')
          return
        }

        if (!this.pos.isNearTo(thisportal)) {
          this.goTo(thisportal.pos, 1)
        }
        else {
          // moveData 里的 shardmemory
          // 靠近后等待信息传送
          if (nextShardRoom.disShardName) {
            const requestData = {
              relateShard: nextShardRoom.disShardName,
              sourceShard: Game.shard.name,
              type: 1,
              data: { id: this.name, MemoryData: this.memory },
            }
            if (requestShard(requestData))
              this.moveTo(thisportal)
          }
          else {
            // 说明可能是本地星门
            this.moveTo(thisportal)
            // 更新 shardAffirm
            for (const nnr of this.memory.shardAffirm) {
              if (!nnr.affirm) {
                nnr.affirm = true
                break
              }
            }
          }
        }
      }
    }
  }

  /**
   * 多次跨 shard affirm 更新模块
   */
  public updateShardAffirm(): void {
    if (this.memory.shardAffirm) {
      for (const sr of this.memory.shardAffirm) {
        if (sr.disRoomName === this.pos.roomName && sr.shardName === Game.shard.name) {
          sr.affirm = true
          return
        }
      }
    }
  }

  /**
   * 主动防御寻路
   */
  @profileMethod()
  public findPathWhenDefend(target: RoomPosition, range: number): string|null {
    // 全局路线存储
    if (!global.routeCacheDefend)
      global.routeCacheDefend = {}

    if (!this.memory.moveData)
      this.memory.moveData = {}
    this.memory.moveData.index = 0

    const routeKey = `${this.standardizePos(this.pos)} ${this.standardizePos(target)}`
    // 路线查找
    const result = PathFinder.search(this.pos, { pos: target, range }, {
      plainCost: 3,
      swampCost: 10,
      maxOps: 600,
      roomCallback: (roomName) => {
        // 在全局绕过房间列表的房间 false
        if (Memory.bypassRooms && Memory.bypassRooms.includes(roomName))
          return false
        // 在爬虫记忆绕过房间列表的房间 false
        if (this.memory.bypassRooms && this.memory.bypassRooms.includes(roomName))
          return false

        const room = Game.rooms[roomName]
        // 没有视野的房间只观察地形
        if (!room)
          return null!

        // 有视野的房间
        const costs = new PathFinder.CostMatrix()

        // 设置主动防御范围
        if (room.name === this.memory.belong) {
          // 将房间边界设置为 255
          for (let x = 0; x < 50; x++) {
            costs.set(x, 0, 255)
            costs.set(x, 49, 255)
          }
          for (let y = 0; y < 50; y++) {
            costs.set(0, y, 255)
            costs.set(49, y, 255)
          }
        }

        // 将 rampart 设置为 1
        for (const ram of room.getStructureWithType(STRUCTURE_RAMPART)) {
          if (!ram.my)
            continue
          costs.set(ram.pos.x, ram.pos.y, 1)
        }

        // 将道路的 cost 设置为 2，无法行走的建筑设置为 255
        for (const struct of room.find(FIND_STRUCTURES)) {
          if (struct.structureType === STRUCTURE_ROAD)
            costs.set(struct.pos.x, struct.pos.y, 1)
          else if (struct.structureType !== STRUCTURE_CONTAINER
           && (struct.structureType !== STRUCTURE_RAMPART || !struct.my))
            costs.set(struct.pos.x, struct.pos.y, 0xFF)
        }
        for (const cons of room.find(FIND_MY_CONSTRUCTION_SITES)) {
          if (cons.structureType !== STRUCTURE_ROAD && cons.structureType !== STRUCTURE_RAMPART && cons.structureType !== STRUCTURE_CONTAINER)
            costs.set(cons.pos.x, cons.pos.y, 0xFF)
        }

        for (const creep of room.find(FIND_HOSTILE_CREEPS)) {
          if (havePart(creep, 'ranged_attack') && calcCreepAttackDamage(creep).ranged_attack > 1000) {
            for (let i = creep.pos.x - 3; i < creep.pos.x + 4; i++) {
              for (let j = creep.pos.y - 3; j < creep.pos.y + 4; j++) {
                if (i > 0 && i < 49 && j > 0 && j < 49) {
                  const nearpos = new RoomPosition(i, j, creep.room.name)
                  if (!nearpos.getStructure(STRUCTURE_RAMPART))
                    costs.set(i, j, 20)
                }
              }
            }
          }
        }

        // 防止撞到其他虫子造成堵虫
        for (const creep of room.find(FIND_HOSTILE_CREEPS))
          costs.set(creep.pos.x, creep.pos.y, 0xFF)
        for (const creep of room.find(FIND_MY_CREEPS)) {
          if (creep.memory.standed || (creep.memory.crossLevel && this.memory.crossLevel && creep.memory.crossLevel > this.memory.crossLevel))
            costs.set(creep.pos.x, creep.pos.y, 0xFF)
          else
            costs.set(creep.pos.x, creep.pos.y, 3)
        }

        return costs
      },
    })
    // 寻路异常返回 null
    if (result.path.length <= 0)
      return null

    // 寻路结果压缩
    const route = this.serializeFarPath(result.path)

    if (!result.incomplete)
      global.routeCacheDefend[routeKey] = route

    return route
  }

  /**
   * 主动防御移动
   */
  @profileMethod()
  public goToWhenDefend(target: RoomPosition, range = 1): CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_IN_RANGE | ERR_INVALID_TARGET {
    //  var a = Game.cpu.getUsed()
    if (this.memory.moveData === undefined)
      this.memory.moveData = {}

    this.memory.moveData.path = this.findPathWhenDefend(target, range) || undefined

    // 为空的话就是没有找到路径
    if (!this.memory.moveData.path) {
      delete this.memory.moveData.path
      return OK
    }

    // 使用缓存进行移动
    const goResult = this.goByPath()
    // 如果发生撞停或者参数异常，说明缓存可能存在问题，移除缓存
    if (goResult === ERR_INVALID_TARGET)
      delete this.memory.moveData

    else if (goResult !== OK && goResult !== ERR_TIRED)
      this.say(`异常码：${goResult}`)

    // var b = Game.cpu.getUsed()
    // this.say(`${b-a}`)
    return goResult
  }

  /**
   * 逃离寻路
   */
  @profileMethod()
  public fleeFrom(target: RoomPosition, range: number): void {
    const path = PathFinder.search(this.pos, { pos: target, range }, {
      plainCost: 1,
      swampCost: 20,
      maxOps: 600,
      flee: true,
      roomCallback: (roomName) => {
        // 在全局绕过房间列表的房间 false
        if (Memory.bypassRooms && Memory.bypassRooms.includes(roomName))
          return false

        const room = Game.rooms[roomName]
        // 没有视野的房间只观察地形
        if (!room)
          return null!

        // 有视野的房间
        const costs = new PathFinder.CostMatrix()

        // 将道路的 cost 设置为 1，无法行走的建筑设置为 255
        for (const struct of room.find(FIND_STRUCTURES)) {
          if (struct.structureType === STRUCTURE_ROAD)
            costs.set(struct.pos.x, struct.pos.y, 1)
          else if (struct.structureType !== STRUCTURE_CONTAINER
           && (struct.structureType !== STRUCTURE_RAMPART || !struct.my))
            costs.set(struct.pos.x, struct.pos.y, 0xFF)
        }
        for (const cons of room.find(FIND_MY_CONSTRUCTION_SITES)) {
          if (cons.structureType !== STRUCTURE_ROAD && cons.structureType !== STRUCTURE_RAMPART && cons.structureType !== STRUCTURE_CONTAINER)
            costs.set(cons.pos.x, cons.pos.y, 0xFF)
        }

        // 防止撞到其他虫子造成堵虫
        for (const creep of room.find(FIND_HOSTILE_CREEPS))
          costs.set(creep.pos.x, creep.pos.y, 0xFF)
        for (const creep of room.find(FIND_MY_CREEPS)) {
          if (creep.memory.standed || (creep.memory.crossLevel && this.memory.crossLevel && creep.memory.crossLevel > this.memory.crossLevel))
            costs.set(creep.pos.x, creep.pos.y, 0xFF)
          else
            costs.set(creep.pos.x, creep.pos.y, 3)
        }

        return costs
      },
    })

    const direction = this.pos.getDirectionTo(path.path[0])
    if (!direction)
      return

    this.move(direction)
  }

  /**
   * 一体机寻路
   */
  public findPathWhenAio(target: RoomPosition, range: number): string | null {
    // 全局路线存储
    if (!global.routeCacheAio)
      global.routeCacheAio = {}

    if (!this.memory.moveData)
      this.memory.moveData = {}
    this.memory.moveData.index = 0

    const routeKey = `${this.standardizePos(this.pos)} ${this.standardizePos(target)}`
    // 路线查找
    const result = PathFinder.search(this.pos, { pos: target, range }, {
      plainCost: 3,
      swampCost: 10,
      maxOps: 600,
      roomCallback: (roomName) => {
        // 在全局绕过房间列表的房间 false
        if (Memory.bypassRooms && Memory.bypassRooms.includes(roomName))
          return false
        // 在爬虫记忆绕过房间列表的房间 false
        if (this.memory.bypassRooms && this.memory.bypassRooms.includes(roomName))
          return false

        const room = Game.rooms[roomName]
        // 没有视野的房间只观察地形
        if (!room)
          return null!

        // 有视野的房间
        const costs = new PathFinder.CostMatrix()

        // 设置主动防御范围
        if (room.name === this.memory.belong) {
          // 将房间边界设置为 255
          for (let x = 0; x < 50; x++) {
            costs.set(x, 0, 255)
            costs.set(x, 49, 255)
          }
          for (let y = 0; y < 50; y++) {
            costs.set(0, y, 255)
            costs.set(49, y, 255)
          }
        }

        // 将 rampart 设置为 1
        for (const ram of room.getStructureWithType(STRUCTURE_RAMPART)) {
          if (!ram.my)
            continue
          costs.set(ram.pos.x, ram.pos.y, 1)
        }

        // 将道路的 cost 设置为 2，无法行走的建筑设置为 255
        for (const struct of room.find(FIND_STRUCTURES)) {
          if (struct.structureType === STRUCTURE_ROAD)
            costs.set(struct.pos.x, struct.pos.y, 1)
          else if (struct.structureType !== STRUCTURE_CONTAINER
           && (struct.structureType !== STRUCTURE_RAMPART || !struct.my))
            costs.set(struct.pos.x, struct.pos.y, 0xFF)
        }
        for (const cons of room.find(FIND_MY_CONSTRUCTION_SITES)) {
          if (cons.structureType !== STRUCTURE_ROAD && cons.structureType !== STRUCTURE_RAMPART && cons.structureType !== STRUCTURE_CONTAINER)
            costs.set(cons.pos.x, cons.pos.y, 0xFF)
        }

        for (const creep of room.find(FIND_HOSTILE_CREEPS)) {
          if (havePart(creep, 'attack')) {
            for (let i = creep.pos.x - 3; i < creep.pos.x + 4; i++) {
              for (let j = creep.pos.y - 3; j < creep.pos.y + 4; j++) {
                if (i > 0 && i < 49 && j > 0 && j < 49) {
                  // const nearpos = new RoomPosition(i, j, creep.room.name)
                  costs.set(i, j, 16)
                }
              }
            }
          }
          else if (havePart(creep, 'ranged_attack')) {
            for (let i = creep.pos.x - 3; i < creep.pos.x + 4; i++) {
              for (let j = creep.pos.y - 3; j < creep.pos.y + 4; j++) {
                if (i > 0 && i < 49 && j > 0 && j < 49) {
                  // const nearpos = new RoomPosition(i, j, creep.room.name)
                  costs.set(i, j, 15)
                }
              }
            }
          }
        }

        // 防止撞到其他虫子造成堵虫
        for (const creep of room.find(FIND_HOSTILE_CREEPS))
          costs.set(creep.pos.x, creep.pos.y, 0xFF)
        for (const creep of room.find(FIND_MY_CREEPS))
          costs.set(creep.pos.x, creep.pos.y, 0xFF)

        return costs
      },
    })
    // 寻路异常返回 null
    if (result.path.length <= 0)
      return null

    // 寻路结果压缩
    const route = this.serializeFarPath(result.path)

    if (!result.incomplete)
      global.routeCacheAio[routeKey] = route

    return route
  }

  /**
   * 一体机移动
   */
  public goToWhenAio(target: RoomPosition, range = 1): CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_IN_RANGE | ERR_INVALID_TARGET {
    //  var a = Game.cpu.getUsed()
    if (this.memory.moveData === undefined)
      this.memory.moveData = {}

    this.memory.moveData.path = this.findPathWhenAio(target, range) || undefined

    // 为空的话就是没有找到路径
    if (!this.memory.moveData.path) {
      delete this.memory.moveData.path
      return OK
    }

    // 使用缓存进行移动
    const goResult = this.goByPath()
    // 如果发生撞停或者参数异常，说明缓存可能存在问题，移除缓存
    if (goResult === ERR_INVALID_TARGET)
      delete this.memory.moveData

    else if (goResult !== OK && goResult !== ERR_TIRED)
      this.say(`异常码：${goResult}`)

    // var b = Game.cpu.getUsed()
    // this.say(`${b-a}`)
    return goResult
  }
}
