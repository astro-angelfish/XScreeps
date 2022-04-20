class Profiler {
  startTime: number
  currentStack: string[] = []
  startTimes: Record<string, number> = {}
  endTimes: Record<string, number> = {}
  profilerTime = 0

  constructor() {
    this.startTime = Game.cpu.getUsed()
  }

  reset() {
    this.startTime = Game.cpu.getUsed()
    this.currentStack = []
    this.startTimes = {}
    this.endTimes = {}
    this.profilerTime = 0
  }

  enter(name: string) {
    if (!import.meta.env.PROFILER)
      return
    this.profilerTime -= Game.cpu.getUsed()

    name = name.replace(/\./g, '_DOT_')
    this.currentStack.push(name)
    this.startTimes[this.currentStack.join('.')] = Game.cpu.getUsed()

    this.profilerTime += Game.cpu.getUsed()
  }

  exit(name?: string) {
    if (!import.meta.env.PROFILER || !this.currentStack.length)
      return
    this.profilerTime -= Game.cpu.getUsed()

    if (name) {
      name = name.replace(/\./g, '_DOT_')
      if (this.currentStack.at(-1) !== name) {
        const index = this.currentStack.indexOf(name)
        if (index !== -1)
          this.currentStack.splice(index + 1)
        else this.currentStack.push(name)
      }
    }
    this.endTimes[this.currentStack.join('.')] = Game.cpu.getUsed()
    this.currentStack.pop()

    this.profilerTime += Game.cpu.getUsed()
  }

  log() {
    if (!import.meta.env.PROFILER)
      return

    this.profilerTime -= Game.cpu.getUsed()

    if (this.currentStack.length)
      for (let i = 0; i < this.currentStack.length; i++) this.exit()

    const logs = []
    const iter = (keys: string[], prefix: string[]) => {
      if (prefix.length) {
        const spaceBefore = '  '.repeat(prefix.length)
        const fullKey = prefix.join('.')
        if (fullKey in this.endTimes) {
          const start = this.startTimes[fullKey]
          const end = this.endTimes[fullKey]
          const duration = end - start
          logs.push(`${spaceBefore}${prefix.at(-1)!.replace(/_DOT_/g, '.')} ${(duration * 1000).toFixed(2)}μs`)
        }
        else {
          logs.push(`${spaceBefore}${prefix.at(-1)!.replace(/_DOT_/g, '.')}`)
        }
      }

      const children: Record<string, string[]> = {}

      for (const key of keys) {
        const index = key.indexOf('.')
        if (index === -1) {
          if (!(key in children))
            children[key] = []
          continue
        }

        const name = key.slice(0, index)
        const rest = key.slice(index + 1)

        if (!(name in children))
          children[name] = []
        children[name].push(rest)
      }

      for (const name in children)
        iter(children[name], prefix.concat(name))
    }
    iter(Object.keys(this.endTimes), [])

    this.profilerTime += Game.cpu.getUsed()

    const totalUsed = Game.cpu.getUsed() - this.startTime
    logs.unshift(`[脚本性能数据] Shard:${Game.shard.name} Time:${Game.time} CPU:${(totalUsed * 1000).toFixed(2)}μs(${totalUsed}ms, ${(totalUsed / Game.cpu.limit * 100).toFixed(2)}%, profiling:${(this.profilerTime * 1000).toFixed(2)}μs)`)
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
      const originalMethod = descriptor.value
      descriptor.value = function(...args: any[]) {
        const name = label ? `${label} (${className}.${propertyKey})` : `${className}.${propertyKey}`
        profiler.enter(name)
        const result = originalMethod.apply(this, args)
        profiler.exit(name)
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
          descriptor.value = function(...args: any[]) {
            const name = label ? `(${label})${className}.${propertyKey}` : `${className}.${propertyKey}`
            profiler.enter(name)
            const result = originalMethod.apply(this, args)
            profiler.exit(name)
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
