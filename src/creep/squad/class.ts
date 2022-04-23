import { calcCreepWarStat, getOppositeDirection } from '@/utils'

class SquadNoMemberError extends Error {
  constructor() {
    super('小队已经没有成员了')
  }
}
class SquadLackMemberError extends Error {
  constructor() {
    super('小队人数不足')
  }
}

/* 四人小队 */
export class SquadGroup {
  id: string

  constructor(id: string) {
    this.id = id
  }

  get memory() {
    return Memory.squadMemory[this.id]
  }

  set memory(data: SquadData) {
    Memory.squadMemory[this.id] = data
  }

  get creepIds() {
    return this.memory.creepIds
  }

  // [左上, 右上, 右下, 左下]
  get creeps() {
    return this.memory.creepIds.map(Game.getObjectById) as [Creep | null, Creep | null, Creep | null, Creep | null]
  }

  public isFull() {
    return this.creeps.every(Boolean)
  }

  get creepsAssert() {
    return this.creeps.map((creep) => {
      if (!creep)
        throw new SquadLackMemberError()
      return creep
    }) as [Creep, Creep, Creep, Creep]
  }

  get creepsAvailable() {
    return this.creeps.filter(Boolean) as Creep[]
  }

  get pos() {
    const creeps = this.creeps
    if (creeps[0])
      return creeps[0].pos
    if (creeps[1])
      return new RoomPosition(creeps[1].pos.x - 1, creeps[1].pos.y, creeps[1].pos.roomName)
    if (creeps[2])
      return new RoomPosition(creeps[2].pos.x - 1, creeps[2].pos.y - 1, creeps[2].pos.roomName)
    if (creeps[3])
      return new RoomPosition(creeps[3].pos.x, creeps[3].pos.y - 1, creeps[3].pos.roomName)
    throw new SquadNoMemberError()
  }

  public nearToCount(target: RoomPosition) {
    return this.creepsAvailable.filter(creep => creep.pos.isNearTo(target)).length
  }

  public isNearTo(target: RoomPosition) {
    return this.nearToCount(target) > 1
  }

  public getDirectionTo(target: RoomPosition) {
    const creeps = this.creepsAvailable
    if (creeps.length !== 4)
      return null

    if (target.isNearTo(creeps[0].pos) && target.isNearTo(creeps[1].pos))
      return TOP
    if (target.isNearTo(creeps[1].pos) && target.isNearTo(creeps[2].pos))
      return RIGHT
    if (target.isNearTo(creeps[2].pos) && target.isNearTo(creeps[3].pos))
      return BOTTOM
    if (target.isNearTo(creeps[3].pos) && target.isNearTo(creeps[0].pos))
      return LEFT

    return null
  }

  get attackDirection() {
    const creeps = this.creepsAvailable
    if (creeps.length !== 4)
      return null

    const canAttack = creeps.map(creep => creep.memory.creepType === 'attack')

    if (canAttack[0] && canAttack[1])
      return TOP
    if (canAttack[1] && canAttack[2])
      return RIGHT
    if (canAttack[2] && canAttack[3])
      return BOTTOM
    if (canAttack[3] && canAttack[0])
      return LEFT

    return null
  }

  get attackDirectionAssert() {
    const dir = this.attackDirection
    if (!dir)
      throw new SquadLackMemberError()
    return dir
  }

  public rotateClockwise() {
    const creepsAvailable = this.creepsAvailable
    if (!creepsAvailable.some(creep => creep.fatigue > 0))
      return ERR_TIRED
    if (!creepsAvailable.some(creep => !creep.getActiveBodyparts(MOVE)))
      return ERR_NO_BODYPART

    const creeps = this.creeps
    if (creeps[0])
      creeps[0].move(RIGHT)
    if (creeps[1])
      creeps[1].move(BOTTOM)
    if (creeps[2])
      creeps[2].move(LEFT)
    if (creeps[3])
      creeps[3].move(TOP)

    const creepIds = this.creepIds
    const newCreepIds = [
      creepIds[1],
      creepIds[2],
      creepIds[3],
      creepIds[0],
    ] as SquadGroupIds
    this.memory.creepIds = newCreepIds

    return OK
  }

