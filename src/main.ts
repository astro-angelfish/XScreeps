import { ErrorMapper } from '@/_errorMap/errorMapper'
import { initMemory } from '@/module/global/init'
import { CreepNumStatistic } from '@/module/global/statistic'
import { pixel } from '@/module/fun/pixel'
import { initShardMemory, processShardMemory } from '@/module/shard/base'
import { ResourceDispatchTick } from '@/module/dispatch/resource'
import layoutVisual from '@/module/layoutVisual'
import { SquadManager } from '@/module/squad/base'
import { stateScanner } from '@/module/stat/stat'
import { showTowerData } from '@/module/visual/visual'
import { statCPU } from '@/module/fun/funtion'
import { profiler } from '@/utils'
import mountPrototype from '@/mount'
import CreepWork from '@/boot/creepWork'
import RoomWork from '@/boot/roomWork'

/**
 * 主运行函数
 */
export const loop = ErrorMapper.wrapLoop(() => {
  profiler.reset(false)
  // profiler.reset(Game.shard.name === 'shard3')

  profiler.enter('Memory 初始化')

  // Memory 初始化
  initMemory()

  profiler.exit()

  profiler.enter('跨 Shard 通讯')

  // 跨 shard 初始化
  initShardMemory()

  // 跨 shard 记忆运行
  processShardMemory()

  profiler.exit()

  profiler.enter('原型拓展挂载')

  // 原型拓展挂载
  mountPrototype()

  profiler.exit()

  profiler.enter('房间框架')

  // 爬虫数量统计及死亡 Memory 回收
  CreepNumStatistic()

  // 房间框架运行
  RoomWork()

  profiler.exit()

  profiler.enter('爬虫')

  /* 爬虫运行 */
  CreepWork()

  profiler.exit()

  profiler.enter('杂项')

  /* 四人小队模块 */
  SquadManager()

  /* 资源调度超时管理 */
  ResourceDispatchTick()

  /* 像素 */
  pixel()

  /* 布局可视化 */
  layoutVisual()

  /* 防御塔数据展示 更新 */
  showTowerData()

  /* 状态统计 screepsplus */
  stateScanner()

  /* CPU计算 */
  statCPU()

  profiler.exit()

  profiler.log()
})
