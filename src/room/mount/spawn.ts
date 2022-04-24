/**
 * *************** 此文件代码无需理解,只需会用即可 ***************
 */
import { roleData } from '@/creep/constant/spawn'
import type { BodyParam } from '@/utils'
import { profileMethod, reduceBodyUntilFit, sortByKey } from '@/utils'

/* 房间原型拓展   --内核  --房间孵化 */
export default class RoomSpawnExtension extends Room {
  /**
   * 孵化总函数
   */
  @profileMethod()
  public spawnMain(): void {
    if (!this.controller)
      return

    this.spawnConfigInit()
    this.spawnConfigModify()
    this.processNumSpawn()
    this.economy()
  }

  /**
   * 爬虫孵化配置初始化，每次脚本更新时执行
   */
  public spawnConfigInit(): void {
    if (this.memory.spawnConfigLastUpdate === import.meta.env.BUILD_TIME)
      return
    this.memory.spawnConfigLastUpdate = import.meta.env.BUILD_TIME

    if (!this.memory.spawnConfig)
      this.memory.spawnConfig = {}

    for (const role in roleData) {
      const data = roleData[role]

      // 跳过无需 init 的角色
      if (!data.init)
        continue

      const last = this.memory.spawnConfig[role]
      delete this.memory.spawnConfig[role]
      const body = data.adaption?.[this.controller!.level].body || data.body
      // 跳过在当前等级没有 body 配置的角色
      if (!body)
        continue
      this.memory.spawnConfig[role] = {
        num: last?.manual ? last.num : data.adaption?.[this.controller!.level].num || 0,
        body,
        priority: data.priority,
        ignoreWar: data.ignoreWar,
        adaptive: !!data.adaption,
        reduceToEA: data.reduceToEA,
      }
    }
  }

  /**
   * 爬虫孵化配置二次加工 【随房间控制等级的变化而变化】
   */
  public spawnConfigModify(): void {
    if (!this.controller)
      return
    const currentLevel = this.controller.level

    // 仅在等级变化时执行
    if (currentLevel !== this.memory.originLevel) {
      for (const role in this.memory.spawnConfig) {
        // 跳过无效的 role
        if (!(role in roleData))
          continue
        const data = roleData[role]

        const memData = this.memory.spawnConfig[role]

        // 跳过非自适应性爬的更新
        if (!data.adaption)
          continue

        // 更新部件信息
        const body = data.adaption[currentLevel].body || data.body
        if (!body) {
          delete this.memory.spawnConfig[role]
          continue
        }
        this.memory.spawnConfig[role].body = body

        // 更新适应性爬的需求数量
        if (!memData.manual)
          memData.num = data.adaption[currentLevel].num || 0
      }
    }
  }

  /**
   * 常驻爬虫孵化管理器 (任务爬虫是另外一个孵化函数)
   */
  @profileMethod()
  public processNumSpawn(): void {
    for (const role in this.memory.spawnConfig) {
      const memData = this.memory.spawnConfig[role]

      // 战争状态下爬虫停止生产
      if (this.memory.state === 'war') {
        if (!memData.ignoreWar)
          continue
      }

      // 固定补员型
      let currentNum = global.creepNumData[this.name][role] || 0

      // 删掉任务类型的爬
      if (currentNum === 0 && memData.mission) {
        delete this.memory.spawnConfig[role]
        continue
      }

      // 满足目标则跳过
      if (currentNum >= memData.num)
        continue

      // 统计孵化列队中任务的个数
      const spawnNum = this.getNumInSpawnListByRole(role)
      currentNum += spawnNum
      if (currentNum >= memData.num)
        continue

      // 添加一个孵化任务进孵化队列
      this.addSpawnMission(role, memData.body, memData.priority, memData.mem)
    }
  }

