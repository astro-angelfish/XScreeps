import { processCreepWork } from './creep'
import { processRoomWork } from './room'
import { mountPrototype } from './misc/mount'
import { statCPU } from './misc/statCPU'
import { ErrorMapper } from '@/misc/errorMapper'
import { initMemory } from '@/misc/initMemory'
import { countCreeps } from '@/misc/statistic'
import { pixel } from '@/misc/pixel'
import { initShardMemory, processShard } from '@/shard'
import { tickResourceDispatch } from '@/room/dispatch/resource'
import layoutVisual from '@/room/layoutVisual'
import { processSquads } from '@/creep/squad'
import { stateScanner } from '@/misc/stat'
import { showTowerData } from '@/misc/visual'
import { haveShards, profiler } from '@/utils'

/**
 * 主运行函数
 */
export const loop = ErrorMapper.wrapLoop(() => {
  profiler.reset()

  profiler.enter('Memory 初始化')

  // Memory 初始化
  initMemory()

  profiler.exit()

  profiler.enter('跨 Shard 通讯')

  // 跨 shard 初始化
  if (haveShards)
    initShardMemory()

  // 跨 shard 记忆运行
  if (haveShards)
    processShard()

  profiler.exit()

  profiler.enter('原型拓展挂载')

  // 原型拓展挂载
  mountPrototype()

  profiler.exit()

  profiler.enter('房间框架')

  // 爬虫数量统计及死亡 Memory 回收
  countCreeps()

  // 房间框架运行
  processRoomWork()

  profiler.exit()

  profiler.enter('爬虫')

  // 爬虫运行
  processCreepWork()

  profiler.exit()

  profiler.enter('杂项')

  // 四人小队模块
  processSquads()

  // 跨 shardMemory 提交
  if (haveShards)
    InterShardMemory.setLocal(JSON.stringify(global.intershardData))

  // 资源调度超时管理
  tickResourceDispatch()

  // 像素
  pixel()

  // 布局可视化
  layoutVisual()

  // 防御塔数据展示 更新
  showTowerData()

  // 状态统计 screepsplus
  stateScanner()

  // CPU计算
  statCPU()

  profiler.exit()

  if (global.logProfiler) {
    profiler.log()
    delete global.logProfiler
  }
  // if (Game.shard.name === 'shard3')
  //   profiler.log()
})