  public rotateCounterClockwise() {
    const creepsAvailable = this.creepsAvailable
    if (!creepsAvailable.some(creep => creep.fatigue > 0))
      return ERR_TIRED
    if (!creepsAvailable.some(creep => !creep.getActiveBodyparts(MOVE)))
      return ERR_NO_BODYPART

    const creeps = this.creeps
    if (creeps[0])
      creeps[0].move(BOTTOM)
    if (creeps[1])
      creeps[1].move(LEFT)
    if (creeps[2])
      creeps[2].move(TOP)
    if (creeps[3])
      creeps[3].move(RIGHT)

    const creepIds = this.creepIds
    const newCreepIds = [
      creepIds[3],
      creepIds[0],
      creepIds[1],
      creepIds[2],
    ] as SquadGroupIds
    this.memory.creepIds = newCreepIds

    return OK
  }

  public cross() {
    const creepsAvailable = this.creepsAvailable
    if (!creepsAvailable.some(creep => creep.fatigue > 0))
      return ERR_TIRED
    if (!creepsAvailable.some(creep => !creep.getActiveBodyparts(MOVE)))
      return ERR_NO_BODYPART

    const creeps = this.creeps
    if (creeps[0])
      creeps[0].move(BOTTOM_RIGHT)
    if (creeps[1])
      creeps[1].move(BOTTOM_LEFT)
    if (creeps[2])
      creeps[2].move(TOP_LEFT)
    if (creeps[3])
      creeps[3].move(TOP_RIGHT)

    const creepIds = this.creepIds
    const newCreepIds = [
      creepIds[2],
      creepIds[3],
      creepIds[1],
      creepIds[0],
    ] as SquadGroupIds
    this.memory.creepIds = newCreepIds

    return OK
  }

  public rotateAttackDirectionTo(target: RoomPosition, moveToTarget = false) {
    const attackDirection = this.attackDirectionAssert
    const targetDirection = this.getDirectionTo(target)
    if (!targetDirection) {
      if (moveToTarget)
        this.moveTo(target, { range: 1 })
      else return ERR_NOT_IN_RANGE
    }

    if (attackDirection === targetDirection)
      return OK

    if (attackDirection - 2 === targetDirection || (attackDirection === TOP && targetDirection === LEFT))
      return this.rotateCounterClockwise()
    if (attackDirection + 2 === targetDirection || (attackDirection === LEFT && targetDirection === TOP))
      return this.rotateClockwise()
    if (getOppositeDirection(attackDirection) === targetDirection)
      return this.cross()

    return ERR_INVALID_TARGET
  }

  public moveTo(target: RoomPosition, options: {
    range?: number
    ignoreFatigue?: boolean
    ignoreNoMoveParts?: boolean
  } = {}) {
    const {
      range = 0,
      ignoreFatigue,
      ignoreNoMoveParts,
    } = options

    const thisCreeps = this.creepsAvailable
    const thisPos = this.pos

    if (!ignoreFatigue && thisCreeps.some(creep => creep.fatigue > 0))
      return ERR_TIRED

    if (!ignoreNoMoveParts && thisCreeps.some(creep => !creep.getActiveBodyparts(MOVE)))
      return ERR_NO_BODYPART

    if (range <= 1) {
      const nearToCount = this.nearToCount(target)
      if (nearToCount >= 2) {
        return OK
      }
      else if (nearToCount === 1) {
        const nearToCreep = this.creepsAvailable.find(creep => creep.pos.isNearTo(target))!
        const dir = nearToCreep.pos.getDirectionTo(target)

        let moveDirection = null
        if (dir === TOP_LEFT || dir === TOP_RIGHT) {
          const top1 = new RoomPosition(thisPos.x, thisPos.y - 1, thisPos.roomName)
          const top2 = new RoomPosition(thisPos.x + 1, thisPos.y - 1, thisPos.roomName)
          if (top1.isWalkable() && top2.isWalkable)
            moveDirection = TOP
        }
        if (!moveDirection && (dir === TOP_RIGHT || dir === BOTTOM_RIGHT)) {
          const right1 = new RoomPosition(thisPos.x + 1, thisPos.y, thisPos.roomName)
          const right2 = new RoomPosition(thisPos.x + 1, thisPos.y + 1, thisPos.roomName)
          if (right1.isWalkable() && right2.isWalkable)
            moveDirection = RIGHT
        }
        if (!moveDirection && (dir === BOTTOM_RIGHT || dir === BOTTOM_LEFT)) {
          const bottom1 = new RoomPosition(thisPos.x, thisPos.y + 1, thisPos.roomName)
          const bottom2 = new RoomPosition(thisPos.x - 1, thisPos.y + 1, thisPos.roomName)
          if (bottom1.isWalkable() && bottom2.isWalkable)
            moveDirection = BOTTOM
        }
        if (!moveDirection && (dir === BOTTOM_LEFT || dir === TOP_LEFT)) {
          const left1 = new RoomPosition(thisPos.x - 1, thisPos.y, thisPos.roomName)
          const left2 = new RoomPosition(thisPos.x - 1, thisPos.y - 1, thisPos.roomName)
          if (left1.isWalkable() && left2.isWalkable)
            moveDirection = LEFT
        }

        if (moveDirection) {
          for (const creep of thisCreeps)
            creep.move(moveDirection)
          return OK
        }
        else {
          return ERR_NO_PATH
        }
      }
    }

    const fullPathResult = PathFinder.search(thisPos, { pos: target, range }, {
      plainCost: 2,
      swampCost: 10,
      maxOps: 4000,
      roomCallback: (roomName) => {
        // 在绕过房间列表的房间直接不让走
        if (Memory.bypassRooms?.includes(roomName))
          return false

        const costs = new PathFinder.CostMatrix()

        const terrian = new Room.Terrain(roomName)
        // 第一层设置沼泽
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            if (terrian.get(x, y) === TERRAIN_MASK_SWAMP) {
              costs.set(x, y, 10)
              if (x > 2)
                costs.set(x - 1, y, 10)
              if (y > 2)
                costs.set(x, y - 1, 10)
              if (x > 2 && y > 2)
                costs.set(x - 1, y - 1, 10)
            }
          }
        }
        // 第二层设置墙壁
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            if (terrian.get(x, y) === TERRAIN_MASK_WALL) {
              costs.set(x, y, 0xFF)
              if (x > 2)
                costs.set(x - 1, y, 0xFF)
              if (y > 2)
                costs.set(x, y - 1, 0xFF)
              if (x > 2 && y > 2)
                costs.set(x - 1, y - 1, 0xFF)
            }
          }
        }

