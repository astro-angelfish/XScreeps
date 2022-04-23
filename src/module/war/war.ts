import { calcCreepWarStat } from '../fun/funtion'

// TODO 重写这个模块，重复太多了

/* 战争相关 "基础设施" */

/* -------------------------------战争信息获取及更新区------------------------------------ */
/**
 * 获取所有房间内的敌对爬虫
 */
export function getAllEnemy(room: Room): Creep[] {
  return room.find(FIND_HOSTILE_CREEPS)
    .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
}

/**
 * 获取所有房间内的旗帜
 */
export function getAllFlag(room: Room): Flag[] {
  const flag = room.find(FIND_FLAGS)
  return flag
}

type WarAllStructs = NarrowStructure<Exclude<AnyStructure['structureType'], 'road' | 'container' | 'controller'>>[]
/**
 * 获取所有房间内的建筑 不包含road controller container
 */
export function getAllStructures(room: Room): WarAllStructs {
  const structues = room.find(FIND_STRUCTURES)
    .filter(struct => struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTROLLER)
  return structues as WarAllStructs
}

/**
 * 返回分类建筑对象
 */
export function classifyStructure(stru: Structure[]): StructureData {
  if (stru.length <= 0)
    return {}

  const result: StructureData = {}
  for (const i of stru) {
    if (!result[i.structureType])
      result[i.structureType] = []
    result[i.structureType].push(i)
  }
  return result
}

// 获取房间内的防御塔数据
export function getTowerData(room: Room): TowerRangeMapData {
  if (!room)
    return {}

  const towers = room.getStructureWithType(STRUCTURE_TOWER)
  if (towers.length <= 0)
    return {}

  const terrianData = room.getTerrain()
  const tempData: TowerRangeMapData = {}
  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
      const thisPos = new RoomPosition(i, j, room.name)

      // 0 平原 1 墙壁 2 沼泽
      if (terrianData.get(i, j) === 1)
        continue

      const tempNum: ARH = { attack: 0, heal: 0, repair: 0 }
      for (const t of towers) {
        // 伤害计算叠加
        thisPos.calcTowerRangeData(t, tempNum)
      }
      tempData[`${thisPos.x}/${thisPos.y}`] = tempNum
    }
  }
  return tempData
}

/**
 * 更新敌对爬虫列表 每tick更新1次
 */
export function updateWarEnemy(room: Room): void {
  if (!room)
    return

  if (!global.warData.enemy)
    global.warData.enemy = {}
  if (!global.warData.enemy[room.name])
    global.warData.enemy[room.name] = { time: Game.time, data: getAllEnemy(room) }

  // 跳过
  if (Game.time === global.warData.enemy[room.name].time)
    return

  // 说明数据过时了，更新数据
  global.warData.enemy[room.name].time = Game.time
  global.warData.enemy[room.name].data = getAllEnemy(room)
}

/**
 * 更新建筑物列表 将建筑物分类 每tick更新1次
 */
export function updateWarStructures(room: Room): void {
  if (!room)
    return

  if (!global.warData.structure)
    global.warData.structure = {}
  if (!global.warData.structure[room.name])
    global.warData.structure[room.name] = { time: Game.time, data: classifyStructure(getAllStructures(room)) }

  // 跳过
  if (Game.time === global.warData.structure[room.name].time)
    return

  // 说明数据过时了，更新数据
  global.warData.structure[room.name].time = Game.time
  global.warData.structure[room.name].data = classifyStructure(getAllStructures(room))
}

/**
 * 更新旗帜列表 每tick更新1次
 */
export function updateWarFlags(room: Room): void {
  if (!room)
    return

  if (!global.warData.flag)
    global.warData.flag = {}
  if (!global.warData.flag[room.name])
    global.warData.flag[room.name] = { time: Game.time, data: getAllFlag(room) }

  // 跳过
  if (Game.time === global.warData.flag[room.name].time)
    return

  // 说明数据过时了，更新数据
  global.warData.flag[room.name].time = Game.time
  global.warData.flag[room.name].data = getAllFlag(room)
}

/**
 * 更新塔伤数据  非每tick刷新 检测到建筑物中tower数量变化才会进行更新
 */
export function updateWarTowerData(room: Room): void {
  if (!room)
    return

  if (!global.warData.tower)
    global.warData.tower = {}
  if (!global.warData.tower[room.name])
    global.warData.tower[room.name] = { count: 0, data: {} }

  if (!global.warData.structure || !global.warData.structure[room.name])
    return
  if (!global.warData.structure[room.name].data || !global.warData.structure[room.name].data.tower)
    return

  const length = global.warData.structure[room.name].data.tower.length
  if (length !== global.warData.tower[room.name].count) {
    global.warData.tower[room.name].count = length
    global.warData.tower[room.name].data = getTowerData(room)
  }
}

/**
 * 战争信息初始化及更新
 * 所有参与战争的爬虫，在进入目标房间后，应该运行该函数
 * */
export function initWarData(room: Room): void {
  if (!global.warData)
    global.warData = {}
  updateWarEnemy(room)
  updateWarStructures(room)
  updateWarFlags(room)
  updateWarTowerData(room)
}

/* -------------------------------战争信息二次加工区------------------------------------ */

/**
 * 寻找离自己最近的爬虫 path attck为true会搜寻带有攻击部件的爬虫 ram为true会搜寻所在位置没有rampart的爬虫
 */
