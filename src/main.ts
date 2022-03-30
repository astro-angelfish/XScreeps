/* error map */
import { ErrorMapper } from './_errorMap/errorMapper'
import { MemoryInit } from './module/global/init'
/* 原型挂载 */
import Mount from '@/mount'
import RoomWork from '@/boot/roomWork'
import CreepWork from '@/boot/creepWork'
import { CreepNumStatistic } from './module/global/statistic'
import { pixel } from './module/fun/pixel'
import { InitShardMemory, InterShardRun } from './module/shard/base'
import { ResourceDispatchTick } from './module/dispatch/resource'
import layoutVisual from './module/layoutVisual'
import { SquadManager } from './module/squad/squard'
import { stateScanner } from './module/stat/stat'
import { showTowerData } from './module/visual/visual'
/**
 * 主运行函数
 */
export const loop = ErrorMapper.wrapLoop(() =>{

    /* Memory初始化 */
    MemoryInit()            // Memory room creep flag 

    /* 跨shard初始化 */
    InitShardMemory()

    /* 跨shard记忆运行 */
    InterShardRun()

    /* 原型拓展挂载 */
    Mount()

    /* 爬虫数量统计及死亡Memory回收 */
    CreepNumStatistic()

    /* 房间框架运行 */
    RoomWork()

    /* 爬虫运行 */
    CreepWork()

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


})
