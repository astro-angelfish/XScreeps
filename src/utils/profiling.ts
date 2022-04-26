import { colorfyLog } from './log'

function colorfyTime(time: number) {
  const text = `${(time * 1000).toFixed(2)}μs`
  if (time < 0.2)
    return colorfyLog(text, 'green')
  else if (time < 0.5)
    return colorfyLog(text, 'yellow')
  else if (time < 1)
    return colorfyLog(text, 'orange')
  else
    return colorfyLog(text, 'red')
}

function formatTime(ms: number) {
  return colorfyLog(`${(ms * 1000).toFixed(1)}μs`, 'sky')
}

interface StackItem {
  id: number
  time: number
  action: number
}
interface TableItem {
  id: number
  stackLength: number
  time: number
  action: number
}

class Profiler {
  startTime: number
  profilerTime = 0

  nameToIdMap: Map<string, number> = new Map()
  idToNameMap: Map<number, string> = new Map()
  maxId = 0

  stack: StackItem[] = []
  table: TableItem[][] = [[]]

  constructor() {
    this.startTime = Game.cpu.getUsed()
  }

  reset() {
    this.startTime = Game.cpu.getUsed()
    this.profilerTime = 0

    this.nameToIdMap.clear()
    this.idToNameMap.clear()
    this.maxId = 0

    this.stack.length = 0
    this.table = [[]]
  }

  private register(name: string) {
    if (this.nameToIdMap.has(name)) {
      return this.nameToIdMap.get(name)!
    }
    else {
      this.maxId++
      this.nameToIdMap.set(name, this.maxId)
      this.idToNameMap.set(this.maxId, name)
      return this.maxId
    }
  }

  enter(name: string) {
    if (!import.meta.env.PROFILER)
      return
    const beginTime = Game.cpu.getUsed()

    const id = this.register(name)
    const item = {
      id,
      time: Game.cpu.getUsed(),
      action: 0,
    }
    this.stack.push(item)
    this.table.push([])

    const time = Game.cpu.getUsed() - beginTime
    this.profilerTime += time
    item.time += time

    return item
  }

  enterId(id: number) {
    if (!import.meta.env.PROFILER)
      return
    const beginTime = Game.cpu.getUsed()

    const item = {
      id,
      time: Game.cpu.getUsed(),
      action: 0,
    }
    this.stack.push(item)
    this.table.push([])

    const time = Game.cpu.getUsed() - beginTime
    this.profilerTime += time
    item.time += time

    return item
  }

  countAction(name: string) {
    const id = this.register(name)
    const item = this.stack[this.stack.length - 1]
    if (item)
      item.action++
    this.table[this.table.length - 1].push({
      id,
      stackLength: this.stack.length + 1,
      time: 0.2,
      action: 0,
    })
  }

  exit(item?: StackItem) {
    if (!import.meta.env.PROFILER || !this.stack.length || !this.table.length)
      return
    const beginTime = Game.cpu.getUsed()

    let tableItems: TableItem[]
    if (item) {
      const index = this.stack.lastIndexOf(item)
      if (index === -1)
        return
      this.stack.splice(index)
      tableItems = this.table.splice(index + 1)[0]
    }
    else {
      item = this.stack.pop()!
      tableItems = this.table.pop()!
    }
    const action = tableItems.reduce((sum, item) => item.stackLength === this.stack.length + 2 ? sum + item.action : sum, item.action)
    const tableItem = {
      id: item.id,
      stackLength: this.stack.length + 1,
      time: Game.cpu.getUsed() - item.time - action * 0.2,
      action,
    }
    this.table[this.table.length - 1].push(tableItem, ...tableItems)

    const time = Game.cpu.getUsed() - beginTime
    this.profilerTime += time
    tableItem.time = Math.max(tableItem.time - time, 0)
  }

  log() {
    if (!import.meta.env.PROFILER)
      return

    const scriptUsed = Game.cpu.getUsed() - this.startTime
    const logTime = Game.cpu.getUsed()

    if (this.stack.length)
      for (let i = 0; i < this.stack.length; i++) this.exit()

    const colorfyItem = (item: TableItem) => {
      const time = item.time
      return `${item.action > 0 ? `${colorfyTime(time)} + ${colorfyLog(`${item.action}`, 'cyan')} 固定消耗 = ${colorfyTime(time + item.action * 0.2)}` : colorfyTime(time)} ${((time / scriptUsed) * 100).toFixed(2)}%`
    }

    const logs = []
    let logicTime = 0
    let actions = 0
    for (const item of this.table[0]) {
      const name = this.idToNameMap.get(item.id)
      if (!name)
        continue
      if (item.stackLength === 1) {
        logicTime += item.time
        actions += item.action
      }
      logs.push(`${'  '.repeat(item.stackLength)}- ${name} ${colorfyItem(item)}`)
    }

    const totalUsed = Game.cpu.getUsed() - this.startTime
    const totalLogTime = Game.cpu.getUsed() - logTime
    logs.unshift(`[脚本性能数据] Shard:${Game.shard.name} Time:${Game.time} 脚本总耗时:${formatTime(totalUsed)} (${totalUsed.toFixed(2)}ms, ${(totalUsed / Game.cpu.limit * 100).toFixed(2)}%)`)
    logs.push(`执行耗时:${formatTime(scriptUsed)} (其中逻辑耗时:${formatTime(logicTime)}, 固定消耗:${formatTime(actions * 0.2)}), 数据统计:${formatTime(this.profilerTime)}, 数据整理:${formatTime(totalLogTime)}`)
    console.log(logs.join('\n'))
  }
}