        // 没有视野就跳过
        const room = Game.rooms[roomName]
        if (!room)
          return costs

        // 忽略所有建筑
        for (const struct of room.find(FIND_STRUCTURES)) {
          if (struct.structureType === STRUCTURE_CONTAINER
           || struct.structureType === STRUCTURE_ROAD
           || (struct.structureType === STRUCTURE_RAMPART && struct.my))
            continue
          costs.set(struct.pos.x, struct.pos.y, 0xFF)
          costs.set(struct.pos.x - 1, struct.pos.y, 0xFF)
          costs.set(struct.pos.x, struct.pos.y - 1, 0xFF)
          costs.set(struct.pos.x - 1, struct.pos.y - 1, 0xFF)
        }

        // 忽略不是组员的所有爬
        for (const creep of room.find(FIND_CREEPS)) {
          if (thisCreeps.includes(creep))
            continue
          costs.set(creep.pos.x, creep.pos.y, 0xFF)
          if (creep.pos.x > 2)
            costs.set(creep.pos.x - 1, creep.pos.y, 0xFF)
          if (creep.pos.y > 2)
            costs.set(creep.pos.x, creep.pos.y - 1, 0xFF)
          if (creep.pos.x > 2 && creep.pos.y > 2)
            costs.set(creep.pos.x - 1, creep.pos.y - 1, 0xFF)
        }