export function findClosestCreepByPath(pos: RoomPosition, creeps: Creep[], attack?: boolean, ram?: boolean): Creep | null {
  return pos.findClosestByPath(
    creeps.filter(creep => (!attack || (creep.getActiveBodyparts('attack') || creep.getActiveBodyparts('ranged_attack')))
     && (ram ? !creep.pos.getStructure('rampart') : true)
     && !creep.my))
}

/**
 * 寻找离自己最近的爬虫 range attck为true会搜寻带有攻击部件的爬虫 ram为true会搜寻所在位置没有rampart的爬虫
 */
export function findClosestCreepByRange(pos: RoomPosition, creeps: Creep[], attack?: boolean, ram?: boolean): Creep | null {
  return pos.findClosestByRange(
    creeps.filter(creep => (!attack || (creep.getActiveBodyparts('attack') || creep.getActiveBodyparts('ranged_attack')))
     && (ram ? !creep.pos.getStructure('rampart') : true)
     && !creep.my))
}

/**
 * 寻找范围内的爬虫
 */
export function findCreepsInRange(pos: RoomPosition, creeps: Creep[], range: number, attack?: boolean, ram?: boolean): Creep[] {
  return pos.findInRange(
    creeps.filter(creep => (!attack || (creep.getActiveBodyparts('attack') || creep.getActiveBodyparts('ranged_attack')))
     && (ram ? !creep.pos.getStructure('rampart') : true)
     && !creep.my), range)
}

/**
 * 寻找离自己最近的旗帜 path name代表旗帜开始的字符 attack为true代表除去旗帜附近range格有攻击性爬虫的旗帜
 */
export function findClosestFlagByPath(pos: RoomPosition, flags: Flag[], name: string, attack?: boolean, range?: number): Flag | null {
  if (attack) {
    if (!Game.rooms[pos.roomName])
      return null
    if (global.warData.enemy[pos.roomName].time !== Game.time)
      return null

    const creeps = global.warData.enemy[pos.roomName].data
    return pos.findClosestByPath(
      flags.filter(flag => flag.name.startsWith(name)
       && findCreepsInRange(flag.pos, creeps, range || 3, true).length <= 0))
  }

  return pos.findClosestByPath(flags.filter(flag => flag.name.startsWith(name)))
}

/**
 * 寻找离自己最近的建筑 path wall true代表排除wall rampart true代表排除rampart  attack代表不靠近攻击爬虫的
 */
export function findClosestStructureByPath(pos: RoomPosition, wall?: boolean, ram?: boolean, attack?: boolean, range?: number): Structure | null {
  if (!Game.rooms[pos.roomName])
    return null

  let structures = Game.rooms[pos.roomName].find(FIND_STRUCTURES)
    .filter(struct => struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_CONTROLLER)
  if (wall)
    structures = structures.filter(struct => struct.structureType !== STRUCTURE_WALL)
  if (ram)
    structures = structures.filter(struct => struct.structureType !== STRUCTURE_RAMPART && !struct.pos.getStructure(STRUCTURE_RAMPART))

  if (!attack)
    return pos.findClosestByPath(structures)

  if (global.warData.enemy[pos.roomName].time !== Game.time)
    return null

  const creeps = global.warData.enemy[pos.roomName].data
  const result = pos.findClosestByPath(structures.filter(struct => findCreepsInRange(struct.pos, creeps, range || 5, true).length <= 0))
  return result
}

/**
 * 判断是否抵抗的住爬虫的攻击<只适用于单个爬虫>  敌方爬虫 自己的爬虫 防御塔数据(敌方)  返回true代表不会破防
 */
export function canSustain(creeps: Creep[], mycreep: Creep, towerData?: number): boolean {
  if (creeps.length <= 0)
    return true

  const bodyData = calcCreepWarStat(mycreep)

  // 确定 boost 类型
  const toughNum = mycreep.getActiveBodyparts('tough')
  const toughBoostType = mycreep.body.find(part => part.type === TOUGH)?.boost

  const myhealData = bodyData.heal
  let hurtData = 0
  // 计算敌方伤害 hurtData是总伤害
  for (const c of creeps) {
    if (c.name === mycreep.name)
      continue

    const enData = calcCreepWarStat(c)
    hurtData += Math.max(enData.attack, enData.ranged_attack)
  }
  if (towerData)
    hurtData += towerData

  // mycreep.say(`${hurtData}`)

  // 判断总伤害能否破防
  if (toughNum <= 0)
    return hurtData <= myhealData

  if (!toughBoostType) {
    if (hurtData > myhealData)
      return false
  }

  else if (toughBoostType === 'GO') {
    const hurt = hurtData / 2
    if (hurt <= toughNum * 100) {
      if (hurt > myhealData)
        return false
    }
    else {
      const superfluous = (hurt - toughNum * 100) * 2
      if (hurt + superfluous > myhealData)
        return false
    }
  }

  else if (toughBoostType === 'GHO2') {
    const hurt = hurtData / 3
    if (hurt <= toughNum * 100) {
      if (hurt > myhealData)
        return false
    }
    else {
      const superfluous = (hurt - toughNum * 100) * 3
      if (hurt + superfluous > myhealData)
        return false
    }
  }

  else if (toughBoostType === 'XGHO2') {
    const hurt = hurtData / 4
    if (hurt <= toughNum * 100) {
      if (hurt > myhealData)
        return false
    }
    else {
      const superfluous = (hurt - toughNum * 100) * 4
      if (hurt + superfluous > myhealData)
        return false
    }
  }

  return true
}
