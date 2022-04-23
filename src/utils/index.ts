export * from './body'
export * from './log'
export * from './profiling'
export * from './position'
export * from './cache'
export * from './room'
export * from './mount'
export * from './memory'
export * from './resource'
export * from './creep'

export const initialTick = Game.time
export const haveShards = typeof InterShardMemory !== 'undefined'

/**
 * 按照列表中某个属性进行排序，配合sort使用
 */
export function sortByKey<T, K extends keyof T>(property: K) {
  return (a: T, b: T) => {
    const value1 = a[property]
    const value2 = b[property]
    return Number(value1) - Number(value2)
  }
}

/**
 * 生成一个不会重复的ID
 */
export function generateID(): string {
  return `${Math.random().toString(36).slice(3)}${Game.time}`
}
