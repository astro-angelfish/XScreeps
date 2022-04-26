/**
 * 判断爬虫是否是值得防御的目标
 */
export function deserveDefend(creep: Creep): boolean {
  for (const b of creep.body) {
    if (typeof b.boost === 'string' && ['XGHO2', 'XKHO2', 'XUHO2', 'XZH2O'].includes(b.boost))
      return true
  }
  return false
}

/**
 * 判断爬虫是否有某类型部件
 */
export function havePart(creep: Creep, type: BodyPartConstant): boolean {
  for (const b of creep.body) {
    if (b.type === type)
      return true
  }
  return false
}

/**
 * 爬虫攻击部件数据
 */
export function calcCreepAttackDamage(creep: Creep): {
  attack: number
  ranged_attack: number
} {
  const result = { attack: 0, ranged_attack: 0 }

  for (const i of creep.body) {
    if (i.type === 'attack') {
      if (!i.boost)
        result.attack += 30
      else if (i.boost === 'UH')
        result.attack += 60
      else if (i.boost === 'UH2O')
        result.attack += 90
      else if (i.boost === 'XUH2O')
        result.attack += 120
    }

    else if (i.type === 'ranged_attack') {
      if (!i.boost)
        result.ranged_attack += 10
      else if (i.boost === 'KO')
        result.ranged_attack += 20
      else if (i.boost === 'KHO2')
        result.ranged_attack += 30
      else if (i.boost === 'XKHO2')
        result.ranged_attack += 40
    }
  }

  return result
}

/**
 * 爬虫攻击数据
 */
export function calcCreepWarStat(creep: Creep): {
  attack: number
  ranged_attack: number
  heal: number
  tough: number
} {
  // 其中 tough 是抵抗的伤害值
  const result = { attack: 0, ranged_attack: 0, heal: 0, tough: 0 }

  for (const i of creep.body) {
    if (i.type === 'heal') {
      if (!i.boost)
        result.heal += 12
      else if (i.boost === 'LO')
        result.heal += 24
      else if (i.boost === 'LHO2')
        result.heal += 36
      else if (i.boost === 'XLHO2')
        result.heal += 48
    }

    if (i.type === 'attack') {
      if (!i.boost)
        result.attack += 30
      else if (i.boost === 'UH')
        result.attack += 60
      else if (i.boost === 'UH2O')
        result.attack += 90
      else if (i.boost === 'XUH2O')
        result.attack += 120
    }

    else if (i.type === 'ranged_attack') {
      if (!i.boost)
        result.ranged_attack += 10
      else if (i.boost === 'KO')
        result.ranged_attack += 20
      else if (i.boost === 'KHO2')
        result.ranged_attack += 30
      else if (i.boost === 'XKHO2')
        result.ranged_attack += 40
    }

    else if (i.type === 'tough') {
      if (!i.boost)
        result.tough += 100
      else if (i.boost === 'GO')
        result.tough += 200
      else if (i.boost === 'GHO2')
        result.tough += 300
      else if (i.boost === 'XGHO2')
        result.tough += 400
    }
  }

  return result
}

/**
 * 寻找后一级的爬
 */
export function findNextQuarter(creep: Creep): string | undefined {
  if (!creep.memory.squad)
    return

  for (const i in creep.memory.squad) {
    if (creep.memory.squad[i].index - creep.memory.squad[creep.name].index === 1)
      return i
  }
}

/**
 * 判断是否可以组队了
 * 需要一个方块的位置都没有墙壁，而且坐标需要 2 -> 47
 */
export function identifyGarrison(creep: Creep): boolean {
  if (creep.pos.x > 47 || creep.pos.x < 2 || creep.pos.y > 47 || creep.pos.y < 2)
    return false

  for (let i = creep.pos.x; i < creep.pos.x + 2; i++) {
    for (let j = creep.pos.y; j < creep.pos.y + 2; j++) {
      const thisPos = new RoomPosition(i, j, creep.room.name)
      if (thisPos.lookFor(LOOK_TERRAIN)[0] === 'wall')
        return false

      if (thisPos.getStructureWithTypes(['spawn', 'constructedWall', 'rampart', 'observer', 'link', 'nuker', 'storage', 'tower', 'terminal', 'powerSpawn', 'extension']).length > 0)
        return false
    }
  }

  return true
}

/**
 * 寻找前一级的爬 四人小队用
 */
export function findFollowQuarter(creep: Creep): string | undefined {
  if (!creep.memory.squad)
    return

  for (const i in creep.memory.squad) {
    if (creep.memory.squad[creep.name].index - creep.memory.squad[i].index === 1)
      return i
  }
}
