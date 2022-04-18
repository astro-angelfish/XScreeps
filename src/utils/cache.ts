import { hash, murmurHash } from 'ohash'

/**
 * 简单介绍：
 * 这是一个通用的缓存修饰，可以用于一键缓存使用原型注入形式的函数的返回值。
 * 由于 Screeps 本身并不支持修饰，此修饰只适用于已有的 TypeScript 项目，没有 js 版本的计划。
 *
 * 使用说明：
 * 1. 在 `tsconfig.json` 中配置 `compilerOptions.experimentalDecorators` 为 `true`
 * @example `tsconfig.json` 的例子：
 * {
 *   "exclude": ["node_modules"],
 *   "compilerOptions": {
 *     "module": "ESNext",
 *     "target": "ES2017",
 *     "experimentalDecorators": true
 *   }
 * }
 *
 * 2. 安装 `ohash` 包，如果你在使用 npm 就在命令行运行 `npm i ohash`
 *
 * 3. 在需要缓存的 class 内函数定义处使用 `cacheMethod` / `cacheMethodJSON` / `cacheMethodOHash` 修饰
 * @example 小例子
 * import { cacheMethod, cacheMethodJSON, cacheMethodOHash } from './cache'
 *
 * class RoomFindExtension extends Room {
 *   // 这个 `findLinks` 函数将会被缓存，一 tick 只会执行最多一次
 *   @cacheMethod()
 *   findLinks() {
 *     return this.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_LINK)
 *   }
 *
 *   // 这个 `findLeastHits` 函数将依靠传入的 type 参数缓存，同一个 type 每 tick 只会执行一次，最多缓存十个
 *   @cacheMethodJSON(10)
 *   findLeastHits(type: StructureConstant) {
 *     return this.find(FIND_STRUCTURES)
 *       .filter(s => s.structureType === type)
 *       .reduce((pv, cv) => (pv ? pv.hits / pv.hitsMax : 1) < cv.hits / cv.hitsMax ? pv : cv)
 *   }
 *
 *   // 这个 `findLeastHitsMulti` 函数将依靠传入的 types 参数缓存，types 内容相同(不在乎顺序)时每 tick 只会执行一次，没有缓存限制
 *   @cacheMethodOHash()
 *   findLeastHitsMulti(types: StructureConstant[]) {
 *     return this.find(FIND_STRUCTURES)
 *       .filter(s => types.includes(s.structureType))
 *       .reduce((pv, cv) => (pv ? pv.hits / pv.hitsMax : 1) < cv.hits / cv.hitsMax ? pv : cv)
 *   }
 * }
 */

/**
 * 缓存一个函数的返回值，不考虑传入参数
 */
export function cacheMethod() {
  const cacheRand = Math.random().toString(36).slice(2)

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const cacheKey = `__cache_${propertyKey}_${cacheRand}`

    const originalMethod = descriptor.value
    descriptor.value = function(this: any, ...args: any[]) {
      if (this[cacheKey])
        return this[cacheKey]
      return this[cacheKey] = originalMethod.apply(this, args)
    }
    return descriptor
  }
}

/**
 * 按传入参数缓存该函数的返回值。当函数传入的参数相同时，返回相同参数的缓存内容\
 * 函数的参数使用 JSON.stringify 获取 hash 值，在参数内对象、数组顺序不同或参数内含有函数时，缓存将失效\
 * hash 比较耗时，建议自己尝试加入缓存后是否真的有性能提升
 * @param limit 最多缓存的个数，默认不限制，对于 Room 等每 tick 重置的对象不建议设置
 */
export function cacheMethodJSON(limit = 0) {
  let keys: string[] | undefined
  if (limit > 0)
    keys = []

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function(this: any, ...args: any[]) {
      // 当参数内含有函数时跳过缓存
      if (args.some(arg => typeof arg === 'function'))
        return originalMethod.apply(this, args)

      // 计算 hash
      const hashedArgs = murmurHash(JSON.stringify(args))
      const cacheKey = `__cache_${propertyKey}_${hashedArgs}`

      // 有缓存时直接返回
      if (this[cacheKey])
        return this[cacheKey]

      // 无缓存时调用函数
      const result = originalMethod.apply(this, args)
      this[cacheKey] = result

      if (keys) {
        // 记录 hash
        keys.push(cacheKey)

        // 删除旧的缓存
        if (keys.length > limit) {
          const key = keys.shift()!
          delete this[key]
        }
      }

      return result
    }
    return descriptor
  }
}

/**
 * 按传入参数缓存该函数的返回值。当函数传入的参数相同时，返回相同参数的缓存内容\
 * 函数的参数使用 ohash 获取 hash 值，对任何类型的传入参数都兼容并能正确处理（包括顺序不同的对象、数组、函数）\
 * hash 比较耗时，建议自己尝试加入缓存后是否真的有性能提升
 * @param limit 最多缓存的个数，默认不限制，对于 Room 等每 tick 重置的对象不建议设置
 */
export function cacheMethodOHash(limit = 0) {
  let keys: string[] | undefined
  if (limit > 0)
    keys = []

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function(this: any, ...args: any[]) {
      // 计算 hash
      const hashedArgs = hash(args, {
        unorderedArrays: true,
        unorderedObjects: true,
        unorderedSets: true,
      })
      const cacheKey = `__cache_${propertyKey}_${hashedArgs}`

      // 有缓存时直接返回
      if (this[cacheKey])
        return this[cacheKey]

      // 无缓存时调用函数
      const result = originalMethod.apply(this, args)
      this[cacheKey] = result

      if (keys) {
        // 记录 hash
        keys.push(cacheKey)

        // 删除旧的缓存
        if (keys.length > limit) {
          const key = keys.shift()!
          delete this[key]
        }
      }

      return result
    }
    return descriptor
  }
}
