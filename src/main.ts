/* errormap */
import { ErrorMapper } from './_errorMap/errorMapper'
import { MemoryInit } from './module/global/init'
/* 原型挂载 */
import Mount from '@/mount'
import RoomWork from '@/boot/roomWork'
import CreepWork from '@/boot/creepWork'
import { CreepNumStatistic } from './module/global/statistic'
import { pixel } from './module/fun/pixel'
/**
 * 主运行函数
 */
export const loop = ErrorMapper.wrapLoop(() =>{
    /* Memory初始化 */
    MemoryInit()
    /* 原型拓展挂载 */
    Mount()
    /* 爬虫统计及死亡Memory回收 */
    CreepNumStatistic()
    /* 房间框架运行 */
    RoomWork()
    /* 爬虫运行 */
    CreepWork()

    /* 像素 */
    pixel()
})