export const profiler = new Profiler()

type PickByType<T, U> = { [P in keyof T as T[P] extends U ? P : never]: T[P] }
function markAsActionMethod<T extends { constructor: Function }>(obj: { prototype: T }, objName: string, keys: (keyof PickByType<T, Function>)[]) {
  if (!import.meta.env.PROFILER)
    return
  for (const key of keys) {
    const original = obj.prototype[key] as unknown as Function
    const name = `${objName}.${key}`
    obj.prototype[key] = function (this: any, ...args: any[]) {
      const result = original.apply(this, args)
      if (result === OK)
        profiler.countAction(name)
      return result
    } as any
  }
}

if (import.meta.env.PROFILER) {
  markAsActionMethod(ConstructionSite, 'ConstructionSite', ['remove'])
  markAsActionMethod(Creep, 'Creep', ['attack', 'attackController', 'build', 'claimController', 'dismantle', 'drop', 'generateSafeMode', 'harvest', 'heal', 'move', 'moveByPath', 'moveTo', 'notifyWhenAttacked', 'pickup', 'rangedAttack', 'rangedHeal', 'rangedMassAttack', 'repair', 'reserveController', 'signController', 'suicide', 'transfer', 'upgradeController', 'withdraw'])
  markAsActionMethod(Flag, 'Flag', ['remove', 'setColor', 'setPosition'])
  markAsActionMethod({ prototype: Game }, 'Game', ['notify'])
  markAsActionMethod({ prototype: Game.market }, 'Game.market', ['cancelOrder', 'changeOrderPrice', 'createOrder', 'deal', 'extendOrder'])
  markAsActionMethod(PowerCreep, 'PowerCreep', ['delete', 'drop', 'enableRoom', 'move', 'moveByPath', 'moveTo', 'notifyWhenAttacked', 'pickup', 'renew', 'spawn', 'suicide', 'transfer', 'upgrade', 'usePower', 'withdraw'])
  markAsActionMethod(Room, 'Room', ['createConstructionSite', 'createFlag'])
  markAsActionMethod(RoomPosition, 'RoomPosition', ['createConstructionSite', 'createFlag'])
  markAsActionMethod(Structure, 'Structure', ['destroy', 'notifyWhenAttacked'])
  markAsActionMethod(StructureController, 'StructureController', ['activateSafeMode', 'unclaim'])
  markAsActionMethod(StructureFactory, 'StructureFactory', ['produce'])
  markAsActionMethod(StructureLab, 'StructureLab', ['boostCreep', 'reverseReaction', 'runReaction', 'unboostCreep'])
  markAsActionMethod(StructureLink, 'StructureLink', ['transferEnergy'])
  markAsActionMethod(StructureNuker, 'StructureNuker', ['launchNuke'])
  markAsActionMethod(StructureObserver, 'StructureObserver', ['observeRoom'])
  markAsActionMethod(StructurePowerSpawn, 'StructurePowerSpawn', ['processPower'])
  markAsActionMethod(StructureRampart, 'StructureRampart', ['setPublic'])
  markAsActionMethod(StructureSpawn, 'StructureSpawn', ['spawnCreep', 'recycleCreep', 'renewCreep'])
  markAsActionMethod(StructureSpawn.Spawning, 'StructureSpawn.Spawning', ['cancel', 'setDirections'])
  markAsActionMethod(StructureTerminal, 'StructureTerminal', ['send'])
  markAsActionMethod(StructureTower, 'StructureTower', ['attack', 'heal', 'repair'])
}

/**
 * 将一个函数加入 profiler\
 * 当此修饰器在 cacheMethod 等修饰器之后，在 cache 命中时不会 profile
 */
export function profileMethod(label?: string) {
  if (import.meta.env.PROFILER) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const className = 'className' in target && typeof target.className === 'string' ? target.className : target.constructor.name
      const name = label ? `${label} (${className}.${propertyKey})` : `${className}.${propertyKey}`
      const originalMethod = descriptor.value
      descriptor.value = function (...args: any[]) {
        const item = profiler.enter(name)
        const result = originalMethod.apply(this, args)
        profiler.exit(item)
        return result
      }
      return descriptor
    }
  }
  else {
    return function () {}
  }
}

/**
 * 将整个 class 的所有 method 加入 profiler\
 * 对于原型注入的函数仍生效，并只对注入的函数生效\
 * 不包括 constructor
 */
export function profileClass(label?: string) {
  if (import.meta.env.PROFILER) {
    return function (target: any) {
      const className = 'className' in target && typeof target.className === 'string' ? target.className : target.constructor.name
      for (const propertyKey of Object.getOwnPropertyNames(target.prototype)) {
        if (propertyKey === 'constructor')
          continue
        const descriptor = Object.getOwnPropertyDescriptor(target.prototype, propertyKey)
        if (!descriptor)
          continue
        if (descriptor.value) {
          const originalMethod = descriptor.value
          const name = label ? `(${label})${className}.${propertyKey}` : `${className}.${propertyKey}`
          descriptor.value = function (...args: any[]) {
            const item = profiler.enter(name)
            const result = originalMethod.apply(this, args)
            profiler.exit(item)
            return result
          }
          Object.defineProperty(target.prototype, propertyKey, descriptor)
        }
      }
      return target
    }
  }
  else {
    return function () {}
  }
}
