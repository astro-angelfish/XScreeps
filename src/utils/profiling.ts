class Profiler {
  startTime: number
  enabled = false
  currentStack: string[] = []
  startTimes: Record<string, number> = {}
  endTimes: Record<string, number> = {}

  constructor() {
    this.startTime = Game.cpu.getUsed()
  }

  reset(enable = false) {
    this.startTime = Game.cpu.getUsed()
    this.enabled = enable
    this.currentStack = []
    this.startTimes = {}
    this.endTimes = {}
  }

  enable() {
    this.enabled = true
  }

  enter(name: string) {
    if (!this.enabled)
      return
    this.currentStack.push(name)
    this.startTimes[this.currentStack.join('.')] = Game.cpu.getUsed()
  }

  exit() {
    if (!this.enabled || !this.currentStack.length)
      return
    this.endTimes[this.currentStack.join('.')] = Game.cpu.getUsed()
    this.currentStack.pop()
  }

  log() {
    if (!this.enabled)
      return

    if (this.currentStack.length)
      for (let i = 0; i < this.currentStack.length; i++) this.exit()

    const iter = (keys: string[], prefix: string[]) => {
      if (prefix.length) {
        const spaceBefore = '  '.repeat(prefix.length)
        const fullKey = prefix.join('.')
        if (fullKey in this.endTimes) {
          const start = this.startTimes[fullKey]
          const end = this.endTimes[fullKey]
          const duration = end - start
          console.log(`${spaceBefore}${prefix.at(-1)} ${(duration * 1000).toFixed(2)}μs`)
        }
        else {
          console.log(`${spaceBefore}${prefix.at(-1)}`)
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

    console.log(`脚本性能数据 Shard:${Game.shard.name} Time:${Game.time}`)
    iter(Object.keys(this.endTimes), [])
  }
}

export const profiler = new Profiler()