  /**
   * 孵化函数
   */
  @profileMethod()
  public spawnExecution(): void {
    // 没有孵化任务
    if (!this.memory.spawnQueue?.length)
      return
    // 没有 spawn
    if (!this.memory.structureIdData?.spawn?.length)
      return

    const queue = this.memory.spawnQueue
    for (const spawnId of this.memory.structureIdData.spawn) {
      const thisSpawn = Game.getObjectById(spawnId)
      if (!thisSpawn) {
        // 没有该 spawn 说明 spawn 已经被摧毁或者被拆除了，删除 structureIdData 里的数据
        this.memory.structureIdData.spawn.splice(this.memory.structureIdData.spawn.indexOf(spawnId), 1)
        continue
      }
      // 正在孵化就跳过该spawn
      if (thisSpawn.spawning)
        continue

      const roleName = queue[0].role
      const roleMemData = this.memory.spawnConfig[roleName]
      const mem = queue[0].memory

      // 如果 global 有该爬虫的部件信息，优先用 global 的数据
      let bodyParam = global.SpecialBodyData[this.name][roleName]
        ?? queue[0].body

      // 任务爬虫特殊体型处于最高优先级
      if (mem?.msb && mem.taskRB) {
        if (global.MSB[mem.taskRB]?.[roleName])
          bodyParam = global.MSB[mem.taskRB][roleName]
      }

      // 对爬虫部件进行自适应
      let reducedToEA = false
      let body = reduceBodyUntilFit(bodyParam, this.energyCapacityAvailable)
      // 对设置了自动适配到 energyAvailable 的爬虫进行二次自适应
      if (body.cost > this.energyAvailable && roleMemData.reduceToEA) {
        body = reduceBodyUntilFit(bodyParam, this.energyAvailable)
        reducedToEA = true
      }

      // boost
      const boostData: BoostData = {}
      for (const b in bodyParam)
        boostData[b] = {}

      // 记忆整理
      const creepMem = Object.assign({
        role: roleName,
        belong: this.name,
        shard: Game.shard.name,
        boostData,
        working: false,
        reducedToEA,
      }, mem)

      // 名称整理
      let name: string
      const label = roleData[roleName].label || '❓'
      if (['superbitch', 'ExtraDim'].includes(thisSpawn.owner.username)) {
        const int32 = Math.pow(2, 32)
        name = `${label}x${Math.ceil(Math.random() * int32).toString(16).toLocaleUpperCase().padStart(8, '0')}`
      }
      else {
        const timestr = Game.time.toString().slice(Game.time.toString().length - 4)
        const randomStr = Math.random().toString(36).slice(3)
        name = `${label} ${randomStr}+${timestr}`
      }

      const result = thisSpawn.spawnCreep(body.parts, name, { memory: creepMem })

      if (result !== OK)
        break

      // console.log(`即将删除: ${queue[0].role}, spawnID: ${thisSpawn.id}`)

      // 孵化成功，删除该孵化数据
      queue.splice(0, 1)

      // 删除特殊体型数据
      delete global.SpecialBodyData[this.name][roleName]

      // 列队空了就结束
      if (!queue.length)
        break
    }

    // 说明所有 spawn 都繁忙或当前能量不适合孵化该 creep
  }

  /**
   * [功能函数]添加孵化任务
   */
  public addSpawnMission(role: string, body: BodyParam, priority = 10, memory?: SpawnMemory): boolean {
    // 推入列队
    this.memory.spawnQueue.push({ role, body, priority, memory })
    // 根据优先级排序
    this.memory.spawnQueue.sort(sortByKey('priority'))
    return true
  }

  /**
   * [功能函数]查看孵化队列内指定角色的爬的数目
   */
  @profileMethod()
  public getNumInSpawnListByRole(role: string): number {
    if (!this.memory.spawnQueue)
      return 0

    return this.memory.spawnQueue.reduce((p, c) => c.role === role ? p + 1 : p, 0)
  }

  /**
   * [功能函数]指定孵化数量\
   * 会在脚本上传时重置至默认值
   */
  public setSpawnNum(role: string, num: number, priority?: number): boolean {
    const memData = this.memory.spawnConfig[role]
    if (memData?.mission) {
      console.log(`任务角色，不能进行自动孵化！role: ${role}`)
      return false
    }
    const data = roleData[role]
    if (!data) {
      console.log(`不存在该角色，不能进行自动孵化！role: ${role}`)
      return false
    }

    const body = this.controller
      ? data.adaption?.[this.controller.level].body || data.body
      : data.body
    if (!body) {
      console.log(`该角色没有一个适应的 body 配置，不能进行自动孵化！role: ${role}`)
      return false
    }

    if (!this.memory.spawnConfig[role]) {
      this.memory.spawnConfig[role] = {
        num,
        body,
        priority,
      }
    }

    this.memory.spawnConfig[role].num = num
    this.memory.spawnConfig[role].priority = priority
      || this.memory.spawnConfig[role].priority
      || roleData[role].priority
      || 10

    return true
  }

  /**
   * [功能函数]单次孵化一个指定 role 的爬
   */
  public addSpawnMissionByRole(role: string, priority?: number, mem?: SpawnMemory): boolean {
    const data = roleData[role]
    const body = this.controller
      ? data.adaption?.[this.controller.level].body || data.body
      : data.body
    if (!body) {
      console.log(`该角色没有一个适应的 body 配置！role: ${role}`)
      return false
    }
    return this.addSpawnMission(role, body, priority, mem)
  }

  /**
   * 经济模式特殊处理
   */
  public economy(): void {
    if (this.controller?.level !== 8 || !this.memory.economy)
      return

    if (this.controller.ticksToDowngrade < 180000)
      this.memory.spawnConfig.upgrade.num = 1
    else
      this.memory.spawnConfig.upgrade.num = 0
  }
}
