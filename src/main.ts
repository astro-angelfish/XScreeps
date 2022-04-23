/* error map */
import { ErrorMapper } from './_errorMap/errorMapper'
import { MemoryInit } from './module/global/init'
/* 原型挂载 */
import Mount from '@/mount'
import RoomWork from '@/boot/roomWork'
import CreepWork from '@/boot/creepWork'
import { CreepNumStatistic } from './module/global/statistic'
import { pixel } from './module/fun/pixel'
import { ResourceDispatchTick } from './module/dispatch/resource'
import layoutVisual from './module/layoutVisual'
import { SquadManager } from './module/squad/squard'
import { stateScanner } from './module/stat/stat'
import { showTowerData } from './module/visual/visual'
import { statCPU } from './module/fun/funtion'
import { InterShardManager } from './module/shard/intershard'
/**
 * 主运行函数
 */
export const loop = ErrorMapper.wrapLoop(() => {
    let a = Game.cpu.getUsed()

    /* Memory初始化 */
    MemoryInit()
    let a1 = Game.cpu.getUsed()
    /* 跨shard初始化 */
    // InitShardMemory()

    /* 跨shard记忆运行 */
    InterShardManager()

    let b = Game.cpu.getUsed()

    /* 原型拓展挂载 */
    Mount()

    let c = Game.cpu.getUsed()

    /* 爬虫数量统计及死亡Memory回收 */
    CreepNumStatistic()

    /* 房间框架运行 */
    RoomWork()

    let d = Game.cpu.getUsed()

    /* 爬虫运行 */
    CreepWork()

    let e = Game.cpu.getUsed()

    /* 四人小队模块 */
    SquadManager()

    /* 跨shardMemory提交 */
    InterShardMemory.setLocal(JSON.stringify(global.intershardData))


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

    let f = Game.cpu.getUsed()
    // if (Game.shard.name == 'shard3')
    // {
    //     /* 分析cpu */
    //     console.log("-----------------------------cpu消耗分析----------------------------------------")
    //     console.log("Memory初始化:",a1-a)
    //     console.log("shard初始化:",b-a1)
    //     console.log("原型挂载:",c-b)
    //     console.log("房间框架:",d-c)
    //     console.log("爬虫:",e-d)
    //     console.log("其他杂项:",f-e)
    // }

})