        return costs
      },
    })

    const nextPos = fullPathResult.path[0]
    if (nextPos) {
      const nextDirection = thisPos.getDirectionTo(nextPos)
      for (const creep of thisCreeps)
        creep.move(nextDirection)
    }
    else {
      return ERR_NO_PATH
    }

    return OK
  }

  public attack(target: Creep | PowerCreep | Structure) {
    const attackCreeps = this.creepsAvailable.filter(creep => creep.memory.creepType === 'attack' && creep.getActiveBodyparts(ATTACK) > 0)
    for (const creep of attackCreeps)
      creep.attack(target)
  }

  public rangedAttack(target: Creep | PowerCreep | Structure) {
    const rangedAttackCreeps = this.creepsAvailable.filter(creep => creep.memory.creepType === 'attack' && creep.getActiveBodyparts(RANGED_ATTACK) > 0)
    for (const creep of rangedAttackCreeps)
      creep.rangedAttack(target)
  }

  public rangedMassAttack() {
    const rangedAttackCreeps = this.creepsAvailable.filter(creep => creep.memory.creepType === 'attack' && creep.getActiveBodyparts(RANGED_ATTACK) > 0)
    for (const creep of rangedAttackCreeps)
      creep.rangedMassAttack()
  }

  public healGroup() {
    const creeps = this.creepsAvailable
    const healCreeps = creeps
      .filter(creep => creep.memory.creepType === 'heal')
      .map(creep => ({
        creep,
        ...calcCreepWarStat(creep),
      }))
      .sort((a, b) => b.heal - a.heal)

    const creepsByLeastHits = creeps
      .filter(creep => creep.hits < creep.hitsMax)
      .map(creep => ({
        creep,
        needs: creep.hitsMax - creep.hits,
      }))

    while (creepsByLeastHits.length && healCreeps.length) {
      creepsByLeastHits.sort((a, b) => b.needs - a.needs)

      const target = creepsByLeastHits.shift()!
      const healCreep = healCreeps.shift()!

      healCreep.creep.heal(target.creep)
      target.needs -= healCreep.heal

      if (target.needs > 0)
        creepsByLeastHits.push(target)
    }

    // 没有要治疗的就治疗攻击爬
    if (healCreeps.length) {
      const attackCreeps = creeps.filter(creep => creep.memory.creepType === 'attack')
      while (healCreeps.length && attackCreeps.length) {
        const attackCreep = attackCreeps.shift()!
        const healCreep = healCreeps.shift()!
        healCreep.creep.heal(attackCreep)
      }
    }

    // 攻击爬也可以治疗
    const attackCreeps = creeps.filter(creep => creep.memory.creepType === 'attack')
    for (const creep of attackCreeps)
      creep.heal(creep)
  }

  // TODO 想了想，写的有点太通用了，以后重构下把所有爬都扔进这个函数处理好了
  // public attackSurrounding() {
  //   const creeps = this.creepsAvailable
  //   const attackTypeCreeps = creeps
  //     .filter(creep => creep.memory.creepType === 'attack')
  //     .map(creep => ({
  //       creep,
  //       ...calcCreepWarStat(creep),
  //     }))

  //   let targetCreeps = attackTypeCreeps[0].creep.room.find(FIND_HOSTILE_CREEPS)
  //     .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
  //     .map((creep) => {
  //       const stats = calcCreepWarStat(creep)
  //       return {
  //         creep,
  //         ...stats,
  //         hitsWithHeal: creep.hits + stats.heal,
  //         possiableDamage: {} as Record<string, number>,
  //       }
  //     })
  //     .sort((a, b) => a.hitsWithHeal - b.hitsWithHeal)

  //   if (targetCreeps.length) {
  //     const rangedAttackCreeps = attackTypeCreeps.filter(creep => creep.creep.getActiveBodyparts(RANGED_ATTACK) > 0)
  //     for (const rangedAttackCreep of rangedAttackCreeps) {
  //       // 如果有相邻的爬就用 rangedMassAttack
  //       if (targetCreeps.some(target => rangedAttackCreep.creep.pos.isNearTo(target.creep)
  //        // mass 对 ram 不生效
  //        && !target.creep.pos.getStructure(STRUCTURE_RAMPART))) {
  //         rangedAttackCreep.creep.rangedMassAttack()
  //         targetCreeps = targetCreeps
  //           .map(target => ({
  //             ...target,
  //             hitsWithHeal: target.hitsWithHeal - rangedAttackCreep.creep.calcRangedMassAttackDamage(target.creep),
  //           }))
  //           .sort((a, b) => a.hitsWithHeal - b.hitsWithHeal)
  //         rangedAttackCreeps.splice(rangedAttackCreeps.indexOf(rangedAttackCreep), 1)
  //       }
  //       // 计算可能的伤害
  //       else {
  //         for (const target of targetCreeps) {
  //           if (!rangedAttackCreep.creep.pos.inRangeTo(target.creep, 3))
  //             continue
  //           target.possiableDamage[`${rangedAttackCreep.creep.id}.rangedAttack`] = rangedAttackCreep.ranged_attack
  //         }
  //       }
  //     }

  //     const attackCreeps = attackTypeCreeps.filter(creep => creep.creep.getActiveBodyparts(ATTACK) > 0)
  //     for (const attackCreep of attackCreeps) {
  //       // 计算可能的伤害
  //       for (const target of targetCreeps) {
  //         if (!attackCreep.creep.pos.isNearTo(target.creep))
  //           continue
  //         target.possiableDamage[`${attackCreep.creep.id}.attack`] = attackCreep.attack
  //       }
  //     }
  //   }
  // }
}
