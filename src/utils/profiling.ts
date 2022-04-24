import { colorfyLog } from './log'

interface StackItem {
  id: number
  time: number
}
interface TableItem {
  id: number
  stackLength: number
  time: number
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
    this.profilerTime -= Game.cpu.getUsed()

    const id = this.register(name)
    const item = {
      id,
      time: Game.cpu.getUsed(),
    }
    this.stack.push(item)
    this.table.push([])

    this.profilerTime += Game.cpu.getUsed()

    return item
  }

  enterId(id: number) {
    if (!import.meta.env.PROFILER)
      return
    this.profilerTime -= Game.cpu.getUsed()

    const item = {
      id,
      time: Game.cpu.getUsed(),
    }
    this.stack.push(item)
    this.table.push([])

    this.profilerTime += Game.cpu.getUsed()

    return item
  }

  exit(item?: StackItem) {
    if (!import.meta.env.PROFILER || !this.stack.length || !this.table.length)
      return
    this.profilerTime -= Game.cpu.getUsed()

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
    this.table[this.table.length - 1].push({
      id: item.id,
      stackLength: this.stack.length + 1,
      time: Game.cpu.getUsed() - item.time,
    }, ...tableItems)

    this.profilerTime += Game.cpu.getUsed()
  }

  log() {
    if (!import.meta.env.PROFILER)
      return

    const scriptUsed = Game.cpu.getUsed() - this.startTime
    const logTime = Game.cpu.getUsed()

    if (this.stack.length)
      for (let i = 0; i < this.stack.length; i++) this.exit()

    const colorifyTime = (time: number) => {
      const text = `${(time * 1000).toFixed(2)}μs ${((time / scriptUsed) * 100).toFixed(2)}%`
      if (time < 0.2)
        return colorfyLog(text, 'green')
      else if (time < 0.5)
        return colorfyLog(text, 'yellow')
      else if (time < 1)
        return colorfyLog(text, 'orange')
      else
        return colorfyLog(text, 'red')
    }

    const logs = []
    for (const item of this.table[0]) {
      const name = this.idToNameMap.get(item.id)
      if (!name)
        continue
      logs.push(`${'  '.repeat(item.stackLength)}- ${name} ${colorifyTime(item.time)}`)
    }

    const totalUsed = Game.cpu.getUsed() - this.startTime
    const totalLogTime = Game.cpu.getUsed() - logTime
    logs.unshift(`[脚本性能数据] Shard:${Game.shard.name} Time:${Game.time} CPU:${(totalUsed * 1000).toFixed(2)}μs (${totalUsed.toFixed(2)}ms, ${(totalUsed / Game.cpu.limit * 100).toFixed(2)}%, profiling:${(this.profilerTime * 1000).toFixed(2)}μs, log:${(totalLogTime * 1000).toFixed(2)}μs)`)
    console.log(logs.join('\n'))
  }
}

export const profiler = new Profiler()

/**
 * 将一个函数加入 profiler\
 * 当此修饰器在 cacheMethod 等修饰器之后，在 cache 命中时不会 profile
 */
export function profileMethod(label?: string) {
  if (import.meta.env.PROFILER) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const className = 'className' in target && typeof target.className === 'string' ? target.className : target.constructor.name
      const name = label ? `${label} (${className}.${propertyKey})` : `${className}.${propertyKey}`
      const originalMethod = descriptor.value
      descriptor.value = function(...args: any[]) {
        const item = profiler.enter(name)
        const result = originalMethod.apply(this, args)
        profiler.exit(item)
        return result
      }
      return descriptor
    }
  }
  else {
    return function() {}
  }
}

/**
 * 将整个 class 的所有 method 加入 profiler\
 * 对于原型注入的函数仍生效，并只对注入的函数生效\
 * 不包括 constructor
 */
export function profileClass(label?: string) {
  if (import.meta.env.PROFILER) {
    return function(target: any) {
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
          descriptor.value = function(...args: any[]) {
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
    return function() {}
  }
}
